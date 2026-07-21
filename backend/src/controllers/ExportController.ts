import { Request, Response, NextFunction } from 'express';
import { ExportService } from '../services/ExportService';
import * as fs from 'fs';

const exportService = new ExportService();

// ─── Start Export Job ────────────────────────────────────────────────────────
export const startExport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || '';
    const { format, modules, filterType, filterParams } = req.body;

    if (!format || !modules || !Array.isArray(modules) || modules.length === 0 || !filterType) {
      return res.status(400).json({
        status: 'error',
        message:
          'Parâmetros de exportação inválidos. Formato, módulos e tipo de filtro são obrigatórios.',
      });
    }

    const job = await exportService.createExportJob({
      format,
      modules,
      filterType,
      filterParams,
      userId,
    });

    return res.status(202).json({
      status: 'success',
      message: 'Exportação iniciada em segundo plano.',
      data: job,
    });
  } catch (error) {
    return next(error);
  }
};

// ─── List Exports ────────────────────────────────────────────────────────────
export const listExports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || '';
    const exports = await exportService.listExports(userId);
    return res.status(200).json({
      status: 'success',
      data: exports,
    });
  } catch (error) {
    return next(error);
  }
};

// ─── Get Export Details ───────────────────────────────────────────────────────
export const getExportDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const details = await exportService.getExportDetails(id);
    if (!details) {
      return res.status(404).json({
        status: 'error',
        message: 'Registro de exportação não encontrado.',
      });
    }
    return res.status(200).json({
      status: 'success',
      data: details,
    });
  } catch (error) {
    return next(error);
  }
};

// ─── Delete Export ───────────────────────────────────────────────────────────
export const deleteExport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await exportService.deleteExport(id);
    return res.status(200).json({
      status: 'success',
      message: 'Exportação e arquivo físico removidos com sucesso.',
    });
  } catch (error) {
    return next(error);
  }
};

// ─── Download Export File ─────────────────────────────────────────────────────
export const downloadExportFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const details = await exportService.getExportDetails(id);

    if (!details || details.status !== 'COMPLETED' || !details.filePath) {
      return res.status(404).json({
        status: 'error',
        message: 'Arquivo de exportação não encontrado ou ainda em processamento.',
      });
    }

    if (!fs.existsSync(details.filePath)) {
      return res.status(404).json({
        status: 'error',
        message: 'Arquivo físico de exportação foi removido do servidor.',
      });
    }

    return res.download(details.filePath, details.fileName || 'export.zip');
  } catch (error) {
    return next(error);
  }
};
