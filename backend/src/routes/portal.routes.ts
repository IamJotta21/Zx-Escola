import { Router } from 'express';
import { authenticate, authorize, Role } from '../middlewares/auth';
import {
  getGuardianChildren,
  getGuardianGrades,
  getGuardianFinance,
  getGuardianAttendance,
  getGuardianMessages,
  getGuardianSchedule,
  getGuardianDocuments,
  getStudentProfile,
  getStudentGrades,
  getStudentActivities,
  getStudentCalendar,
  getStudentMaterials,
  getStudentAnnouncements,
  getTeacherProfile,
  getTeacherClasses,
  getTeacherDashboard,
  getTeacherAnnouncements,
} from '../controllers/portal.controller';

const router = Router();
router.use(authenticate);

// ─── Guardian Portal ───────────────────────────────────────────────────────────
const guardianRoles: Role[] = ['GUARDIAN'];

router.get('/guardian/children', authorize(guardianRoles), getGuardianChildren);
router.get('/guardian/grades', authorize(guardianRoles), getGuardianGrades);
router.get('/guardian/finance', authorize(guardianRoles), getGuardianFinance);
router.get('/guardian/attendance', authorize(guardianRoles), getGuardianAttendance);
router.get('/guardian/messages', authorize(guardianRoles), getGuardianMessages);
router.get('/guardian/schedule', authorize(guardianRoles), getGuardianSchedule);
router.get('/guardian/documents', authorize(guardianRoles), getGuardianDocuments);

// ─── Student Portal ────────────────────────────────────────────────────────────
const studentRoles: Role[] = ['STUDENT'];

router.get('/student/profile', authorize(studentRoles), getStudentProfile);
router.get('/student/grades', authorize(studentRoles), getStudentGrades);
router.get('/student/activities', authorize(studentRoles), getStudentActivities);
router.get('/student/calendar', authorize(studentRoles), getStudentCalendar);
router.get('/student/materials', authorize(studentRoles), getStudentMaterials);
router.get('/student/announcements', authorize(studentRoles), getStudentAnnouncements);

// ─── Teacher Portal ────────────────────────────────────────────────────────────
const teacherRoles: Role[] = ['TEACHER'];

router.get('/teacher/profile', authorize(teacherRoles), getTeacherProfile);
router.get('/teacher/classes', authorize(teacherRoles), getTeacherClasses);
router.get('/teacher/dashboard', authorize(teacherRoles), getTeacherDashboard);
router.get('/teacher/announcements', authorize(teacherRoles), getTeacherAnnouncements);

export default router;
