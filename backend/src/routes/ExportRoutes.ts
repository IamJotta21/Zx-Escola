import { Router } from 'express';
import {
  startExport,
  listExports,
  getExportDetails,
  deleteExport,
  downloadExportFile,
} from '../controllers/ExportController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Restricted to ADMIN and DIRETOR roles
router.use(authorize(['ADMIN', 'DIRETOR']));

// Export routes
router.get('/', listExports);
router.post('/start', startExport);
router.get('/:id', getExportDetails);
router.delete('/:id', deleteExport);
router.get('/:id/download', downloadExportFile);

export default router;
