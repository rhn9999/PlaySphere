import { verifyToken } from '../utils/token.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication token is required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw ApiError.unauthorized('Bearer token is malformed');
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Token has expired, please log in again');
      }
      throw ApiError.unauthorized('Invalid authentication token');
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      throw ApiError.unauthorized('User associated with token no longer exists');
    }

    if (user.isBanned) {
      throw ApiError.forbidden('Your account has been suspended by platform administration');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account is deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
