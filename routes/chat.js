import express from 'express';
import {
  addMembers,
  deleteChat,
  getChatDetails,
  getMessages,
  getMyChats,
  getMyGroups,
  leaveGroup,
  newGroupChat,
  reNameGroup,
  removeMember,
  sendAttachments,
  updateAdmin,
} from '../controllers/chat.js';
import { isAuthenticated } from '../middlewares/auth.js';
import { attachmentsMulter } from '../middlewares/multer.js';
import {
  addMemberValidator,
  createGroupChatValidator,
  removeMemberValidator,
  renameGroupValidator,
  updateAdminParamsValidator,
  updateAdminValidator,
  sendAttachmentsValidator,
  chatIdValidator,
} from '../validators/jsonValidator.js';
const app = express.Router();

app.use(isAuthenticated);

app.post('/groupchat', createGroupChatValidator, newGroupChat);
app.get('/my', getMyChats);
app.get('/my/groups', getMyGroups);
app.put('/add/members', addMemberValidator, addMembers);
app.put('/remove/members', removeMemberValidator, removeMember);
app.put(
  '/:groupId/member/:userId',
  updateAdminParamsValidator,
  updateAdminValidator,
  updateAdmin
);
app.delete('/leave/:id', leaveGroup);

// send attachment

app.post('/message', attachmentsMulter,sendAttachmentsValidator, sendAttachments);

app.get('/message/:id',chatIdValidator, getMessages);
app.get('/:id',chatIdValidator, getChatDetails);
app.put('/:id', renameGroupValidator, reNameGroup);
app.delete('/:id',chatIdValidator, deleteChat);

export default app;
