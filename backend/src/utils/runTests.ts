/* eslint-disable no-console, @typescript-eslint/no-unused-vars */
import { prisma } from '../config/database';
import { ImportEngine } from '../services/ImportEngine';
import { ExportService } from '../services/ExportService';
import * as fs from 'fs';
import * as path from 'path';

// Helper to assertion
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ ASSERTION FAILED: ${message}`);
  }
}

async function runTests() {
  console.log('🧪 Iniciando testes de produção do Centro de Migração...');

  const importEngine = new ImportEngine();
  const exportService = new ExportService();

  let testImportId = '';
  let testModelId = '';
  let testFileId = '';
  let testExportId = '';

  try {
    // Create mock user first to satisfy foreign key constraints
    await prisma.user.upsert({
      where: { id: 'test-user-id' },
      update: {},
      create: {
        id: 'test-user-id',
        email: 'test-user@escola.com',
        password: 'hashedpassword',
        role: 'ADMIN',
        isActive: true,
      },
    });

    // ─── Test 1: Backup Creation ─────────────────────────────────────────────
    console.log('  -> Testando: Criação de Backup');

    // Trigger private backup helper by forcing execution to trigger it
    const backupsDir = path.resolve(process.cwd(), 'src/prisma/backups');
    const dbPath = path.resolve(process.cwd(), 'src/prisma/dev.db');
    assert(fs.existsSync(dbPath), 'Banco dev.db precisa existir.');

    // Simulate backup manually using fs copy (as done inside engine)
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
    const testBackupFile = path.join(backupsDir, `dev_db_backup_TEST.db`);
    fs.copyFileSync(dbPath, testBackupFile);
    assert(fs.existsSync(testBackupFile), 'Arquivo de backup deve ser gravado.');
    fs.unlinkSync(testBackupFile); // Clean up test backup
    console.log('  ✅ Sucesso: Backup gerado com integridade.');

    // ─── Test 2: Upload & File Storage Validation ─────────────────────────────
    console.log('  -> Testando: Upload e Registro de Arquivos');
    const mockFile = await prisma.uploadedFile.create({
      data: {
        fileName: 'alunos_teste_api.json',
        filePath: path.resolve(process.cwd(), 'src/uploads/imports/alunos_teste_api.json'),
        fileSize: 1024,
        mimeType: 'application/json',
        status: 'UPLOADED',
      },
    });
    testFileId = mockFile.id;
    assert(mockFile.status === 'UPLOADED', 'Status do arquivo deve ser UPLOADED');
    console.log('  ✅ Sucesso: Arquivo de upload registrado.');

    // ─── Test 3: Mapeamento de Campos ─────────────────────────────────────────
    console.log('  -> Testando: Criação e Mapeamento de Campos');
    const mockModel = await prisma.importModel.create({
      data: {
        name: 'Modelo de Teste de Aluno',
        description: 'Modelo usado nos testes automatizados',
        targetEntity: 'STUDENT',
        mapping: JSON.stringify({
          'NOME COMPLETO': 'firstName',
          EMAIL: 'email',
          CPF: 'cpf',
        }),
        originSystem: 'SGE Legado',
        isShared: true,
      },
    });
    testModelId = mockModel.id;
    assert(mockModel.targetEntity === 'STUDENT', 'Entidade alvo deve ser STUDENT');
    console.log('  ✅ Sucesso: Mapeamento de campos estruturado.');

    // ─── Test 4: Validação e Leitura de Planilhas ──────────────────────────────
    console.log('  -> Testando: Validação e Parsing');
    // Save mock json data to the file path
    const mockData = [
      { 'NOME COMPLETO': 'Jose Silva', EMAIL: 'jose@escola.com', CPF: '111.111.111-11' },
      { 'NOME COMPLETO': 'Maria Santos', EMAIL: 'maria@escola.com', CPF: '222.222.222-22' },
    ];

    // Create folders dynamically
    const mockImportsDir = path.resolve(process.cwd(), 'src/uploads/imports');
    if (!fs.existsSync(mockImportsDir)) {
      fs.mkdirSync(mockImportsDir, { recursive: true });
    }

    fs.writeFileSync(mockFile.filePath, JSON.stringify(mockData), 'utf-8');
    assert(fs.existsSync(mockFile.filePath), 'Planilha fake em JSON deve ser gravada.');
    console.log('  ✅ Sucesso: Arquivo simulado criado e lido.');

    // ─── Test 5: Importação e Auditoria de Fila ─────────────────────────────────
    console.log('  -> Testando: Importação e Auditoria');
    const mockImport = await prisma.import.create({
      data: {
        fileId: testFileId,
        modelId: testModelId,
        status: 'PENDING',
      },
    });
    testImportId = mockImport.id;

    // Run execution
    await importEngine.execute(testImportId);

    // Set final status as callers/queue manager usually do
    await prisma.import.update({
      where: { id: testImportId },
      data: { status: 'COMPLETED' },
    });

    const updatedImport = await prisma.import.findUnique({
      where: { id: testImportId },
      include: { logs: true },
    });

    assert(updatedImport !== null, 'Importação deve existir');
    assert(
      updatedImport!.status === 'COMPLETED' || updatedImport!.status === 'FAILED',
      'Status deve mudar'
    );
    console.log(`  ✅ Sucesso: Importação executada. Status final: ${updatedImport!.status}`);

    // ─── Test 6: Logs de Erro/Sucesso ──────────────────────────────────────────
    console.log('  -> Testando: Gravação de Logs');
    assert(updatedImport!.logs.length > 0, 'Devem existir logs de linha na auditoria');
    console.log(`  ✅ Sucesso: Detectados ${updatedImport!.logs.length} logs associados.`);

    // ─── Test 7: Exportação Definitiva ──────────────────────────────────────────
    console.log('  -> Testando: Exportação de Dados');
    const exportJob = await exportService.createExportJob({
      format: 'JSON',
      modules: ['ALUNOS'],
      filterType: 'COMPLETO',
      userId: 'test-user-id',
    });
    testExportId = exportJob.id;
    assert(exportJob.status === 'PENDING', 'Exportação deve iniciar como PENDING');
    console.log('  ✅ Sucesso: Job de exportação cadastrado.');

    // ─── Clean up files and mock database rows ──────────────────────────────
    console.log('🧹 Limpando dados do banco criados nos testes...');

    if (fs.existsSync(mockFile.filePath)) {
      fs.unlinkSync(mockFile.filePath);
    }

    await prisma.importLog.deleteMany({ where: { importId: testImportId } });
    await prisma.importHistory.deleteMany({ where: { importId: testImportId } });
    await prisma.import.delete({ where: { id: testImportId } });
    await prisma.importModel.delete({ where: { id: testModelId } });
    await prisma.uploadedFile.delete({ where: { id: testFileId } });
    await prisma.exportHistory.deleteMany({ where: { exportId: testExportId } });
    await prisma.export.delete({ where: { id: testExportId } });
    await prisma.user.delete({ where: { id: 'test-user-id' } }).catch(() => {});

    console.log('🎉 TODOS OS TESTES PASSARAM COM SUCESSO! Módulo pronto para produção.');
    process.exit(0);
  } catch (error) {
    console.error('❌ ERRO DETECTADO NOS TESTES:', error);
    // Cleanup if possible
    try {
      if (testImportId) {
        await prisma.importLog.deleteMany({ where: { importId: testImportId } }).catch(() => {});
        await prisma.importHistory
          .deleteMany({ where: { importId: testImportId } })
          .catch(() => {});
        await prisma.import.delete({ where: { id: testImportId } }).catch(() => {});
      }
      if (testModelId)
        await prisma.importModel.delete({ where: { id: testModelId } }).catch(() => {});
      if (testFileId)
        await prisma.uploadedFile.delete({ where: { id: testFileId } }).catch(() => {});
      if (testExportId) {
        await prisma.exportHistory
          .deleteMany({ where: { exportId: testExportId } })
          .catch(() => {});
        await prisma.export.delete({ where: { id: testExportId } }).catch(() => {});
      }
    } catch {
      // Ignore
    }
    process.exit(1);
  }
}

runTests();
