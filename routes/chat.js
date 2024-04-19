import express from 'express';
import { isAuthenticated } from '../middlewares/auth.js';
import {
  newGroupChat,
  getMyChats,
  getMyGroups,
  addMembers,
} from '../controllers/chat.js';
const app = express.Router();

app.use(isAuthenticated);

app.post('/groupchat', newGroupChat);
app.get('/my', getMyChats);
app.get('/my/groups', getMyGroups);
app.put('/add/members', addMembers);

export default app;
