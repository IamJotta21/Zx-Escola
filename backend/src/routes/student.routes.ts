import { Router } from 'express';
import {
  createStudent,
  updateStudent,
  deleteStudent,
  listStudents,
  getStudent,
  uploadDocument,
} from '../controllers/student.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

const router = Router();

// All student routes require authentication
router.use(authenticate);

// List and Get Student - Accessible by Admin, Diretor, Staff (Secretary) and Teacher
router.get('/', authorize(['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER']), listStudents);
router.get(
  '/:id',
  authorize(['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER', 'GUARDIAN', 'STUDENT']),
  getStudent
);

// Create, Update, Delete - Restricted to Admin, Diretor, Staff
router.post('/', authorize(['ADMIN', 'DIRETOR', 'STAFF']), createStudent);
router.put('/:id', authorize(['ADMIN', 'DIRETOR', 'STAFF']), updateStudent);
router.delete('/:id', authorize(['ADMIN', 'DIRETOR']), deleteStudent);

// Upload Documents - Admin, Diretor, Staff
router.post(
  '/:id/documents',
  authorize(['ADMIN', 'DIRETOR', 'STAFF']),
  upload.single('file'),
  uploadDocument
);

export default router;
