import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ExportService } from '../services/ExportService';
import { ImportEngine } from '../services/ImportEngine';
import { MigrationScheduleService } from '../services/MigrationScheduleService';
import * as fs from 'fs';

const exportService = new ExportService();
const importEngine = new ImportEngine();
const scheduleService = MigrationScheduleService.getInstance();

const logAudit = async (req: Request, action: string, details: string) => {
  const userId = (req as any).user?.id || null;
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource: 'MIGRATION',
        ipAddress: req.ip,
        details,
      },
    });
  } catch (err) {
    console.error('Falha ao gravar log de auditoria de migração:', err);
  }
};

// ─── 1. IMPORT MODELS MANAGEMENT ─────────────────────────────────────────────

export const listImportModels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || '';
    const models = await prisma.importModel.findMany({
      where: {
        OR: [{ userId }, { isShared: true }],
      },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json({ status: 'success', data: models });
  } catch (error) {
    return next(error);
  }
};

export const createImportModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || '';
    const { name, description, targetEntity, mapping, originSystem, isShared } = req.body;

    const model = await prisma.importModel.create({
      data: {
        name,
        description,
        targetEntity,
        mapping: typeof mapping === 'string' ? mapping : JSON.stringify(mapping),
        originSystem,
        isShared: !!isShared,
        userId,
      },
    });

    await logAudit(
      req,
      'CREATE_IMPORT_MODEL',
      `Criou modelo de importação: ${model.name} (${model.id})`
    );

    return res.status(201).json({ status: 'success', data: model });
  } catch (error) {
    return next(error);
  }
};

export const updateImportModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, targetEntity, mapping, originSystem, isShared } = req.body;

    const model = await prisma.importModel.update({
      where: { id },
      data: {
        name,
        description,
        targetEntity,
        mapping: typeof mapping === 'string' ? mapping : JSON.stringify(mapping),
        originSystem,
        isShared: isShared !== undefined ? !!isShared : undefined,
      },
    });

    await logAudit(
      req,
      'UPDATE_IMPORT_MODEL',
      `Atualizou modelo de importação: ${model.name} (${model.id})`
    );

    return res.status(200).json({ status: 'success', data: model });
  } catch (error) {
    return next(error);
  }
};

export const duplicateImportModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || '';

    const source = await prisma.importModel.findUnique({ where: { id } });
    if (!source) {
      return res.status(404).json({ status: 'error', message: 'Modelo não encontrado.' });
    }

    const copy = await prisma.importModel.create({
      data: {
        name: `Cópia de ${source.name}`,
        description: source.description,
        targetEntity: source.targetEntity,
        mapping: source.mapping,
        originSystem: source.originSystem,
        isShared: false,
        userId,
      },
    });

    await logAudit(
      req,
      'DUPLICATE_IMPORT_MODEL',
      `Duplicou modelo de importação de: ${source.name} (${source.id}) para: ${copy.name} (${copy.id})`
    );

    return res.status(201).json({ status: 'success', data: copy });
  } catch (error) {
    return next(error);
  }
};

export const deleteImportModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const model = await prisma.importModel.delete({ where: { id } });

    await logAudit(
      req,
      'DELETE_IMPORT_MODEL',
      `Excluiu modelo de importação: ${model.name} (${model.id})`
    );

    return res.status(200).json({ status: 'success', message: 'Modelo excluído com sucesso.' });
  } catch (error) {
    return next(error);
  }
};

export const shareImportModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isShared } = req.body;

    const model = await prisma.importModel.update({
      where: { id },
      data: { isShared: !!isShared },
    });

    await logAudit(
      req,
      'SHARE_IMPORT_MODEL',
      `Alterou compartilhamento do modelo: ${model.name} (${model.id}) para isShared: ${model.isShared}`
    );

    return res.status(200).json({ status: 'success', data: model });
  } catch (error) {
    return next(error);
  }
};

// ─── 2. EXPORT MODELS MANAGEMENT ─────────────────────────────────────────────

export const listExportModels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || '';
    const models = await prisma.exportModel.findMany({
      where: {
        OR: [{ userId }, { isShared: true }],
      },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json({ status: 'success', data: models });
  } catch (error) {
    return next(error);
  }
};

export const createExportModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || '';
    const { name, description, format, modules, filterType, filterParams, isShared } = req.body;

    const model = await prisma.exportModel.create({
      data: {
        name,
        description,
        format,
        modules: Array.isArray(modules) ? modules.join(',') : modules,
        filterType,
        filterParams: filterParams ? JSON.stringify(filterParams) : null,
        isShared: !!isShared,
        userId,
      },
    });

    await logAudit(
      req,
      'CREATE_EXPORT_MODEL',
      `Criou modelo de exportação: ${model.name} (${model.id})`
    );

    return res.status(201).json({ status: 'success', data: model });
  } catch (error) {
    return next(error);
  }
};

export const updateExportModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, format, modules, filterType, filterParams, isShared } = req.body;

    const model = await prisma.exportModel.update({
      where: { id },
      data: {
        name,
        description,
        format,
        modules: Array.isArray(modules) ? modules.join(',') : modules,
        filterType,
        filterParams: filterParams ? JSON.stringify(filterParams) : null,
        isShared: isShared !== undefined ? !!isShared : undefined,
      },
    });

    await logAudit(
      req,
      'UPDATE_EXPORT_MODEL',
      `Atualizou modelo de exportação: ${model.name} (${model.id})`
    );

    return res.status(200).json({ status: 'success', data: model });
  } catch (error) {
    return next(error);
  }
};

export const duplicateExportModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || '';

    const source = await prisma.exportModel.findUnique({ where: { id } });
    if (!source) {
      return res
        .status(404)
        .json({ status: 'error', message: 'Modelo de exportação não encontrado.' });
    }

    const copy = await prisma.exportModel.create({
      data: {
        name: `Cópia de ${source.name}`,
        description: source.description,
        format: source.format,
        modules: source.modules,
        filterType: source.filterType,
        filterParams: source.filterParams,
        isShared: false,
        userId,
      },
    });

    await logAudit(
      req,
      'DUPLICATE_EXPORT_MODEL',
      `Duplicou modelo de exportação de: ${source.name} (${source.id}) para: ${copy.name} (${copy.id})`
    );

    return res.status(201).json({ status: 'success', data: copy });
  } catch (error) {
    return next(error);
  }
};

export const deleteExportModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const model = await prisma.exportModel.delete({ where: { id } });

    await logAudit(
      req,
      'DELETE_EXPORT_MODEL',
      `Excluiu modelo de exportação: ${model.name} (${model.id})`
    );

    return res.status(200).json({ status: 'success', message: 'Modelo excluído com sucesso.' });
  } catch (error) {
    return next(error);
  }
};

export const shareExportModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isShared } = req.body;

    const model = await prisma.exportModel.update({
      where: { id },
      data: { isShared: !!isShared },
    });

    await logAudit(
      req,
      'SHARE_EXPORT_MODEL',
      `Alterou compartilhamento do modelo: ${model.name} (${model.id}) para isShared: ${model.isShared}`
    );

    return res.status(200).json({ status: 'success', data: model });
  } catch (error) {
    return next(error);
  }
};

// ─── 3. SCHEDULED JOBS ───────────────────────────────────────────────────────

export const listScheduledJobs = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const jobs = await prisma.scheduledJob.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ status: 'success', data: jobs });
  } catch (error) {
    return next(error);
  }
};

export const createScheduledJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, type, frequency, timeOfDay, config } = req.body;

    const job = await prisma.scheduledJob.create({
      data: {
        name,
        type,
        frequency,
        timeOfDay,
        config: typeof config === 'string' ? config : JSON.stringify(config),
      },
    });

    await logAudit(
      req,
      'CREATE_SCHEDULED_JOB',
      `Criou agendamento de tarefa: ${job.name} (${job.type})`
    );

    return res.status(201).json({ status: 'success', data: job });
  } catch (error) {
    return next(error);
  }
};

export const updateScheduledJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, type, frequency, timeOfDay, config, isActive } = req.body;

    const job = await prisma.scheduledJob.update({
      where: { id },
      data: {
        name,
        type,
        frequency,
        timeOfDay,
        config: config ? (typeof config === 'string' ? config : JSON.stringify(config)) : undefined,
        isActive: isActive !== undefined ? !!isActive : undefined,
      },
    });

    await logAudit(
      req,
      'UPDATE_SCHEDULED_JOB',
      `Atualizou agendamento de tarefa: ${job.name} (${job.id})`
    );

    return res.status(200).json({ status: 'success', data: job });
  } catch (error) {
    return next(error);
  }
};

export const deleteScheduledJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const job = await prisma.scheduledJob.delete({ where: { id } });

    await logAudit(
      req,
      'DELETE_SCHEDULED_JOB',
      `Excluiu agendamento de tarefa: ${job.name} (${job.id})`
    );

    return res
      .status(200)
      .json({ status: 'success', message: 'Tarefa agendada excluída com sucesso.' });
  } catch (error) {
    return next(error);
  }
};

export const toggleScheduledJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const job = await prisma.scheduledJob.update({
      where: { id },
      data: { isActive: !!isActive },
    });

    await logAudit(
      req,
      'TOGGLE_SCHEDULED_JOB',
      `Alterou status do agendamento ${job.name} (${job.id}) para isActive: ${job.isActive}`
    );

    return res.status(200).json({ status: 'success', data: job });
  } catch (error) {
    return next(error);
  }
};

export const runScheduledJobNow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const job = await prisma.scheduledJob.findUnique({ where: { id } });
    if (!job) {
      return res.status(404).json({ status: 'error', message: 'Tarefa agendada não encontrada.' });
    }

    // Execute asynchronously
    scheduleService.runJob(id).catch((err) => {
      console.error(`Erro ao disparar tarefa agendada manual ${id}:`, err);
    });

    await logAudit(
      req,
      'RUN_SCHEDULED_JOB',
      `Disparou execução manual imediata da tarefa: ${job.name} (${job.id})`
    );

    return res.status(202).json({
      status: 'success',
      message: 'Tarefa agendada iniciada com sucesso.',
    });
  } catch (error) {
    return next(error);
  }
};

export const listJobExecutions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const executions = await prisma.jobExecution.findMany({
      where: { jobId: id },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ status: 'success', data: executions });
  } catch (error) {
    return next(error);
  }
};

// ─── 4. PUBLIC API ENDPOINTS ──────────────────────────────────────────────────

// POST /api/import
export const publicImport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileId, modelId } = req.body;
    const userId = (req as any).user?.id || null;

    if (!fileId || !modelId) {
      return res.status(400).json({
        status: 'error',
        message: 'Parâmetros fileId e modelId são obrigatórios.',
      });
    }

    const importRecord = await prisma.import.create({
      data: {
        fileId,
        modelId,
        userId,
        status: 'PENDING',
      },
    });

    await prisma.importHistory.create({
      data: {
        importId: importRecord.id,
        status: 'PENDING',
        details: 'Importação solicitada via API Pública.',
      },
    });

    await logAudit(
      req,
      'API_IMPORT_START',
      `Importação solicitada via API. File ID: ${fileId}, Model ID: ${modelId}, Import ID: ${importRecord.id}`
    );

    // Run execution in background using the import engine
    importEngine.execute(importRecord.id).catch((err) => {
      console.error('Erro na execução da importação pública:', err);
    });

    return res.status(202).json({
      status: 'success',
      message: 'Importação pública iniciada.',
      data: { importId: importRecord.id },
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/import/upload
export const publicImportUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    const userId = (req as any).user?.id || null;

    if (!file) {
      return res.status(400).json({
        status: 'error',
        message: 'Nenhum arquivo enviado.',
      });
    }

    const fileRecord = await prisma.uploadedFile.create({
      data: {
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        userId,
        status: 'UPLOADED',
      },
    });

    await logAudit(
      req,
      'API_IMPORT_UPLOAD',
      `Upload de planilha realizado via API. Nome: ${file.originalname}, Size: ${file.size} bytes, File ID: ${fileRecord.id}`
    );

    return res.status(201).json({
      status: 'success',
      message: 'Arquivo carregado com sucesso via API Pública.',
      data: { fileId: fileRecord.id },
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/import/status
export const publicImportStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { importId } = req.body;

    if (!importId) {
      return res.status(400).json({
        status: 'error',
        message: 'Parâmetro importId é obrigatório no corpo da requisição.',
      });
    }

    const importRecord = await prisma.import.findUnique({
      where: { id: importId },
      include: {
        logs: { orderBy: { createdAt: 'asc' } },
        history: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!importRecord) {
      return res.status(404).json({
        status: 'error',
        message: 'Importação não encontrada.',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        id: importRecord.id,
        status: importRecord.status,
        totalRows: importRecord.totalRows,
        processedRows: importRecord.processedRows,
        successRows: importRecord.successRows,
        errorRows: importRecord.errorRows,
        logs: importRecord.logs.map((log) => ({
          row: log.rowNumber,
          status: log.status,
          message: log.message,
          details: log.details,
        })),
        history: importRecord.history.map((hist) => ({
          status: hist.status,
          details: hist.details,
          timestamp: hist.createdAt,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/export
export const publicExport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const format = (req.query.format as string) || 'ZIP';
    const modulesQuery = (req.query.modules as string) || 'ALUNOS';
    const filterType = (req.query.filterType as string) || 'COMPLETO';
    const userId = (req as any).user?.id || null;

    const modules = modulesQuery.split(',');

    const job = await exportService.createExportJob({
      format: format.toUpperCase(),
      modules,
      filterType: filterType.toUpperCase(),
      userId,
    });

    await logAudit(
      req,
      'API_EXPORT_START',
      `Exportação agendada via API. Formato: ${format}, Módulos: ${modulesQuery}, Export ID: ${job.id}`
    );

    return res.status(202).json({
      status: 'success',
      message: 'Exportação pública iniciada.',
      data: { exportId: job.id },
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/export/status
export const publicExportStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exportId = req.query.exportId as string;

    if (!exportId) {
      return res.status(400).json({
        status: 'error',
        message: 'O parâmetro de query exportId é obrigatório.',
      });
    }

    const exportRecord = await prisma.export.findUnique({
      where: { id: exportId },
      include: {
        history: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!exportRecord) {
      return res.status(404).json({
        status: 'error',
        message: 'Exportação não encontrada.',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        id: exportRecord.id,
        status: exportRecord.status,
        totalRows: exportRecord.totalRows,
        processedRows: exportRecord.processedRows,
        sizeBytes: exportRecord.sizeBytes,
        history: exportRecord.history.map((hist) => ({
          status: hist.status,
          details: hist.details,
          timestamp: hist.createdAt,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/export/download
export const publicExportDownload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exportId = req.query.exportId as string;

    if (!exportId) {
      return res.status(400).json({
        status: 'error',
        message: 'O parâmetro de query exportId é obrigatório.',
      });
    }

    const exportRecord = await prisma.export.findUnique({ where: { id: exportId } });

    if (!exportRecord || exportRecord.status !== 'COMPLETED' || !exportRecord.filePath) {
      return res.status(404).json({
        status: 'error',
        message: 'Arquivo de exportação não encontrado ou ainda em processamento.',
      });
    }

    if (!fs.existsSync(exportRecord.filePath)) {
      return res.status(404).json({
        status: 'error',
        message: 'O arquivo físico de exportação foi removido do servidor.',
      });
    }

    await logAudit(
      req,
      'API_EXPORT_DOWNLOAD',
      `Download concluído via API. Export ID: ${exportId}, File: ${exportRecord.fileName}`
    );

    return res.download(exportRecord.filePath, exportRecord.fileName || 'export.zip');
  } catch (error) {
    return next(error);
  }
};
