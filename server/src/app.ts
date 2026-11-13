import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { config } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import workLogRoutes from './routes/workLogRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import salaryRoutes from './routes/salaryRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import directoryRoutes from './routes/directoryRoutes.js';
import wikiRoutes from './routes/wikiRoutes.js';

export function createApp(): Express {
  const app = express();

  // Security Headers
  app.use(helmet());

  // CORS limited strictly to client origin
  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  // Body Parsing & Cookies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/work', workLogRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/salary', salaryRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/announcements', announcementRoutes);
  app.use('/api/access/directory', directoryRoutes);
  app.use('/api/wiki', wikiRoutes);

  // Serve Static Client in Production if client/dist exists
  const clientDistPath = path.resolve(process.cwd(), 'client/dist');
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get('*', (req: Request, res: Response) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(clientDistPath, 'index.html'));
      } else {
        res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
      }
    });
  } else {
    // 404 Fallback
    app.use((req: Request, res: Response) => {
      res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
    });
  }

  // Global Error Handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({
      error: config.nodeEnv === 'production' ? 'Internal server error' : err.message
    });
  });

  return app;
}
