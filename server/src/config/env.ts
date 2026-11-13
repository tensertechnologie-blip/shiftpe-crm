import dotenv from 'dotenv';
import path from 'path';

// Load from both standard cwd and server/.env fallback
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/shiftpe_crm',
  jwtSecret: process.env.JWT_SECRET || 'shiftpe_jwt_secret_dev_key',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  ceo: {
    email: process.env.CEO_EMAIL || 'ceo@shiftpe.com',
    password: process.env.CEO_PASSWORD || 'ShiftPeCeo2026!',
    name: process.env.CEO_NAME || 'ShiftPe Founder',
    phone: process.env.CEO_PHONE || '+91 9876543210'
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || '"ShiftPe Team" <no-reply@shiftpe.in>'
  }
};
