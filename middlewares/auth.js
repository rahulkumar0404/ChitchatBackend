import { ErrorHandler } from '../utils/utility.js';
import { tryCatch } from './error.js';
import jwt from 'jsonwebtoken';
import {
  INVALID_USER,
  INVALID_ADMIN_USER,
} from '../constants/ExceptionMessage.js';

export const isAuthenticated = tryCatch(async (req, res, next) => {
  const token = req.cookies['chitChat'];

  if (!token) {
    return next(new ErrorHandler(`${INVALID_USER}`, 403));
  }

  const decodedData = jwt.verify(token, process.env.SECRET_TOKEN);

  req.userId = decodedData.id;

  next();
});
export const adminAuthenticated = tryCatch(async (req, res, next) => {
  const token = req.cookies['chitchat-admin-token'];

  if (!token) {
    return next(new ErrorHandler(`${INVALID_ADMIN_USER}`, 403));
  }

  const decodedData = jwt.verify(token, process.env.ADMIN_SECRET_TOKEN);

  req.adminUserId = decodedData.id;

  next();
});
