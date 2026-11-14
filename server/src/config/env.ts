import dotenv from 'dotenv';
import path from 'path';

// Load from both standard cwd and server/.env fallback
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const nodeEnv = process.env.NODE_ENV || 'development';

if (nodeEnv === 'production') {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required in production environment.');
  }
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production environment.');
  }
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required in production environment.');
  }
  if (!process.env.CEO_EMAIL) {
    throw new Error('CEO_EMAIL is required in production environment.');
  }
  if (!process.env.CEO_PASSWORD) {
    throw new Error('CEO_PASSWORD is required in production environment.');
  }
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || (nodeEnv === 'production' ? '' : 'mongodb://localhost:27017/shiftpe_crm'),
  jwtSecret: process.env.JWT_SECRET || (nodeEnv === 'production' ? '' : 'shiftpe_jwt_secret_dev_key_32chars_min!'),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  nodeEnv,
  ceo: {
    email: process.env.CEO_EMAIL || (nodeEnv === 'production' ? '' : 'ceo@shiftpe.com'),
    password: process.env.CEO_PASSWORD || (nodeEnv === 'production' ? '' : 'ShiftPeCeo2026!'),
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
