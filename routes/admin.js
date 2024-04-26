import express from 'express';
import {
  adminLogin,
  getAllUsers,
  getAllChats,
  getAllMessages,
  getDashboardStats,
  adminLogout,
  getAdminData,
} from '../controllers/admin.js';
import { adminLoginValidator } from '../validators/jsonValidator.js';
import { adminAuthenticated } from '../middlewares/auth.js';
const app = express.Router();

app.post('/login', adminLoginValidator, adminLogin);
app.get('/logout', adminLogout);

app.use(adminAuthenticated);
app.get('/', getAdminData);
app.get('/users', getAllUsers);
app.get('/chats', getAllChats);
app.get('/messages', getAllMessages);
app.get('/stats', getDashboardStats);
export default app;
