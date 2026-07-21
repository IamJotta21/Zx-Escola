import { Router } from 'express';
import {
  createRoom,
  updateRoom,
  deleteRoom,
  listRooms,
  createClass,
  updateClass,
  deleteClass,
  listClasses,
  getClass,
  associateStudents,
} from '../controllers/classroom.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

// Rooms Management
router.get('/rooms', authorize(['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER']), listRooms);
router.post('/rooms', authorize(['ADMIN', 'DIRETOR', 'STAFF']), createRoom);
router.put('/rooms/:id', authorize(['ADMIN', 'DIRETOR', 'STAFF']), updateRoom);
router.delete('/rooms/:id', authorize(['ADMIN', 'DIRETOR']), deleteRoom);

// Classes Management
router.get('/classes', authorize(['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER']), listClasses);
router.get('/classes/:id', authorize(['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER']), getClass);
router.post('/classes', authorize(['ADMIN', 'DIRETOR', 'STAFF']), createClass);
router.put('/classes/:id', authorize(['ADMIN', 'DIRETOR', 'STAFF']), updateClass);
router.delete('/classes/:id', authorize(['ADMIN', 'DIRETOR']), deleteClass);

// Associate/enroll students to a class
router.post(
  '/classes/:classId/students',
  authorize(['ADMIN', 'DIRETOR', 'STAFF']),
  associateStudents
);

export default router;
