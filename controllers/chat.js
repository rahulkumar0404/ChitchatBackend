import { tryCatch } from '../middlewares/error.js';
import { ErrorHandler } from '../utils/utility.js';
import { Chat } from '../models/chat.js';
import { User } from '../models/user.js';
import { emitEvent } from '../utils/features.js';
import {
  GROUP_TOO_SMALL,
  GROUP_ERROR,
  CHAT_NOT_FOUND,
  INSUFFICIENT_ACCESS,
  GROUP_LIMIT_REACH,
  MEMBER_LESS_THAN,
  MEMBER_EXIST,
} from '../constants/ExceptionMessage.js';
import { ALERT, REFETCH_CHATS } from '../constants/constants.js';
export const newGroupChat = tryCatch(async (req, res, next) => {
  const { groupName, members } = req.body;

  if (members.length < 2) {
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

export const getMyChats = tryCatch(async (req, res, next) => {
  const chats = await Chat.find({ members: req.userId }).populate({
    path: 'members',
    select: 'first_name last_name avatar',
  });

  const otherMembers = chats[0].members.find(
    (member) => member._id.toString() !== req.userId.toString()
  );
  const transformedChats = chats.map((chat) => {
    return {
      _id: chat._id,
      groupName: chat.group_chat
        ? chat.group_name
        : `${otherMembers.first_name} ${otherMembers.last_name}`,
      groupChat: chat.group_chat,
      avatar: chat.group_chat
        ? chat.members.slice(0, 3).map(({ avatar }) => avatar.url)
        : [otherMembers.avatar.url],
      members: chat.members.reduce((prev, curr) => {
        if (curr._id.toString() != req.userId.toString()) {
          prev.push(curr._id);
        }
        return prev;
      }, []),
      // lastMessage: chat.lastMessage,
    };
  });
  return res.status(200).json({ success: true, chats: transformedChats });
});

export const getMyGroups = tryCatch(async (req, res, next) => {
  const chats = await Chat.find({
    members: req.userId,
    group_chat: true,
    creator: req.userId,
  }).populate({ path: 'members', select: 'first_name last_name avatar' });

  const groups = chats.map(({ members, _id, group_chat, group_name }) => ({
    _id,
    groupChat: group_chat,
    groupName: group_name,
    avatar: members.slice(0, 3).map(({ avatar }) => avatar.url),
  }));

  return res.status(200).json({ success: true, groups: groups });
});

export const addMembers = tryCatch(async (req, res, next) => {
  const { chatId, members } = req.body;

  const chat = await validateChat(chatId, req.userId);

  if (!members || members.length < 1) {
    return next(new ErrorHandler(`${MEMBER_LESS_THAN}`, 400));
  }

  if (chat.members.length > 50) {
    return next(new ErrorHandler(`${GROUP_LIMIT_REACH}`, 400));
  }
  const allNewMembersPromise = members.map((member) => User.findById(member));

  const allNewMembers = await Promise.all(allNewMembersPromise);

  const prevChatMembers = chat.members.map((member) => member._id.toString());

  const newMemberIds = allNewMembers
    .filter((member) => !prevChatMembers.includes(member._id.toString()))
    .map((member) => member._id);

  if (newMemberIds.length === 0) {
    return next(new ErrorHandler(`${MEMBER_EXIST}`, 400));
  }
  chat.members.push(...newMemberIds);

  await chat.save();

  const allUsersName = allNewMembers
    .map((member) => `${member.first_name} ${member.last_name}`)
    .join(',');

  emitEvent(
    req,
    ALERT,
    chat.members,
    `${allUsersName} has been added to the group`
  );

  emitEvent(req, REFETCH_CHATS, chat.members);
  return res
    .status(200)
    .json({ success: true, message: 'Member added successfully' });
});

export const removeMember = tryCatch(async (req, res, next) => {
  const { userId, chatId } = req.body;
  const chat = await validateChat(chatId, req.userId);

  let chatMembers = chat.members.filter(
    (member) => !userId.includes(member._id.toString())
  );

  if (chatMembers.length < 3) {
    return next(new ErrorHandler(`${GROUP_TOO_SMALL}`, 400));
  }

  chat.members = chatMembers;

  await chat.save();

  emitEvent(req, REFETCH_CHATS, chat.members);
  return res
    .status(200)
    .json({ success: true, message: 'Members removed successfully' });
});



const validateChat = async (chatId, userId) => {
  const chat = await Chat.findById(chatId);

  if (!chat) {
    return next(new ErrorHandler(`${CHAT_NOT_FOUND}`, 400));
  }

  if (!chat.group_chat) {
    return next(new ErrorHandler(`${GROUP_ERROR}`, 400));
  }

  if (chat.creator.toString() != userId.toString()) {
    return next(new ErrorHandler(`${INSUFFICIENT_ACCESS}`, 403));
  }

  return chat;
};
