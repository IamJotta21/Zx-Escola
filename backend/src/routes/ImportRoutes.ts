import { Router } from 'express';
import {
  startImport,
  getImportDetails,
  listImports,
  getDashboardStats,
  analyzeFile,
  pauseImport,
  resumeImport,
  cancelImport,
  reprocessImport,
  listBackups,
  restoreBackup,
} from '../controllers/ImportController';
import { registerUpload, getUploadedFile } from '../controllers/UploadController';
import { getImportHistory, listAllHistory } from '../controllers/HistoryController';
import {
  createModel,
  getModelDetails,
  listModels,
  deleteModel,
} from '../controllers/ModelController';
import { authenticate, authorize } from '../middlewares/auth';
import { validateRequest } from '../middlewares/import.middleware';
import {
  createModelSchema,
  startImportSchema,
  analyzeFileSchema,
} from '../validators/ImportValidator';

import importUpload from '../middlewares/importUpload';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Restricted to ADMIN and DIRETOR roles
router.use(authorize(['ADMIN', 'DIRETOR']));

// Dashboard stats route
router.get('/stats', getDashboardStats);

// Import Process routes
router.get('/', listImports);
router.post('/start', validateRequest(startImportSchema), startImport);
router.post('/analyze', validateRequest(analyzeFileSchema), analyzeFile);
router.get('/backups', listBackups);
router.post('/backups/restore', restoreBackup);
router.post('/:id/pause', pauseImport);
router.post('/:id/resume', resumeImport);
router.post('/:id/cancel', cancelImport);
router.post('/:id/reprocess', reprocessImport);
router.get('/:id', getImportDetails);

// Upload routes
router.post('/upload', importUpload.single('file'), registerUpload);
router.get('/file/:id', getUploadedFile);

// History routes
router.get('/history/all', listAllHistory);
router.get('/history/:importId', getImportHistory);

// Model routes
router.get('/models', listModels);
router.post('/models', validateRequest(createModelSchema), createModel);
router.get('/models/:id', getModelDetails);
router.delete('/models/:id', deleteModel);

export default router;
