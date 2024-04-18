import express from 'express';
const app = express.Router();
import { singleImageAvatar } from '../middlewares/multer.js';
import {
  login,
  registerUser,
  getMyProfile,
  logout,
  searchUser,
} from '../controllers/user.js';
import { isAuthenticated } from '../middlewares/auth.js';
app.post('/signup', singleImageAvatar, registerUser);
app.post('/login', login);

// After user must be logged in
app.get('/profile', isAuthenticated, getMyProfile);
app.get('/logout', isAuthenticated, logout);
app.get('/search', isAuthenticated, searchUser);



export default app;
