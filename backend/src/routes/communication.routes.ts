import { Router } from 'express';
import {
  sendMessage,
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  listMessageLogs,
  getUserNotifications,
  markNotificationRead,
} from '../controllers/communication.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

// Public announcements viewable by anyone
router.get('/announcements', listAnnouncements);

// Personal notifications viewable by anyone
router.get('/notifications', getUserNotifications);
router.put('/notifications/:id/read', markNotificationRead);

// Dispatch commands and history logs (restricted to administrative/academic roles)
router.post('/send', authorize(['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER']), sendMessage);
router.post(
  '/announcements',
  authorize(['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER']),
  createAnnouncement
);
router.delete(
  '/announcements/:id',
  authorize(['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER']),
  deleteAnnouncement
);
router.get('/logs', authorize(['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER']), listMessageLogs);

export default router;
