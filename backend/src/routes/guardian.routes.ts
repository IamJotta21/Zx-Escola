import { Router } from 'express';
import {
  createGuardian,
  updateGuardian,
  deleteGuardian,
  listGuardians,
  getGuardian,
} from '../controllers/guardian.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Require authentication for all guardian routes
router.use(authenticate);

// CRUD
router.get('/', authorize(['ADMIN', 'DIRETOR', 'STAFF']), listGuardians);
router.get('/:id', authorize(['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER', 'GUARDIAN']), getGuardian);
router.post('/', authorize(['ADMIN', 'DIRETOR', 'STAFF']), createGuardian);
router.put('/:id', authorize(['ADMIN', 'DIRETOR', 'STAFF']), updateGuardian);
router.delete('/:id', authorize(['ADMIN', 'DIRETOR']), deleteGuardian);

export default router;
