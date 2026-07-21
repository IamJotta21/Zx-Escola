import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  publicImport,
  publicImportUpload,
  publicImportStatus,
  publicExport,
  publicExportStatus,
  publicExportDownload,
} from '../controllers/MigrationController';
import { authenticate, authorize } from '../middlewares/auth';
import { importUpload } from '../middlewares/importUpload';

const apiMigrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 migration requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message:
      'Limite de requisições excedido para a API de migração pública. Tente novamente mais tarde.',
  },
});

const importRouter = Router();
const exportRouter = Router();

// Apply rate limiting, authentication, and role checks
importRouter.use(apiMigrationLimiter, authenticate, authorize(['ADMIN']));
exportRouter.use(apiMigrationLimiter, authenticate, authorize(['ADMIN']));

// Import Routes
importRouter.post('/', publicImport);
importRouter.post('/upload', importUpload.single('file'), publicImportUpload);
importRouter.post('/status', publicImportStatus);

// Export Routes
exportRouter.get('/', publicExport);
exportRouter.get('/status', publicExportStatus);
exportRouter.get('/download', publicExportDownload);

export default {
  importRouter,
  exportRouter,
};
