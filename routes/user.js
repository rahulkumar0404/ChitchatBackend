import express from 'express';
const app = express.Router();
import { singleImageAvatar } from '../middlewares/multer.js';
import {
  login,
  registerUser,
  getMyProfile,
  logout,
  searchUser,
  sendFriendRequest,
  acceptFriendRequest,
  getMyNotification,
  forgetPassword,
  getMyFriends,
} from '../controllers/user.js';
import { isAuthenticated } from '../middlewares/auth.js';
import {
  registerUserValidator,
  loginUserValidator,
  receiverIdValidator,
  acceptRequestValidator,
} from '../validators/jsonValidator.js';
app.post('/signup', singleImageAvatar, registerUserValidator, registerUser);
app.post('/login', loginUserValidator, login);
app.post('/forget-password', forgetPassword)
// After user must be logged in
app.get('/profile', isAuthenticated, getMyProfile);
app.get('/logout', isAuthenticated, logout);
app.get('/search', isAuthenticated, searchUser);

app.post(
  '/sendrequest',
  isAuthenticated,
  receiverIdValidator,
  sendFriendRequest
);
app.post(
  '/acceptrequest',
  isAuthenticated,
  acceptRequestValidator,
  acceptFriendRequest
);
app.get('/notifications', isAuthenticated, getMyNotification);

app.get('/friends', isAuthenticated, getMyFriends)
export default app;
