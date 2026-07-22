import { Router } from 'express';
import {
  listRoles,
  createRole,
  updateRole,
  duplicateRole,
  deleteRole,
} from '../controllers/role.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

// List all roles (accessible to authenticated staff/admins)
router.get('/', listRoles);

// Manage role profiles (restricted to SUPER_ADMIN, ADMIN, DIRETOR)
router.post('/', authorize(['SUPER_ADMIN', 'ADMIN', 'DIRETOR']), createRole);
router.put('/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'DIRETOR']), updateRole);
router.post('/:id/duplicate', authorize(['SUPER_ADMIN', 'ADMIN', 'DIRETOR']), duplicateRole);
router.delete('/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'DIRETOR']), deleteRole);

export default router;
