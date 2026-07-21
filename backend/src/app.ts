import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { errorHandler } from './middlewares/errorHandler';
import { globalLimiter } from './middlewares/rateLimiter';

import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import guardianRoutes from './routes/guardian.routes';
import enrollmentRoutes from './routes/enrollment.routes';
import teacherRoutes from './routes/teacher.routes';
import employeeRoutes from './routes/employee.routes';
import classroomRoutes from './routes/classroom.routes';
import academicRoutes from './routes/academic.routes';
import financialRoutes from './routes/financial.routes';
import communicationRoutes from './routes/communication.routes';
import libraryRoutes from './routes/library.routes';
import schooldocRoutes from './routes/schooldoc.routes';
import portalRoutes from './routes/portal.routes';
import reportRoutes from './routes/report.routes';
import aiRoutes from './routes/ai.routes';
import ImportRoutes from './routes/ImportRoutes';
import ExportRoutes from './routes/ExportRoutes';
import MigrationRoutes from './routes/MigrationRoutes';
import PublicMigrationRoutes from './routes/PublicMigrationRoutes';

const app = express();

// Security Middlewares
app.use(globalLimiter);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow serving static files cross-origin
  })
);

// CORS: use specific origins in production, wildcard only in development
const corsOrigins =
  env.ALLOWED_ORIGINS === '*' ? '*' : env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parser — limit to 10mb to prevent payload attacks
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Static file serving for uploads (photos and documents) with caching headers
const uploadsDir = path.join(__dirname, 'uploads');
app.use(
  '/uploads',
  express.static(uploadsDir, {
    maxAge: '7d', // Cache static uploads for 7 days
    immutable: true,
  })
);

// Health Check API
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root API Router placeholder
const apiRouter = express.Router();

// Register auth router
apiRouter.use('/auth', authRoutes);

// Register students router
apiRouter.use('/students', studentRoutes);

// Register guardians router
apiRouter.use('/guardians', guardianRoutes);

// Register enrollments router
apiRouter.use('/enrollments', enrollmentRoutes);

// Register teachers router
apiRouter.use('/teachers', teacherRoutes);

// Register employees router
apiRouter.use('/employees', employeeRoutes);

// Register classes and rooms router
apiRouter.use('/', classroomRoutes);

// Register academic router
apiRouter.use('/academic', academicRoutes);

// Register financial router
apiRouter.use('/financial', financialRoutes);

// Register communication router
apiRouter.use('/communication', communicationRoutes);

// Register library router
apiRouter.use('/library', libraryRoutes);

// Register school documents router
apiRouter.use('/schooldocs', schooldocRoutes);

// Register portal router (parent + student portals)
apiRouter.use('/portal', portalRoutes);

// Register reports router
apiRouter.use('/reports', reportRoutes);

// Register AI assistant router
apiRouter.use('/ai', aiRoutes);

// Register Smart Import router
apiRouter.use('/imports', ImportRoutes);

// Register Export router
apiRouter.use('/exports', ExportRoutes);

// Register Migration Center Router
apiRouter.use('/migration', MigrationRoutes);

// Register Public Migration API Routers
apiRouter.use('/import', PublicMigrationRoutes.importRouter);
apiRouter.use('/export', PublicMigrationRoutes.exportRouter);

// Define a placeholder route
apiRouter.get('/', (_req, res) => {
  res.json({ message: 'Welcome to Zx-Escola SaaS API!' });
});

// Register apiRouter under /api
app.use('/api', apiRouter);

// Global Error Handler (must be registered last)
app.use(errorHandler);

export default app;
