import { IHistoryRepository, IHistoryService } from '../interfaces/ImportInterface';
import { ImportHistory } from '@prisma/client';

export class HistoryService implements IHistoryService {
  private repository: IHistoryRepository;

  constructor(repository: IHistoryRepository) {
    this.repository = repository;
  }

  async logStateTransition(
    importId: string,
    status: string,
    details?: string
  ): Promise<ImportHistory> {
    return this.repository.create(importId, status, details);
  }

  async getImportHistory(importId: string): Promise<ImportHistory[]> {
    return this.repository.listByImportId(importId);
  }

  async listAllHistory(): Promise<ImportHistory[]> {
    return this.repository.listAll();
  }
}
export default HistoryService;
