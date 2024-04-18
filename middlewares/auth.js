import { ErrorHandler } from '../utils/utility.js';
import { tryCatch } from './error.js';
import jwt from 'jsonwebtoken';
import { INVALID_USER } from '../constants/ExceptionMessage.js';

export const isAuthenticated = tryCatch(async (req, res, next) => {
  const token = req.cookies['chitChat'];

  if (!token) {
    return next(new ErrorHandler(`${INVALID_USER}`, 403));
  }

  const decodedData = jwt.verify(token, process.env.SECRET_TOKEN);

  req.userId = decodedData.id;

  next();
});
