import { Router } from 'express';
import {
  saveAttendance,
  getAttendance,
  saveContent,
  listContents,
  createActivity,
  deleteActivity,
  listActivities,
  saveActivityGrades,
  saveReportCardAverages,
  getReportCards,
} from '../controllers/academic.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

// Attendance (Frequência)
router.get('/attendance', authorize(['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER']), getAttendance);
router.post('/attendance', authorize(['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER']), saveAttendance);

// Class Contents (Diário de Conteúdos)
router.get('/contents', authorize(['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER']), listContents);
router.post('/contents', authorize(['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER']), saveContent);

// Activities (Atividades)
router.get('/activities', authorize(['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER']), listActivities);
router.post('/activities', authorize(['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER']), createActivity);
router.delete(
  '/activities/:id',
  authorize(['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER']),
  deleteActivity
);

// Activity Grades (Notas de Atividades)
router.post('/grades', authorize(['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER']), saveActivityGrades);

// Report Cards & Bimesters (Boletins e Médias Consolidadas)
router.get(
  '/report-cards',
  authorize(['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER', 'GUARDIAN', 'STUDENT']),
  getReportCards
);
router.post(
  '/report-cards',
  authorize(['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER']),
  saveReportCardAverages
);

export default router;
