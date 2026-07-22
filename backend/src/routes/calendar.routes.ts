import { Router } from 'express';
import {
  listCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../controllers/calendar.controller';
import { authenticate, authorize, Role } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

const staffRoles: Role[] = ['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER'];

// Public list accessible to all logged-in roles
router.get('/events', listCalendarEvents);

// Event management endpoints restricted to staff/teachers
router.post('/events', authorize(staffRoles), createCalendarEvent);
router.put('/events/:id', authorize(staffRoles), updateCalendarEvent);
router.delete('/events/:id', authorize(staffRoles), deleteCalendarEvent);

export default router;
