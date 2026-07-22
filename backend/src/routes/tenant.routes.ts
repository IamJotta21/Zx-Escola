import { Router } from 'express';
import {
  listTenants,
  getCurrentTenant,
  createTenant,
  updateTenant,
} from '../controllers/tenant.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

// Public current tenant endpoint accessible to all authenticated users
router.get('/current', getCurrentTenant);

// Admin / Diretor endpoints to manage school tenants
router.get('/', authorize(['ADMIN', 'DIRETOR']), listTenants);
router.post('/', authorize(['ADMIN', 'DIRETOR']), createTenant);
router.put('/:id', authorize(['ADMIN', 'DIRETOR']), updateTenant);

export default router;
