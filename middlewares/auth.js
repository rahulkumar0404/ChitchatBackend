import { ErrorHandler } from '../utils/utility.js';
import { tryCatch } from './error.js';
import jwt from 'jsonwebtoken';
import {
  INVALID_USER,
  INVALID_ADMIN_USER,
} from '../constants/ExceptionMessage.js';
import { User } from '../models/user.js';
import { CHITCHAT_TOKEN } from '../constants/config.js';
export const isAuthenticated = tryCatch(async (req, res, next) => {
  const token = req.cookies[CHITCHAT_TOKEN];

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

export const socketAuthenticator = async (err, socket, next) => {
  try {
    if (err) return next(err);
    const authToken = socket.request.cookies[CHITCHAT_TOKEN];
    if (!authToken) {
      return next(new ErrorHandler(`${INVALID_USER}`, 403));
    }
    const decodedData = jwt.verify(authToken, process.env.SECRET_TOKEN);
    const user = await User.findById(decodedData.id);
    if (!user) return next(new ErrorHandler(`${INVALID_USER}`, 403));
    socket.user = user;
    return next();
  } catch (err) {
    return next(new ErrorHandler(err.message, 500));
  }
};
