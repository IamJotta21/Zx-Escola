import { Router } from 'express';
import {
  listTenants,
  getCurrentTenant,
  createTenant,
  updateTenant,
  uploadTenantLogo,
  getPublicTenantInfo,
} from '../controllers/tenant.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

const router = Router();

// Public branding route - accessible without authentication
router.get('/:id/public', getPublicTenantInfo);

router.use(authenticate);

// Public current tenant endpoint accessible to all authenticated users
router.get('/current', getCurrentTenant);

// Admin / Diretor endpoints to manage school tenants
router.get('/', authorize(['ADMIN', 'DIRETOR']), listTenants);
router.post('/', authorize(['ADMIN', 'DIRETOR']), createTenant);
router.put('/:id', authorize(['ADMIN', 'DIRETOR']), updateTenant);
router.post('/:id/logo', authorize(['ADMIN', 'DIRETOR']), upload.single('file'), uploadTenantLogo);

export default router;
