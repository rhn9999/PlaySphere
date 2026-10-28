import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';

export const signToken = (payload, options = {}) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    ...options
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

export const generateQrPass = (prefix = 'PASS') => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${randomBytes}`;
};
