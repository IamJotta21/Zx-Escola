import { prisma } from '../config/database';
import { ImportEngine } from './ImportEngine';

interface ActiveJob {
  importId: string;
  currentRowIdx: number;
  totalRows: number;
  status: 'PROCESSING' | 'PAUSED' | 'CANCELLED';
}

export class ImportQueueManager {
  private static instance: ImportQueueManager;
  private activeJobs: Map<string, ActiveJob> = new Map();

  private constructor() {}

  public static getInstance(): ImportQueueManager {
    if (!ImportQueueManager.instance) {
      ImportQueueManager.instance = new ImportQueueManager();
    }
    return ImportQueueManager.instance;
  }

  public async startJob(importId: string) {
    if (this.activeJobs.has(importId)) {
      const job = this.activeJobs.get(importId)!;
      if (job.status === 'PAUSED') {
        return this.resumeJob(importId);
      }
      return;
    }

    const job: ActiveJob = {
      importId,
      currentRowIdx: 0,
      totalRows: 0,
      status: 'PROCESSING',
    };

    this.activeJobs.set(importId, job);
    this.processJobInBackground(job);
  }

  public async pauseJob(importId: string) {
    const job = this.activeJobs.get(importId);
    if (job && job.status === 'PROCESSING') {
      job.status = 'PAUSED';
      await prisma.import.update({
        where: { id: importId },
        data: { status: 'PAUSED' },
      });
    }
  }

  public async resumeJob(importId: string) {
    const job = this.activeJobs.get(importId);
    if (job && job.status === 'PAUSED') {
      job.status = 'PROCESSING';
      await prisma.import.update({
        where: { id: importId },
        data: { status: 'PROCESSING' },
      });
      this.processJobInBackground(job);
    } else if (!job) {
      // If server restarted, recreate job state from DB record
      const importRecord = await prisma.import.findUnique({ where: { id: importId } });
      if (importRecord) {
        const newJob: ActiveJob = {
          importId,
          currentRowIdx: importRecord.processedRows || 0,
          totalRows: importRecord.totalRows || 0,
          status: 'PROCESSING',
        };
        this.activeJobs.set(importId, newJob);
        await prisma.import.update({
          where: { id: importId },
          data: { status: 'PROCESSING' },
        });
        this.processJobInBackground(newJob);
      }
    }
  }

  public async cancelJob(importId: string) {
    const job = this.activeJobs.get(importId);
    if (job) {
      job.status = 'CANCELLED';
    }
    this.activeJobs.delete(importId);
    await prisma.import.update({
      where: { id: importId },
      data: { status: 'CANCELLED' },
    });
  }

  private async processJobInBackground(job: ActiveJob) {
    const importId = job.importId;
    const engine = new ImportEngine();

    try {
      // Fetch import record for metadata
      const importRecord = await prisma.import.findUnique({
        where: { id: importId },
        include: { file: true, model: true },
      });

      if (!importRecord || !importRecord.file || !importRecord.model) {
        throw new Error('Processo de importação inválido.');
      }

      // Execute the import engine which handles backups, transactions, and insertions
      await engine.execute(importId);

      // After engine completes full execution, update final status
      if (job.status === 'PROCESSING') {
        const finalRecord = await prisma.import.findUnique({ where: { id: importId } });
        const totalRows = finalRecord?.totalRows || 0;

        await prisma.import.update({
          where: { id: importId },
          data: {
            status: 'COMPLETED',
            processedRows: totalRows,
            successRows: totalRows,
            errorRows: 0,
          },
        });

        await prisma.importHistory.create({
          data: {
            importId,
            status: 'COMPLETED',
            details: 'Motor de importação concluiu a gravação de todos os lotes no banco de dados.',
          },
        });

        this.activeJobs.delete(importId);
      }
    } catch (err: any) {
      if (job.status !== 'CANCELLED') {
        await prisma.import.update({
          where: { id: importId },
          data: { status: 'FAILED' },
        });

        await prisma.importHistory.create({
          data: {
            importId,
            status: 'FAILED',
            details: `Falha crítica: ${err?.message || 'Erro desconhecido'}. Rollback SQLite executado.`,
          },
        });
      }

      this.activeJobs.delete(importId);
    }
  }
}

export default ImportQueueManager;
