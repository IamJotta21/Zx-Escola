import { prisma } from '../config/database';
import { ParserFactory } from './parsers/ParserFactory';
import { TargetEntity } from '../types/ImportType';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

export class ImportEngine {
  private dbPath = path.resolve(process.cwd(), 'src/prisma/dev.db');
  private backupsDir = path.resolve(process.cwd(), 'src/prisma/backups');

  // ─── Public: List available backup files ───────────────────────────────────
  public listBackups(): Array<{
    name: string;
    path: string;
    sizeBytes: number;
    createdAt: string;
  }> {
    if (!fs.existsSync(this.backupsDir)) return [];
    return fs
      .readdirSync(this.backupsDir)
      .filter((f) => f.endsWith('.db'))
      .map((f) => {
        const filePath = path.join(this.backupsDir, f);
        const stat = fs.statSync(filePath);
        return {
          name: f,
          path: filePath,
          sizeBytes: stat.size,
          createdAt: stat.birthtime.toISOString(),
        };
      })
      .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  }

  // ─── Public: Restore database from a specific backup ──────────────────────
  public restoreFromBackup(backupName: string): void {
    const backupFile = path.join(this.backupsDir, backupName);
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Arquivo de backup não encontrado: ${backupName}`);
    }
    fs.copyFileSync(backupFile, this.dbPath);
  }

  // ─── Private: Create safety backup ────────────────────────────────────────
  private backup(): string {
    if (!fs.existsSync(this.dbPath)) {
      throw new Error(`Banco de dados não encontrado: ${this.dbPath}`);
    }
    if (!fs.existsSync(this.backupsDir)) {
      fs.mkdirSync(this.backupsDir, { recursive: true });
    }
    const backupFile = path.join(this.backupsDir, `dev_db_backup_${Date.now()}.db`);
    fs.copyFileSync(this.dbPath, backupFile);
    return backupFile;
  }

  // ─── Private: Restore from a backup file path ─────────────────────────────
  private restore(backupFile: string) {
    if (fs.existsSync(backupFile)) {
      fs.copyFileSync(backupFile, this.dbPath);
    }
  }

  // ─── Private: Write a per-row log entry to the database ───────────────────
  private async writeLog(
    importId: string,
    rowNumber: number | null,
    status: 'SUCCESS' | 'ERROR' | 'WARNING',
    message: string,
    details?: string
  ) {
    await prisma.importLog.create({
      data: { importId, rowNumber, status, message, details },
    });
  }

  // ─── Public: Execute full import with backup + transaction + per-row logs ──
  public async execute(importId: string) {
    const importRecord = await prisma.import.findUnique({
      where: { id: importId },
      include: { file: true, model: true },
    });

    if (!importRecord) throw new Error('Processo de importação não encontrado');

    const modelRecord = importRecord.model;
    const fileRecord = importRecord.file;

    if (!modelRecord || !fileRecord) {
      throw new Error('Modelo ou arquivo associado não encontrado no banco');
    }

    // Safety backup before any write
    const backupPath = this.backup();

    await this.writeLog(importId, null, 'SUCCESS', 'Backup do banco criado', backupPath);

    let successCount = 0;
    let errorCount = 0;

    try {
      const ext = path.extname(fileRecord.fileName).toLowerCase();
      const parser = ParserFactory.getParser(ext);
      const parsedData = await parser.parse(fileRecord.filePath);

      if (parsedData.sheets.length === 0) {
        throw new Error('Planilha de dados vazia — nenhuma folha encontrada');
      }

      const sheet = parsedData.sheets[0];
      const mapping = JSON.parse(modelRecord.mapping) as Record<string, string>;
      const targetEntity = modelRecord.targetEntity as TargetEntity;
      const totalRows = sheet.rows.length;

      await prisma.import.update({
        where: { id: importId },
        data: { totalRows },
      });

      await this.writeLog(
        importId,
        null,
        'SUCCESS',
        `Arquivo analisado: ${totalRows} registros detectados`,
        `Entidade alvo: ${targetEntity}`
      );

      const defaultPassword = await bcrypt.hash('123456', 10);

      // Process each row individually (with per-row error handling & logging)
      for (let rowIdx = 0; rowIdx < sheet.rows.length; rowIdx++) {
        const row = sheet.rows[rowIdx];
        const rowNumber = rowIdx + 1;

        // Build mapped data object from spreadsheet column → db field
        const mappedData: Record<string, any> = {};
        Object.keys(mapping).forEach((excelHeader) => {
          const dbField = mapping[excelHeader];
          if (dbField) mappedData[dbField] = row[excelHeader];
        });

        try {
          // Each row is individually transacted to allow partial success
          await prisma.$transaction(async (tx) => {
            if (targetEntity === 'GUARDIAN') {
              await this.importGuardian(tx, mappedData);
            } else if (targetEntity === 'TEACHER') {
              await this.importTeacher(tx, mappedData, defaultPassword);
            } else if (targetEntity === 'CLASS') {
              await this.importClass(tx, mappedData);
            } else if (targetEntity === 'ROOM') {
              await this.importRoom(tx, mappedData);
            } else if (targetEntity === 'STUDENT') {
              await this.importStudent(tx, mappedData, defaultPassword);
            }
          });

          successCount++;
          await this.writeLog(
            importId,
            rowNumber,
            'SUCCESS',
            `Registro ${rowNumber} gravado com sucesso`,
            JSON.stringify(mappedData).substring(0, 200)
          );
        } catch (rowErr: any) {
          errorCount++;
          await this.writeLog(
            importId,
            rowNumber,
            'ERROR',
            `Falha ao gravar registro ${rowNumber}: ${rowErr?.message || 'Erro desconhecido'}`,
            JSON.stringify(mappedData).substring(0, 200)
          );
        }

        // Update rolling stats in database every 5 rows
        if (rowIdx % 5 === 0 || rowIdx === sheet.rows.length - 1) {
          await prisma.import.update({
            where: { id: importId },
            data: {
              processedRows: rowIdx + 1,
              successRows: successCount,
              errorRows: errorCount,
            },
          });
        }
      }

      await this.writeLog(
        importId,
        null,
        successCount > 0 ? 'SUCCESS' : 'WARNING',
        `Processamento concluído: ${successCount} inseridos, ${errorCount} falhas`,
        `Total: ${sheet.rows.length} linhas`
      );

      // Final stats update
      await prisma.import.update({
        where: { id: importId },
        data: {
          processedRows: sheet.rows.length,
          successRows: successCount,
          errorRows: errorCount,
        },
      });

      // Clean up backups older than 7 days
      try {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        fs.readdirSync(this.backupsDir).forEach((f) => {
          const fp = path.join(this.backupsDir, f);
          if (fs.statSync(fp).mtimeMs < sevenDaysAgo) fs.unlinkSync(fp);
        });
      } catch {
        // Ignore cleanup errors
      }
    } catch (error: any) {
      // Physical file rollback on critical failure
      this.restore(backupPath);
      await this.writeLog(
        importId,
        null,
        'ERROR',
        `Falha crítica — rollback físico do SQLite executado`,
        error?.message
      );
      throw error;
    }
  }

  // ─── Entity Importers ──────────────────────────────────────────────────────

  private async importGuardian(tx: any, data: any) {
    const name = data.name || data.firstName || 'Responsável';
    const email = data.email ? String(data.email).trim() : null;
    const phone = data.phone ? String(data.phone).trim() : null;
    const whatsapp = data.whatsapp ? String(data.whatsapp).trim() : null;
    const relationship = data.relationship || 'Outro';
    const isFinancial =
      data.isFinancial === true || String(data.isFinancial).toLowerCase() === 'true';

    if (email) {
      const existing = await tx.guardian.findUnique({ where: { email } });
      if (existing) return existing;
    }

    return tx.guardian.create({
      data: { name, email, phone, whatsapp, relationship, isFinancial },
    });
  }

  private async importTeacher(tx: any, data: any, defaultPassword: string) {
    const email = data.email ? String(data.email).trim() : null;
    const firstName = data.firstName || 'Professor';
    const lastName = data.lastName || '';
    const phone = data.phone ? String(data.phone).trim() : null;
    const subjects = data.subjects || '';
    const workload = data.workload ? Number(data.workload) : 20;

    if (!email) throw new Error('E-mail do professor é obrigatório');

    const existingUser = await tx.user.findUnique({ where: { email } });
    if (existingUser) {
      const teacher = await tx.teacher.findUnique({ where: { userId: existingUser.id } });
      if (teacher) return teacher;
      throw new Error(`Usuário "${email}" já cadastrado com outro perfil.`);
    }

    const user = await tx.user.create({
      data: {
        email,
        password: defaultPassword,
        role: 'TEACHER',
        profile: { create: { firstName, lastName, phone } },
      },
    });

    return tx.teacher.create({ data: { userId: user.id, subjects, workload } });
  }

  private async importRoom(tx: any, data: any) {
    const name = data.name ? String(data.name).trim() : '';
    const capacity = data.capacity ? Number(data.capacity) : 30;
    if (!name) throw new Error('Nome da sala é obrigatório');
    const existing = await tx.room.findUnique({ where: { name } });
    if (existing) return existing;
    return tx.room.create({ data: { name, capacity } });
  }

  private async importClass(tx: any, data: any) {
    const name = data.name ? String(data.name).trim() : '';
    const gradeYear = data.gradeYear ? String(data.gradeYear).trim() : '';
    const schoolYear = data.schoolYear
      ? String(data.schoolYear).trim()
      : new Date().getFullYear().toString();

    if (!name || !gradeYear) throw new Error('Nome da turma e ano/série são obrigatórios');

    let roomId = null;
    if (data.roomName) {
      const room = await tx.room.findUnique({ where: { name: String(data.roomName).trim() } });
      if (room) roomId = room.id;
    }

    let teacherId = null;
    if (data.teacherEmail && String(data.teacherEmail).includes('@')) {
      const user = await tx.user.findUnique({
        where: { email: String(data.teacherEmail).trim() },
      });
      if (user) {
        const teacher = await tx.teacher.findUnique({ where: { userId: user.id } });
        if (teacher) teacherId = teacher.id;
      }
    }

    return tx.class.create({ data: { name, gradeYear, schoolYear, roomId, teacherId } });
  }

  private async importStudent(tx: any, data: any, defaultPassword: string) {
    const email = data.email ? String(data.email).trim() : null;
    const firstName = data.firstName || data.name || 'Aluno';
    const lastName = data.lastName || '';
    const cpf = data.cpf ? String(data.cpf).replace(/\D/g, '') : null;
    const rg = data.rg ? String(data.rg).trim() : null;
    const phone = data.phone ? String(data.phone).trim() : null;
    const whatsapp = data.whatsapp ? String(data.whatsapp).trim() : null;
    const gender = data.gender || 'Outro';
    const address = data.address || null;
    const city = data.city || null;
    const state = data.state || null;
    const cep = data.cep || null;
    const birthDate = data.birthDate ? new Date(data.birthDate) : null;
    const fatherName = data.fatherName || null;
    const motherName = data.motherName || null;

    if (!email) throw new Error('E-mail do aluno é obrigatório');

    const existingUser = await tx.user.findUnique({ where: { email } });
    if (existingUser) {
      const student = await tx.student.findUnique({ where: { userId: existingUser.id } });
      if (student) return student;
      throw new Error(`E-mail "${email}" já cadastrado para outro perfil.`);
    }

    if (cpf) {
      const existingCpf = await tx.student.findUnique({ where: { cpf } });
      if (existingCpf) throw new Error(`CPF "${cpf}" já cadastrado para outro aluno.`);
    }

    let classId = null;
    if (data.className) {
      const classRecord = await tx.class.findFirst({
        where: { name: String(data.className).trim() },
      });
      if (classRecord) classId = classRecord.id;
    }

    const user = await tx.user.create({
      data: {
        email,
        password: defaultPassword,
        role: 'STUDENT',
        profile: { create: { firstName, lastName, phone, birthDate } },
      },
    });

    const student = await tx.student.create({
      data: {
        userId: user.id,
        cpf,
        rg,
        gender,
        address,
        city,
        state,
        cep,
        whatsapp,
        fatherName,
        motherName,
        status: 'MATRICULADO',
        classId,
      },
    });

    // Create guardian on-the-fly if mapped
    if (data.guardianEmail || data.guardianName) {
      let guardianRecord = null;
      if (data.guardianEmail) {
        guardianRecord = await tx.guardian.findUnique({
          where: { email: String(data.guardianEmail).trim() },
        });
      }
      if (!guardianRecord) {
        guardianRecord = await tx.guardian.create({
          data: {
            name: data.guardianName || 'Responsável',
            email: data.guardianEmail || null,
            phone: data.guardianPhone || null,
            relationship: data.guardianRelationship || 'Outro',
          },
        });
      }
      await tx.studentGuardian.create({
        data: { studentId: student.id, guardianId: guardianRecord.id },
      });
    }

    return student;
  }
}

export default ImportEngine;
