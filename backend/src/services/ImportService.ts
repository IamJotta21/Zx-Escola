import {
  IImportRepository,
  IImportService,
  IHistoryRepository,
} from '../interfaces/ImportInterface';
import { Import } from '@prisma/client';
import { ImportQueueManager } from './ImportQueueManager';

export class ImportService implements IImportService {
  private repository: IImportRepository;
  private historyRepository: IHistoryRepository;

  constructor(repository: IImportRepository, historyRepository: IHistoryRepository) {
    this.repository = repository;
    this.historyRepository = historyRepository;
  }

  async startImport(modelId: string, fileId: string, userId: string): Promise<Import> {
    const importProcess = await this.repository.create({
      modelId,
      fileId,
      userId,
      status: 'PROCESSING',
    });

    // Write audit events
    await this.historyRepository.create(
      importProcess.id,
      'PROCESSING',
      'Importação iniciada. Iniciando cópia de backup do banco e validação das regras relacionais.'
    );

    await this.repository.addLog(
      importProcess.id,
      null,
      'SUCCESS',
      'Iniciada preparação do lote',
      'Mapeadores carregados com sucesso'
    );

    // Asynchronously trigger execution of the Queue Manager in background
    const manager = ImportQueueManager.getInstance();
    manager.startJob(importProcess.id);

    return importProcess;
  }

  async getImportDetails(id: string): Promise<Import | null> {
    return this.repository.findById(id);
  }

  async listImports(): Promise<Import[]> {
    return this.repository.listAll();
  }

  async getDashboardStats(): Promise<any> {
    const imports = await this.repository.listAll();

    return {
      totalImports: imports.length,
      pending: imports.filter((i) => i.status === 'PENDING').length,
      processing: imports.filter((i) => i.status === 'PROCESSING').length,
      completed: imports.filter((i) => i.status === 'COMPLETED').length,
      failed: imports.filter((i) => i.status === 'FAILED').length,
      totalRows: imports.reduce((acc, curr) => acc + curr.totalRows, 0),
      successRows: imports.reduce((acc, curr) => acc + curr.successRows, 0),
      errorRows: imports.reduce((acc, curr) => acc + curr.errorRows, 0),
    };
  }
}

export default ImportService;
