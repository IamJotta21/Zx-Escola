import { Router } from 'express';
import {
  listImportModels,
  createImportModel,
  updateImportModel,
  duplicateImportModel,
  deleteImportModel,
  shareImportModel,
  listExportModels,
  createExportModel,
  updateExportModel,
  duplicateExportModel,
  deleteExportModel,
  shareExportModel,
  listScheduledJobs,
  createScheduledJob,
  updateScheduledJob,
  deleteScheduledJob,
  toggleScheduledJob,
  runScheduledJobNow,
  listJobExecutions,
} from '../controllers/MigrationController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// All internal migration routes require authentication and are restricted to ADMIN and DIRETOR
router.use(authenticate);
router.use(authorize(['ADMIN', 'DIRETOR']));

// Import Models
router.get('/models/import', listImportModels);
router.post('/models/import', createImportModel);
router.put('/models/import/:id', updateImportModel);
router.post('/models/import/:id/duplicate', duplicateImportModel);
router.delete('/models/import/:id', deleteImportModel);
router.post('/models/import/:id/share', shareImportModel);

// Export Models
router.get('/models/export', listExportModels);
router.post('/models/export', createExportModel);
router.put('/models/export/:id', updateExportModel);
router.post('/models/export/:id/duplicate', duplicateExportModel);
router.delete('/models/export/:id', deleteExportModel);
router.post('/models/export/:id/share', shareExportModel);

// Scheduled Jobs
router.get('/schedules', listScheduledJobs);
router.post('/schedules', createScheduledJob);
router.put('/schedules/:id', updateScheduledJob);
router.delete('/schedules/:id', deleteScheduledJob);
router.post('/schedules/:id/toggle', toggleScheduledJob);
router.post('/schedules/:id/run', runScheduledJobNow);
router.get('/schedules/:id/executions', listJobExecutions);

export default router;
