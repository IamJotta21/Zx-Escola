import { Router } from 'express';
import {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  listEmployees,
  getEmployee,
} from '../controllers/employee.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

router.get('/', authorize(['ADMIN', 'DIRETOR', 'STAFF']), listEmployees);
router.get('/:id', authorize(['ADMIN', 'DIRETOR', 'STAFF']), getEmployee);
router.post('/', authorize(['ADMIN', 'DIRETOR', 'STAFF']), createEmployee);
router.put('/:id', authorize(['ADMIN', 'DIRETOR', 'STAFF']), updateEmployee);
router.delete('/:id', authorize(['ADMIN', 'DIRETOR']), deleteEmployee);

export default router;
