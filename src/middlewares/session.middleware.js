import session from 'express-session';
import dotenv from 'dotenv';

dotenv.config();

export const sessionMiddleware = session({
  name: 'sid',
  secret: process.env.SESSION_SECRET || 'super_secret_key_123',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Automatically secure in production
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
});
