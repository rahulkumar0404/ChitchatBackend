import express from 'express';
import { isAuthenticated } from '../middlewares/auth.js';
import {
  newGroupChat,
  getMyChats,
  getMyGroups,
  addMembers,
  removeMember,
  updateAdmin,
  leaveGroup,
  sendAttachments,
} from '../controllers/chat.js';
import { attachmentsMulter } from '../middlewares/multer.js';
const app = express.Router();

app.use(isAuthenticated);

app.post('/groupchat', newGroupChat);
app.get('/my', getMyChats);
app.get('/my/groups', getMyGroups);
app.put('/add/members', addMembers);
app.put('/remove/members', removeMember);
app.put('/:groupId/member/:userId', updateAdmin);
app.delete('/leave/:id', leaveGroup);

// send attachment

app.post('/message', attachmentsMulter, sendAttachments);

export default app;
