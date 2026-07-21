import { prisma } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';
import { ExportService } from './ExportService';
import { ImportEngine } from './ImportEngine';

export class MigrationScheduleService {
  private static instance: MigrationScheduleService;
  private intervalId: NodeJS.Timeout | null = null;
  private monitoredDir = path.resolve(process.cwd(), 'src/uploads/monitored');
  private processedDir = path.resolve(process.cwd(), 'src/uploads/monitored/processed');
  private exportService = new ExportService();
  private importEngine = new ImportEngine();

  private constructor() {
    this.ensureDirectoriesExist();
  }

  public static getInstance(): MigrationScheduleService {
    if (!MigrationScheduleService.instance) {
      MigrationScheduleService.instance = new MigrationScheduleService();
    }
    return MigrationScheduleService.instance;
  }

  // ─── Ensure Folders Exist ──────────────────────────────────────────────────
  private ensureDirectoriesExist() {
    if (!fs.existsSync(this.monitoredDir)) {
      fs.mkdirSync(this.monitoredDir, { recursive: true });
    }
    if (!fs.existsSync(this.processedDir)) {
      fs.mkdirSync(this.processedDir, { recursive: true });
    }
  }

  // ─── Start Scheduling Loop ────────────────────────────────────────────────
  public start() {
    if (this.intervalId) return;

    console.log('⏰ Inicializando o agendador de migrações automáticas...');

    // Check every minute
    this.intervalId = setInterval(() => {
      this.checkAndRunJobs().catch((err) => {
        console.error('Erro na checagem de tarefas agendadas:', err);
      });
    }, 60000); // 1 minute
  }

  // ─── Stop Scheduling Loop ─────────────────────────────────────────────────
  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // ─── Query and Execute Scheduled Jobs ──────────────────────────────────────
  private async checkAndRunJobs() {
    const now = new Date();
    const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const isFriday = now.getDay() === 5;

    const activeJobs = await prisma.scheduledJob.findMany({
      where: { isActive: true },
    });

    for (const job of activeJobs) {
      let shouldRun = false;

      // Time verification
      if (job.timeOfDay === currentHourMin) {
        const lastRunDate = job.lastRun ? new Date(job.lastRun).toDateString() : '';
        const todayDate = now.toDateString();

        if (lastRunDate !== todayDate) {
          if (job.frequency === 'DAILY') {
            shouldRun = true;
          } else if (job.frequency === 'WEEKLY_FRIDAY' && isFriday) {
            shouldRun = true;
          }
        }
      }

      if (shouldRun) {
        this.runJob(job.id).catch((err) => {
          console.error(`Falha ao executar tarefa agendada ${job.id}:`, err);
        });
      }
    }
  }

  // ─── Run Job Execution ─────────────────────────────────────────────────────
  public async runJob(id: string) {
    const job = await prisma.scheduledJob.findUnique({ where: { id } });
    if (!job || !job.isActive) return;

    const startTime = Date.now();
    let status = 'SUCCESS';
    let executionLog = '';

    console.log(`[Agendamento] Iniciando execução da tarefa: ${job.name} (${job.type})`);

    try {
      const config = JSON.parse(job.config);

      if (job.type === 'EXPORT_AUTOMATIC') {
        // Automatic Export
        const exportRecord = await prisma.export.create({
          data: {
            format: config.format || 'ZIP',
            modules: config.modules ? config.modules.join(',') : 'ALUNOS',
            filterType: config.filterType || 'COMPLETO',
            filterParams: config.filterParams ? JSON.stringify(config.filterParams) : null,
            status: 'PENDING',
          },
        });

        await prisma.exportHistory.create({
          data: {
            exportId: exportRecord.id,
            status: 'PENDING',
            details: `Tarefa automatizada "${job.name}" agendada.`,
          },
        });

        // Trigger the service directly (synchronous wait for scheduling context)
        await (this.exportService as any).processExportInBackground(exportRecord.id);

        executionLog = `Exportação automatizada realizada com sucesso. ID Export: ${exportRecord.id}`;
      } else if (job.type === 'IMPORT_DIRECTORY') {
        // Monitored Folder Import
        this.ensureDirectoriesExist();
        const files = fs.readdirSync(this.monitoredDir).filter((file) => {
          const stats = fs.statSync(path.join(this.monitoredDir, file));
          return stats.isFile();
        });

        if (files.length === 0) {
          executionLog = 'Pasta monitorada vazia. Nenhuma planilha encontrada para importar.';
        } else {
          let processedFilesCount = 0;

          for (const file of files) {
            const filePath = path.join(this.monitoredDir, file);
            const stats = fs.statSync(filePath);

            // Register uploaded file
            const fileRecord = await prisma.uploadedFile.create({
              data: {
                fileName: file,
                filePath,
                fileSize: stats.size,
                mimeType: this.getMimeType(file),
                status: 'UPLOADED',
              },
            });

            // Create Import process
            const importRecord = await prisma.import.create({
              data: {
                modelId: config.importModelId,
                fileId: fileRecord.id,
                status: 'PENDING',
              },
            });

            await prisma.importHistory.create({
              data: {
                importId: importRecord.id,
                status: 'PENDING',
                details: `Importação iniciada automaticamente da pasta monitorada.`,
              },
            });

            // Execute Import
            await this.importEngine.execute(importRecord.id);

            // Move file to processed folder to prevent re-reading
            const destPath = path.join(this.processedDir, `${Date.now()}_${file}`);
            fs.renameSync(filePath, destPath);

            processedFilesCount++;
          }

          executionLog = `Pasta monitorada processada. ${processedFilesCount} arquivos importados com sucesso.`;
        }
      }
    } catch (err: any) {
      status = 'FAILED';
      executionLog = `Erro na execução do job: ${err?.message || 'Erro interno desconhecido'}`;
    } finally {
      const runTimeMs = Date.now() - startTime;

      // Update ScheduledJob times
      await prisma.scheduledJob.update({
        where: { id },
        data: {
          lastRun: new Date(),
          nextRun: this.calculateNextRun(job.frequency, job.timeOfDay),
        },
      });

      // Save log in JobExecution
      await prisma.jobExecution.create({
        data: {
          jobId: id,
          status,
          logs: executionLog,
          runTimeMs,
        },
      });

      console.log(`[Agendamento] Finalizado: ${job.name} - Status: ${status} (${runTimeMs}ms)`);
    }
  }

  // ─── Calculate Next Run Time ──────────────────────────────────────────────
  private calculateNextRun(frequency: string, timeOfDay: string | null): Date {
    const now = new Date();
    const timeParts = timeOfDay ? timeOfDay.split(':') : ['22', '00'];
    const targetHour = parseInt(timeParts[0]);
    const targetMin = parseInt(timeParts[1]);

    const targetDate = new Date();
    targetDate.setHours(targetHour, targetMin, 0, 0);

    if (frequency === 'DAILY') {
      if (targetDate.getTime() <= now.getTime()) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
    } else if (frequency === 'WEEKLY_FRIDAY') {
      // Find next Friday
      const daysUntilFriday = (5 - now.getDay() + 7) % 7;
      if (daysUntilFriday === 0 && targetDate.getTime() <= now.getTime()) {
        targetDate.setDate(targetDate.getDate() + 7);
      } else {
        targetDate.setDate(targetDate.getDate() + daysUntilFriday);
      }
    }

    return targetDate;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  private getMimeType(file: string): string {
    const ext = path.extname(file).toLowerCase();
    if (ext === '.xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (ext === '.xls') return 'application/vnd.ms-excel';
    if (ext === '.csv') return 'text/csv';
    if (ext === '.json') return 'application/json';
    if (ext === '.xml') return 'application/xml';
    return 'application/octet-stream';
  }
}
