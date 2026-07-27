import { Request, Response, NextFunction } from 'express';
import { ImportRepository } from '../repositories/ImportRepository';
import { HistoryRepository } from '../repositories/HistoryRepository';
import { ImportService } from '../services/ImportService';
import { FileAnalyzerService } from '../services/FileAnalyzerService';
import { DataAnalyzerService } from '../services/DataAnalyzerService';
import { ParserFactory } from '../services/parsers/ParserFactory';
import { ImportQueueManager } from '../services/ImportQueueManager';
import { ImportEngine } from '../services/ImportEngine';
import { prisma } from '../config/database';
import path from 'path';

const importRepository = new ImportRepository();
const historyRepository = new HistoryRepository();
const importService = new ImportService(importRepository, historyRepository);
const fileAnalyzerService = new FileAnalyzerService();
const dataAnalyzerService = new DataAnalyzerService();
const importEngine = new ImportEngine();

// ─── Start Import ─────────────────────────────────────────────────────────────
export const startImport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || '';
    const { modelId, fileId } = req.body;

    // Verify file and model access before starting import
    const [fileRecord, modelRecord] = await Promise.all([
      prisma.uploadedFile.findUnique({ where: { id: fileId }, include: { user: true } }),
      prisma.importModel.findUnique({ where: { id: modelId } }),
    ]);

    if (!fileRecord) {
      return res.status(404).json({ status: 'error', message: 'Arquivo não encontrado' });
    }
    if (!modelRecord) {
      return res.status(404).json({ status: 'error', message: 'Modelo de mapeamento não encontrado' });
    }

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (fileRecord.userId !== req.user?.id && fileRecord.user?.tenantId !== req.tenantId) {
        return res.status(403).json({ status: 'error', message: 'Acesso negado ao arquivo' });
      }
      if (modelRecord.userId !== req.user?.id && !modelRecord.isShared) {
        return res.status(403).json({ status: 'error', message: 'Acesso negado ao modelo' });
      }
    }

    const importProcess = await importService.startImport(modelId, fileId || '', userId);
    return res.status(202).json({ status: 'success', data: importProcess });
  } catch (error) {
    return next(error);
  }
};

// ─── Get Import Details ───────────────────────────────────────────────────────
export const getImportDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const importProcess = await prisma.import.findUnique({
      where: { id },
      include: {
        model: true,
        file: true,
        user: {
          select: {
            id: true,
            email: true,
            tenantId: true,
            profile: true,
          },
        },
        logs: {
          orderBy: { rowNumber: 'asc' },
        },
        history: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!importProcess) {
      return res.status(404).json({ status: 'error', message: 'Importação não encontrada' });
    }

    // Verify tenant access
    if (req.user?.role !== 'SUPER_ADMIN') {
      if (importProcess.userId !== req.user?.id && importProcess.user?.tenantId !== req.tenantId) {
        return res.status(403).json({ status: 'error', message: 'Acesso negado' });
      }
    }

    return res.status(200).json({ status: 'success', data: importProcess });
  } catch (error) {
    return next(error);
  }
};

// ─── List Imports ─────────────────────────────────────────────────────────────
export const listImports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId || 'escola-matriz-default-id';
    const queryCond: any = {};

    if (req.user?.role !== 'SUPER_ADMIN') {
      queryCond.user = {
        tenantId,
      };
    }

    const imports = await prisma.import.findMany({
      where: queryCond,
      orderBy: { createdAt: 'desc' },
      include: {
        model: true,
        file: true,
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    });
    return res.status(200).json({ status: 'success', data: imports });
  } catch (error) {
    return next(error);
  }
};

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId || 'escola-matriz-default-id';
    const queryCond: any = {};

    if (req.user?.role !== 'SUPER_ADMIN') {
      queryCond.user = {
        tenantId,
      };
    }

    const imports = await prisma.import.findMany({
      where: queryCond,
    });

    const stats = {
      totalImports: imports.length,
      pending: imports.filter((i) => i.status === 'PENDING').length,
      processing: imports.filter((i) => i.status === 'PROCESSING').length,
      completed: imports.filter((i) => i.status === 'COMPLETED').length,
      failed: imports.filter((i) => i.status === 'FAILED').length,
      totalRows: imports.reduce((acc, curr) => acc + curr.totalRows, 0),
      successRows: imports.reduce((acc, curr) => acc + curr.successRows, 0),
      errorRows: imports.reduce((acc, curr) => acc + curr.errorRows, 0),
    };

    return res.status(200).json({ status: 'success', data: stats });
  } catch (error) {
    return next(error);
  }
};

// ─── Analyze File ─────────────────────────────────────────────────────────────
export const analyzeFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileId, modelId } = req.body;
    const fileRecord = await prisma.uploadedFile.findUnique({
      where: { id: fileId },
      include: { user: true },
    });
    if (!fileRecord) {
      return res.status(404).json({ status: 'error', message: 'Arquivo não encontrado' });
    }

    // Verify tenant access to file
    if (req.user?.role !== 'SUPER_ADMIN') {
      if (fileRecord.userId !== req.user?.id && fileRecord.user?.tenantId !== req.tenantId) {
        return res.status(403).json({ status: 'error', message: 'Acesso negado ao arquivo' });
      }
    }

    // Verify model access
    if (modelId) {
      const modelRecord = await prisma.importModel.findUnique({ where: { id: modelId } });
      if (!modelRecord) {
        return res.status(404).json({ status: 'error', message: 'Modelo de mapeamento não encontrado' });
      }
      if (req.user?.role !== 'SUPER_ADMIN') {
        if (modelRecord.userId !== req.user?.id && !modelRecord.isShared) {
          return res.status(403).json({ status: 'error', message: 'Acesso negado ao modelo' });
        }
      }
    }

    const ext = path.extname(fileRecord.fileName).toLowerCase();
    const parser = ParserFactory.getParser(ext);
    const startTime = Date.now();
    const parsedData = await parser.parse(fileRecord.filePath);
    const parsingTimeMs = Date.now() - startTime;

    const analysis = dataAnalyzerService.analyze(
      parsedData,
      fileRecord.fileName,
      fileRecord.fileSize,
      parsingTimeMs
    );

    let headersValidation = null;
    if (modelId) {
      try {
        headersValidation = await fileAnalyzerService.analyzeHeaders(fileId, modelId);
      } catch {
        // Ignored
      }
    }

    return res.status(200).json({ status: 'success', data: { ...analysis, headersValidation } });
  } catch (error) {
    return next(error);
  }
};

// ─── Queue Controls ───────────────────────────────────────────────────────────
export const pauseImport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const importJob = await prisma.import.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!importJob) {
      return res.status(404).json({ status: 'error', message: 'Importação não encontrada' });
    }
    if (req.user?.role !== 'SUPER_ADMIN') {
      if (importJob.userId !== req.user?.id && importJob.user?.tenantId !== req.tenantId) {
        return res.status(403).json({ status: 'error', message: 'Acesso negado' });
      }
    }
    await ImportQueueManager.getInstance().pauseJob(id);
    return res.status(200).json({ status: 'success', message: 'Importação pausada com sucesso' });
  } catch (error) {
    return next(error);
  }
};

export const resumeImport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const importJob = await prisma.import.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!importJob) {
      return res.status(404).json({ status: 'error', message: 'Importação não encontrada' });
    }
    if (req.user?.role !== 'SUPER_ADMIN') {
      if (importJob.userId !== req.user?.id && importJob.user?.tenantId !== req.tenantId) {
        return res.status(403).json({ status: 'error', message: 'Acesso negado' });
      }
    }
    await ImportQueueManager.getInstance().resumeJob(id);
    return res.status(200).json({ status: 'success', message: 'Importação retomada com sucesso' });
  } catch (error) {
    return next(error);
  }
};

export const cancelImport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const importJob = await prisma.import.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!importJob) {
      return res.status(404).json({ status: 'error', message: 'Importação não encontrada' });
    }
    if (req.user?.role !== 'SUPER_ADMIN') {
      if (importJob.userId !== req.user?.id && importJob.user?.tenantId !== req.tenantId) {
        return res.status(403).json({ status: 'error', message: 'Acesso negado' });
      }
    }
    await ImportQueueManager.getInstance().cancelJob(id);
    return res.status(200).json({ status: 'success', message: 'Importação cancelada com sucesso' });
  } catch (error) {
    return next(error);
  }
};

// ─── Reprocess (retry failed import) ─────────────────────────────────────────
export const reprocessImport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existing = await prisma.import.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Importação não encontrada' });
    }

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (existing.userId !== req.user?.id && existing.user?.tenantId !== req.tenantId) {
        return res.status(403).json({ status: 'error', message: 'Acesso negado' });
      }
    }

    // Reset stats and status before reprocessing
    await prisma.import.update({
      where: { id },
      data: {
        status: 'PROCESSING',
        processedRows: 0,
        successRows: 0,
        errorRows: 0,
      },
    });

    await historyRepository.create(
      id,
      'PROCESSING',
      'Reprocessamento solicitado pelo operador — iniciando novo ciclo de importação'
    );

    // Start a fresh queue job
    ImportQueueManager.getInstance().startJob(id);

    return res
      .status(202)
      .json({ status: 'success', message: 'Reprocessamento iniciado com sucesso' });
  } catch (error) {
    return next(error);
  }
};

// ─── List Backups ─────────────────────────────────────────────────────────────
export const listBackups = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ status: 'error', message: 'Acesso negado: Apenas superadministradores podem gerenciar backups globais' });
    }
    const backups = importEngine.listBackups();
    return res.status(200).json({ status: 'success', data: backups });
  } catch (error) {
    return next(error);
  }
};

// ─── Restore Backup ───────────────────────────────────────────────────────────
export const restoreBackup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ status: 'error', message: 'Acesso negado: Apenas superadministradores podem gerenciar backups globais' });
    }
    const { backupName } = req.body;
    if (!backupName) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Nome do arquivo de backup é obrigatório' });
    }
    importEngine.restoreFromBackup(backupName);
    return res.status(200).json({
      status: 'success',
      message: `Banco de dados restaurado com sucesso a partir de: ${backupName}`,
    });
  } catch (error) {
    return next(error);
  }
};
