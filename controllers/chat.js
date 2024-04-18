import { tryCatch } from '../middlewares/error';
import { ErrorHandler } from '../utils/utility.js';
import Chat from '../models/chat.js';
import { emitEvent } from '../utils/features.js';
import { GROUP_TOO_SMALL } from '../constants/ExceptionMessage.js';
import { ALERT, REFETCH_CHATS } from '../constants/constants.js';
export const newGroupChat = tryCatch(async (req, res, next) => {
  const { groupName, members } = req.body;

  if (!members.length < 3) {
    return next(new ErrorHandler(`${GROUP_TOO_SMALL}`, 400));
  }

  const allMembers = [...members, req.userId];

  await Chat.create({
    group_name: groupName,
    group_chat: true,
    creator: req.userId,
    members: allMembers,
  });

  emitEvent(req, ALERT, allMembers, `Welcome to ${groupName} groupChat`);
  emitEvent(req, REFETCH_CHATS, members);

  return res
    .status(201)
    .json({ success: true, message: 'Group created Successfully' });
});
