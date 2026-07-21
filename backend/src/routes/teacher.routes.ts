import { Router } from 'express';
import {
  createTeacher,
  updateTeacher,
  deleteTeacher,
  listTeachers,
  getTeacher,
} from '../controllers/teacher.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

router.get('/', authorize(['ADMIN', 'DIRETOR', 'STAFF']), listTeachers);
router.get('/:id', authorize(['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER']), getTeacher);
router.post('/', authorize(['ADMIN', 'DIRETOR', 'STAFF']), createTeacher);
router.put('/:id', authorize(['ADMIN', 'DIRETOR', 'STAFF']), updateTeacher);
router.delete('/:id', authorize(['ADMIN', 'DIRETOR']), deleteTeacher);

export default router;
