import { prisma } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';
import * as xlsx from 'xlsx';
import { Builder } from 'xml2js';
import AdmZip from 'adm-zip';

export class ExportService {
  private exportsDir = path.resolve(process.cwd(), 'src/uploads/exports');

  constructor() {
    if (!fs.existsSync(this.exportsDir)) {
      fs.mkdirSync(this.exportsDir, { recursive: true });
    }
  }

  // ─── List Exports ──────────────────────────────────────────────────────────
  public async listExports(userId: string) {
    return prisma.export.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
        history: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  // ─── Get Export Details ──────────────────────────────────────────────────────
  public async getExportDetails(id: string) {
    return prisma.export.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
        history: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  // ─── Create Export Job ───────────────────────────────────────────────────────
  public async createExportJob(data: {
    format: string;
    modules: string[];
    filterType: string;
    filterParams?: any;
    userId: string;
  }) {
    const exportRecord = await prisma.export.create({
      data: {
        format: data.format.toUpperCase(),
        modules: data.modules.join(','),
        filterType: data.filterType.toUpperCase(),
        filterParams: data.filterParams ? JSON.stringify(data.filterParams) : null,
        status: 'PENDING',
        userId: data.userId,
      },
    });

    await prisma.exportHistory.create({
      data: {
        exportId: exportRecord.id,
        status: 'PENDING',
        details: 'Trabalho de exportação agendado no servidor.',
      },
    });

    // Start asynchronous processing in background
    this.processExportInBackground(exportRecord.id).catch((err) => {
      console.error(`Falha no processamento da exportação ${exportRecord.id}:`, err);
    });

    return exportRecord;
  }

  // ─── Delete Export ───────────────────────────────────────────────────────────
  public async deleteExport(id: string) {
    const exportRecord = await prisma.export.findUnique({ where: { id } });
    if (exportRecord && exportRecord.filePath && fs.existsSync(exportRecord.filePath)) {
      try {
        fs.unlinkSync(exportRecord.filePath);
      } catch (err) {
        console.error('Falha ao remover arquivo físico de exportação:', err);
      }
    }
    return prisma.export.delete({ where: { id } });
  }

  // ─── Background Processor ────────────────────────────────────────────────────
  private async processExportInBackground(exportId: string) {
    await prisma.export.update({
      where: { id: exportId },
      data: { status: 'PROCESSING' },
    });

    await prisma.exportHistory.create({
      data: {
        exportId,
        status: 'PROCESSING',
        details: 'Processando consulta aos módulos e gerando estrutura de arquivos.',
      },
    });

    try {
      const exportRecord = await prisma.export.findUnique({ where: { id: exportId } });
      if (!exportRecord) throw new Error('Trabalho de exportação não encontrado.');

      const format = exportRecord.format.toLowerCase();
      const modules = exportRecord.modules.split(',');
      const filterType = exportRecord.filterType;
      const filterParams = exportRecord.filterParams ? JSON.parse(exportRecord.filterParams) : {};

      // 1. Fetch data from DB based on modules and filters
      const dataPayload: Record<string, any[]> = {};
      let totalRowsCount = 0;

      for (const mod of modules) {
        const rows = await this.fetchModuleData(mod, filterType, filterParams);
        dataPayload[mod] = rows;
        totalRowsCount += rows.length;
      }

      // 2. Generate file content based on format
      let generatedFilePath = '';
      let generatedFileName = `export_${exportId}_${Date.now()}`;

      if (format === 'zip') {
        generatedFileName += '.zip';
        generatedFilePath = path.join(this.exportsDir, generatedFileName);
        await this.generateZipFile(dataPayload, generatedFilePath);
      } else {
        // XML, JSON, CSV, XLSX, ODS
        const fileExt = format === 'excel' ? 'xlsx' : format;
        generatedFileName += `.${fileExt}`;
        generatedFilePath = path.join(this.exportsDir, generatedFileName);
        await this.generateSingleFile(dataPayload, format, generatedFilePath);
      }

      // 3. Get size
      const stats = fs.statSync(generatedFilePath);
      const sizeBytes = stats.size;

      // 4. Update status completed
      await prisma.export.update({
        where: { id: exportId },
        data: {
          status: 'COMPLETED',
          processedRows: totalRowsCount,
          totalRows: totalRowsCount,
          sizeBytes,
          filePath: generatedFilePath,
          fileName: generatedFileName,
        },
      });

      await prisma.exportHistory.create({
        data: {
          exportId,
          status: 'COMPLETED',
          details: `Exportação concluída com sucesso. ${totalRowsCount} registros exportados. Tamanho: ${(sizeBytes / 1024).toFixed(1)} KB`,
        },
      });
    } catch (err: any) {
      await prisma.export.update({
        where: { id: exportId },
        data: { status: 'FAILED' },
      });

      await prisma.exportHistory.create({
        data: {
          exportId,
          status: 'FAILED',
          details: `Falha na exportação: ${err?.message || 'Erro interno desconhecido'}`,
        },
      });
    }
  }

  // ─── Fetch Module Data ────────────────────────────────────────────────────────
  private async fetchModuleData(
    mod: string,
    filterType: string,
    filterParams: any
  ): Promise<any[]> {
    const whereClause: any = {};

    // Apply period filter if applicable
    if (filterType === 'PERIODO' && filterParams.startDate && filterParams.endDate) {
      whereClause.createdAt = {
        gte: new Date(filterParams.startDate),
        lte: new Date(filterParams.endDate),
      };
    }

    switch (mod.toUpperCase()) {
      case 'ALUNOS': {
        const studentWhereClause: any = {};
        if (filterType === 'PERIODO' && filterParams.startDate && filterParams.endDate) {
          studentWhereClause.user = {
            createdAt: {
              gte: new Date(filterParams.startDate),
              lte: new Date(filterParams.endDate),
            },
          };
        }
        if (filterType === 'TURMA' && filterParams.classId) {
          studentWhereClause.classId = filterParams.classId;
        }
        if (filterType === 'ALUNO' && filterParams.studentId) {
          studentWhereClause.id = filterParams.studentId;
        }
        const students = await prisma.student.findMany({
          where: studentWhereClause,
          include: {
            user: { include: { profile: true } },
            class: true,
          },
        });
        return students.map((s) => ({
          ID: s.id,
          Nome: `${s.user.profile?.firstName || ''} ${s.user.profile?.lastName || ''}`.trim(),
          Email: s.user.email,
          CPF: s.cpf || '',
          RG: s.rg || '',
          Genero: s.gender || '',
          Telefone: s.user.profile?.phone || '',
          Turma: s.class?.name || '',
          Status: s.status,
          DataNascimento: s.user.profile?.birthDate
            ? new Date(s.user.profile.birthDate).toLocaleDateString('pt-BR')
            : '',
          Mae: s.motherName || '',
          Pai: s.fatherName || '',
          CriadoEm: s.user.createdAt.toISOString(),
        }));
      }

      case 'RESPONSAVEIS': {
        const guardians = await prisma.guardian.findMany({
          where: whereClause,
        });
        return guardians.map((g) => ({
          ID: g.id,
          Nome: g.name,
          Email: g.email || '',
          Telefone: g.phone || '',
          WhatsApp: g.whatsapp || '',
          Parentesco: g.relationship || '',
          Financeiro: g.isFinancial ? 'Sim' : 'Não',
          CriadoEm: g.createdAt.toISOString(),
        }));
      }

      case 'PROFESSORES': {
        const teachers = await prisma.teacher.findMany({
          where: whereClause,
          include: {
            user: { include: { profile: true } },
          },
        });
        return teachers.map((t) => ({
          ID: t.id,
          Nome: `${t.user.profile?.firstName || ''} ${t.user.profile?.lastName || ''}`.trim(),
          Email: t.user.email,
          Disciplinas: t.subjects || '',
          CargaHoraria: t.workload,
          Telefone: t.user.profile?.phone || '',
          CriadoEm: t.createdAt.toISOString(),
        }));
      }

      case 'FUNCIONARIOS': {
        const employees = await prisma.employee.findMany({
          where: whereClause,
          include: {
            user: { include: { profile: true } },
          },
        });
        return employees.map((e) => ({
          ID: e.id,
          Nome: `${e.user.profile?.firstName || ''} ${e.user.profile?.lastName || ''}`.trim(),
          Email: e.user.email,
          Departamento: e.department || '',
          Observacoes: e.notes || '',
          Telefone: e.user.profile?.phone || '',
          CriadoEm: e.createdAt.toISOString(),
        }));
      }

      case 'TURMAS': {
        if (filterType === 'TURMA' && filterParams.classId) {
          whereClause.id = filterParams.classId;
        }
        const classes = await prisma.class.findMany({
          where: whereClause,
          include: {
            room: true,
            teacher: { include: { user: { include: { profile: true } } } },
          },
        });
        return classes.map((c) => ({
          ID: c.id,
          Nome: c.name,
          SerieAno: c.gradeYear,
          AnoLetivo: c.schoolYear,
          Sala: c.room?.name || '',
          ProfessorResponsavel: c.teacher
            ? `${c.teacher.user.profile?.firstName || ''} ${c.teacher.user.profile?.lastName || ''}`.trim()
            : '',
          CriadoEm: c.createdAt.toISOString(),
        }));
      }

      case 'DISCIPLINAS': {
        const teachers = await prisma.teacher.findMany({ select: { subjects: true } });
        const reportCards = await prisma.reportCard.findMany({
          select: { subject: true },
          distinct: ['subject'],
        });

        const set = new Set<string>();
        teachers.forEach((t) => {
          if (t.subjects) {
            t.subjects.split(',').forEach((sub) => set.add(sub.trim()));
          }
        });
        reportCards.forEach((rc) => set.add(rc.subject));

        return Array.from(set).map((subj, index) => ({
          ID: `SUBJ_${index + 1}`,
          Nome: subj,
        }));
      }

      case 'NOTAS': {
        if (filterType === 'TURMA' && filterParams.classId) {
          whereClause.student = { classId: filterParams.classId };
        }
        if (filterType === 'ALUNO' && filterParams.studentId) {
          whereClause.studentId = filterParams.studentId;
        }
        const reportCards = await prisma.reportCard.findMany({
          where: whereClause,
          include: {
            student: { include: { user: { include: { profile: true } } } },
          },
        });
        return reportCards.map((rc) => ({
          ID: rc.id,
          Aluno:
            `${rc.student.user.profile?.firstName || ''} ${rc.student.user.profile?.lastName || ''}`.trim(),
          EmailAluno: rc.student.user.email,
          Materia: rc.subject,
          Bimestre1: rc.bimester1 ?? '',
          Bimestre2: rc.bimester2 ?? '',
          Bimestre3: rc.bimester3 ?? '',
          Bimestre4: rc.bimester4 ?? '',
          Recuperacao: rc.remedialGrade ?? '',
          MediaFinal: rc.finalAverage ?? '',
          Faltas: rc.absences,
          Status: rc.status,
          AnoLetivo: rc.schoolYear,
          CriadoEm: rc.createdAt.toISOString(),
        }));
      }

      case 'FREQUENCIA': {
        if (filterType === 'TURMA' && filterParams.classId) {
          whereClause.classId = filterParams.classId;
        }
        if (filterType === 'ALUNO' && filterParams.studentId) {
          whereClause.studentId = filterParams.studentId;
        }
        const attendances = await prisma.attendance.findMany({
          where: whereClause,
          include: {
            class: true,
            student: { include: { user: { include: { profile: true } } } },
          },
        });
        return attendances.map((att) => ({
          ID: att.id,
          Turma: att.class.name,
          Aluno:
            `${att.student.user.profile?.firstName || ''} ${att.student.user.profile?.lastName || ''}`.trim(),
          EmailAluno: att.student.user.email,
          Data: att.date,
          Presenca: att.status,
          CriadoEm: att.createdAt.toISOString(),
        }));
      }

      case 'FINANCEIRO': {
        if (filterType === 'ALUNO' && filterParams.studentId) {
          whereClause.tuition = { studentId: filterParams.studentId };
        }
        const transactions = await prisma.transaction.findMany({
          where: whereClause,
          include: {
            tuition: {
              include: { student: { include: { user: { include: { profile: true } } } } },
            },
          },
        });
        return transactions.map((t) => ({
          ID: t.id,
          Tipo: t.type,
          Categoria: t.category,
          Descricao: t.description,
          Valor: t.value,
          Data: t.date,
          MetodoPagamento: t.paymentMethod || '',
          AlunoRelacionado: t.tuition
            ? `${t.tuition.student.user.profile?.firstName || ''} ${t.tuition.student.user.profile?.lastName || ''}`.trim()
            : '',
          CriadoEm: t.createdAt.toISOString(),
        }));
      }

      case 'BIBLIOTECA': {
        const loans = await prisma.bookLoan.findMany({
          where: whereClause,
          include: { book: true },
        });
        return loans.map((l) => ({
          ID: l.id,
          Livro: l.book.title,
          Autor: l.book.author,
          UsuarioID: l.userId,
          NomeMutuario: l.borrowerName,
          DataEmprestimo: l.loanDate,
          DataDevolucaoPrevista: l.dueDate,
          DataDevolucaoEfetiva: l.returnDate || '',
          Status: l.status,
          MultaAcumulada: l.fine,
          CriadoEm: l.createdAt.toISOString(),
        }));
      }

      case 'AGENDA': {
        const announcements = await prisma.announcement.findMany({
          where: whereClause,
          include: { class: true },
        });
        return announcements.map((a) => ({
          ID: a.id,
          Titulo: a.title,
          Conteudo: a.content,
          PublicoAlvo: a.target,
          Turma: a.class?.name || '',
          CriadoEm: a.createdAt.toISOString(),
        }));
      }

      case 'USUARIOS': {
        const users = await prisma.user.findMany({
          where: whereClause,
          include: { profile: true },
        });
        return users.map((u) => ({
          ID: u.id,
          Email: u.email,
          Funcao: u.role,
          Nome: u.profile?.firstName || '',
          Sobrenome: u.profile?.lastName || '',
          Telefone: u.profile?.phone || '',
          Status: u.isActive ? 'Ativo' : 'Inativo',
          CriadoEm: u.createdAt.toISOString(),
        }));
      }

      case 'PERMISSOES': {
        const users = await prisma.user.findMany({
          select: { id: true, email: true, role: true },
        });
        return users.map((u) => ({
          ID: u.id,
          Email: u.email,
          PerfilAcesso: u.role,
          PermissoesGerais:
            u.role === 'ADMIN'
              ? 'FULL_ACCESS'
              : u.role === 'DIRETOR'
                ? 'MANAGEMENT_ACCESS'
                : 'STANDARD_ACCESS',
        }));
      }

      case 'DOCUMENTOS': {
        if (filterType === 'ALUNO' && filterParams.studentId) {
          whereClause.studentId = filterParams.studentId;
        }
        const docs = await prisma.schoolDocument.findMany({
          where: whereClause,
        });
        return docs.map((d) => ({
          ID: d.id,
          Tipo: d.type,
          Titulo: d.title,
          AlunoNome: d.studentName || '',
          EmitidoPor: d.issuedBy || '',
          Status: d.status,
          NomeArquivo: d.fileName || '',
          CriadoEm: d.createdAt.toISOString(),
        }));
      }

      case 'CONFIGURACOES': {
        return [
          { NomeConfiguracao: 'Sistema Versão', Valor: '1.2.0' },
          { NomeConfiguracao: 'Moeda Corrente', Valor: 'BRL (R$)' },
          { NomeConfiguracao: 'Idioma Padrão', Valor: 'pt-BR' },
          { NomeConfiguracao: 'Fuso Horário', Valor: 'America/Sao_Paulo' },
          { NomeConfiguracao: 'Notificações E-mail', Valor: 'Habilitado' },
          { NomeConfiguracao: 'Notificações Push', Valor: 'Habilitado' },
        ];
      }

      default:
        return [];
    }
  }

  // ─── Generate Single File ──────────────────────────────────────────────────
  private async generateSingleFile(
    dataPayload: Record<string, any[]>,
    format: string,
    outputPath: string
  ): Promise<void> {
    const workbook = xlsx.utils.book_new();

    Object.keys(dataPayload).forEach((mod) => {
      const rows = dataPayload[mod];
      const sheetName = mod.substring(0, 30);
      const worksheet = xlsx.utils.json_to_sheet(
        rows.length > 0 ? rows : [{ Status: 'Nenhum registro encontrado' }]
      );
      xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    if (format === 'excel' || format === 'xlsx') {
      xlsx.writeFile(workbook, outputPath, { bookType: 'xlsx', type: 'file' });
    } else if (format === 'ods') {
      xlsx.writeFile(workbook, outputPath, { bookType: 'ods', type: 'file' });
    } else if (format === 'json') {
      fs.writeFileSync(outputPath, JSON.stringify(dataPayload, null, 2), 'utf-8');
    } else if (format === 'xml') {
      const builder = new Builder({ rootName: 'ZxEscolaExport' });
      const xml = builder.buildObject(dataPayload);
      fs.writeFileSync(outputPath, xml, 'utf-8');
    } else if (format === 'csv') {
      const modules = Object.keys(dataPayload);
      if (modules.length > 0) {
        const rows = dataPayload[modules[0]];
        const worksheet = xlsx.utils.json_to_sheet(
          rows.length > 0 ? rows : [{ Status: 'Nenhum registro encontrado' }]
        );
        const csv = xlsx.utils.sheet_to_csv(worksheet);
        fs.writeFileSync(outputPath, csv, 'utf-8');
      } else {
        fs.writeFileSync(outputPath, 'Nenhum dado encontrado', 'utf-8');
      }
    }
  }

  // ─── Generate ZIP File ─────────────────────────────────────────────────────
  private async generateZipFile(
    dataPayload: Record<string, any[]>,
    outputPath: string
  ): Promise<void> {
    const zip = new AdmZip();

    Object.keys(dataPayload).forEach((mod) => {
      const rows = dataPayload[mod];
      const worksheet = xlsx.utils.json_to_sheet(
        rows.length > 0 ? rows : [{ Status: 'Nenhum registro encontrado' }]
      );

      const csvContent = xlsx.utils.sheet_to_csv(worksheet);
      zip.addFile(`${mod.toLowerCase()}.csv`, Buffer.from(csvContent, 'utf-8'));

      const jsonContent = JSON.stringify(rows, null, 2);
      zip.addFile(`${mod.toLowerCase()}.json`, Buffer.from(jsonContent, 'utf-8'));
    });

    zip.writeZip(outputPath);
  }
}

export default ExportService;
