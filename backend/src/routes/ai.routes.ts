import { Router } from 'express';
import { authenticate, authorize, Role } from '../middlewares/auth';
import { aiLimiter } from '../middlewares/rateLimiter';
import {
  generateQuestions,
  generateLessonPlan,
  summarizeStudent,
  askAssistant,
  generateAnnouncement,
} from '../controllers/ai.controller';

const router = Router();
router.use(authenticate);
router.use(aiLimiter);

const allowedRoles: Role[] = ['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER'];

router.post('/generate-questions', authorize(allowedRoles), generateQuestions);
router.post('/generate-lesson-plan', authorize(allowedRoles), generateLessonPlan);
router.post('/summarize-student', authorize(allowedRoles), summarizeStudent);
router.post('/ask-assistant', authorize(allowedRoles), askAssistant);
router.post('/generate-announcement', authorize(allowedRoles), generateAnnouncement);

export default router;
