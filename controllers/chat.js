import { tryCatch } from '../middlewares/error.js';
import { ErrorHandler } from '../utils/utility.js';
import { Chat } from '../models/chat.js';
import { User } from '../models/user.js';
import { emitEvent } from '../utils/features.js';
import { Message } from '../models/message.js';
import {
  GROUP_TOO_SMALL,
  GROUP_ERROR,
  CHAT_NOT_FOUND,
  INSUFFICIENT_ACCESS,
  GROUP_LIMIT_REACH,
  MEMBER_LESS_THAN,
  MEMBER_EXIST,
  ONLY_ONE_ADMIN,
} from '../constants/ExceptionMessage.js';
import {
  ALERT,
  NEW_ATTACHMENT,
  NEW_MESSAGE_ALERT,
  REFETCH_CHATS,
} from '../constants/constants.js';
import mongoose from 'mongoose';
export const newGroupChat = tryCatch(async (req, res, next) => {
  const { groupName, members } = req.body;

  if (members.length < 2) {
    return next(new ErrorHandler(`${GROUP_TOO_SMALL}`, 400));
  }

  const allMembers = members.map((member) => ({
    user: member,
    isAdmin: member === req.userId,
  }));

  allMembers.push({ user: req.userId, isAdmin: true });

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
  const chats = await fetchChats(req.userId);
  const otherMembers = chats.map((chat) =>
    chat.members.filter(
      (member) => member._id.toString() !== req.userId.toString()
    )
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
  const chats = await fetchGroups(req.userId);

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

  const chat = await validateChat(chatId, req.userId, members);

  if (chat.members.length > 50) {
    return next(new ErrorHandler(`${GROUP_LIMIT_REACH}`, 400));
  }
  const allNewMembersPromise = members.map((member) => User.findById(member));

  const allNewMembers = await Promise.all(allNewMembersPromise);

  const prevChatMembers = chat.members.map((member) => member.user.toString());

  const newMemberIds = allNewMembers
    .filter((member) => !prevChatMembers.includes(member._id.toString()))
    .map((member) => member._id.toString());

  if (newMemberIds.length === 0) {
    return next(new ErrorHandler(`${MEMBER_EXIST}`, 400));
  }

  newMemberIds.forEach((memberId) =>
    chat.members.push({ user: memberId.toString(), isAdmin: false })
  );

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
  const chat = await validateChat(chatId, req.userId, userId);

  let chatMembers = chat.members.filter(
    (member) => !userId.includes(member.user.toString())
  );

  if (chatMembers.length < 3) {
    return next(new ErrorHandler(`${GROUP_TOO_SMALL}`, 400));
  }

  if (chatMembers.length === chat.members.length) {
    return next(new ErrorHandler('Member does not belong to group', 400));
  }

  chat.members = chatMembers;

  await chat.save();

  emitEvent(req, REFETCH_CHATS, chat.members);
  return res
    .status(200)
    .json({ success: true, message: 'Members removed successfully' });
});

export const updateAdmin = tryCatch(async (req, res, next) => {
  const chatId = req.params.groupId;
  const userId = req.params.userId;
  const isAdmin = req.body.isAdmin;

  const chatGroup = await Chat.findById(chatId);

  if (!chatGroup) {
    return next(new ErrorHandler('Chat group not found', 400));
  }

  const memberIndex = chatGroup.members.findIndex(
    (member) => member.user.toString() === userId
  );
  if (memberIndex === -1) {
    return next(new ErrorHandler('User not present in group', 400));
  }

  const userIsCreator = chatGroup.creator.toString() === req.userId;
  const userIsAdmin = chatGroup.members.some(
    (member) => member.user.toString() === req.userId && member.isAdmin
  );

  if (!userIsCreator && !userIsAdmin) {
    return next(new ErrorHandler(`${INSUFFICIENT_ACCESS}`, 403));
  }

  chatGroup.members[memberIndex].isAdmin = isAdmin;

  await chatGroup.save();

  return res
    .status(200)
    .json({ success: true, message: 'Members added as admin successfully' });
});
export const leaveGroup = tryCatch(async (req, res, next) => {
  const chatId = req.params.id;
  const userId = req.userId;
  const chatGroup = await Chat.findById(chatId);

  if (!chatGroup) {
    return next(new ErrorHandler(`${CHAT_NOT_FOUND}`, 400));
  }

  if (!chatGroup.group_chat) {
    return next(new ErrorHandler(`${GROUP_ERROR}`, 400));
  }

  if (chatGroup.members.length <= 3) {
    return next(new ErrorHandler(`${GROUP_TOO_SMALL}`, 403));
  }

  const userData = chatGroup.members.filter(
    (member) => member.user.toString() === userId.toString()
  );

  if (userData.length === 0) {
    return next(new ErrorHandler('User not Found in Group', 400));
  }

  const isUserAdmin = userData.map((user) => user.isAdmin);
  const remainingAdminMembers = chatGroup.members.filter(
    (member) => member.user.toString() !== userId.toString() && member.isAdmin
  );
  const remainingMembers = chatGroup.members.filter(
    (member) => member.user.toString() !== userId.toString()
  );

  if (isUserAdmin[0]) {
    if (remainingAdminMembers.length === 0) {
      return next(new ErrorHandler(`${ONLY_ONE_ADMIN}`, 403));
    } else {
      const randomEle = Math.floor(
        Math.random() * remainingAdminMembers.length
      );
      const newCreator = remainingAdminMembers[randomEle].user.toString();
      chatGroup.creator = newCreator;
    }
  }
  chatGroup.members = remainingMembers;

  const [user] = await Promise.all([User.findById(userId), chatGroup.save()]);

  emitEvent(
    req,
    ALERT,
    chatGroup.members.user,
    ` ${user.fullName} has left the group`
  );

  return res
    .status(200)
    .json({ success: true, message: `${user.fullName} has left the group` });
});

export const sendAttachments = tryCatch(async (req, res, next) => {
  const { chatId } = req.body;
  const [chat, user] = await Promise.all([
    Chat.findById(chatId),
    User.findById(req.userId),
  ]);

  if (!chat) {
    return next(new ErrorHandler('Chat not found', 404));
  }

  const files = req.files || [];

  if (files.length < 1) {
    return next(new ErrorHandler('Atleast one file is required to send', 400));
  }

  // Upload files here

  const attachments = [];

  const messageForDb = {
    content: '',
    attachments,
    sender: user._id,
    chat: chatId,
  };

  const messageForRealTime = {
    ...messageForDb,
    sender: {
      _id: user._id,
      name: user.fullName,
    },
  };
  const message = await Message.create(messageForDb);
  emitEvent(req, NEW_ATTACHMENT, chat.members, {
    message: messageForRealTime,
    chatId,
  });

  emitEvent(req, NEW_MESSAGE_ALERT, chat.members, {
    chatId,
  });
  return res.status(200).json({
    success: true,
    message,
    //  message: `Attachment sent successfully`
  });
});

export const getChatDetails = tryCatch(async (req, res, next) => {
  const id = req.params.id;
  if (req.query.populate === 'true') {
    const chat = await fetchUserChats(id);
    if (!chat) {
      return next(new ErrorHandler(`${CHAT_NOT_FOUND}`, 400));
    }

    let newChats = chat.map((chat) =>
      chat.members.map(({ _id, first_name, avatar, last_name }) => ({
        _id,
        first_name,
        last_name,
        avatar: avatar.url,
      }))
    );

    return res.status(200).json({ success: true, newChats });
  } else {
    const chat = await Chat.findById(id);
    if (!chat) {
      return next(new ErrorHandler(`${CHAT_NOT_FOUND}`, 400));
    }
    return res.status(200).json({
      chat,
    });
  }
});

export const reNameGroup = tryCatch(async (req, res, next) => {
  const chatId = req.params.id;

  const { name } = req.body;

  const chat = await validateChat(chatId, req.userId, undefined, false);

  chat.group_name = name;

  await chat.save();

  emitEvent(req, REFETCH_CHATS, chat.members);
  return res.status(200).json({ message: 'Group name changed Successfully' });
});

export const deleteChat = tryCatch(async (req, res, next)=>{
  const chatId = req.params.id;

  const chat = await validateChat(chatId, userId, undefined, false)

  
})
const validateChat = async (chatId, userId, members, isAddOrRemoveMember = true) => {
  const chatGroup = await Chat.findById(chatId);
  if (!chatGroup) {
    return next(new ErrorHandler(`${CHAT_NOT_FOUND}`, 400));
  }

  if (!chatGroup.group_chat) {
    return next(new ErrorHandler(`${GROUP_ERROR}`, 400));
  }

  const isAdmin = await isUserAdmin(chatGroup, userId);
  if (!isAdmin) {
    return next(new ErrorHandler(`${INSUFFICIENT_ACCESS}`, 403));
  }

  if (isAddOrRemoveMember && (!members || members.length < 1)) {
    return next(new ErrorHandler(`${MEMBER_LESS_THAN}`, 400));
  }

  return chatGroup;
};

const isUserAdmin = async (chatGroup, userId) => {
  const chatMembers = chatGroup.members.map(
    (member) => member.user.toString() === userId.toString()
  );
  const isGroupCreator = chatGroup.creator.toString() != userId.toString();
  if (chatMembers) {
    return isGroupCreator || chatMembers.isAdmin;
  }
  return false;
};

const fetchUserChats = async (id) => {
  let matchObj = { _id: new mongoose.Types.ObjectId(id) };
  return await aggregation(matchObj);
};

const fetchChats = async (userId) => {
  let matchObj = { 'members.user': new mongoose.Types.ObjectId(userId) };
  return await aggregation(matchObj);
};

const fetchGroups = async (userId) => {
  let matchObj = {
    'members.user': new mongoose.Types.ObjectId(userId),
    'members.isAdmin': true,
    group_chat: true,
  };
  return await aggregation(matchObj);
};

const aggregation = async (matchObj) => {
  return Chat.aggregate([
    {
      $match: matchObj,
    },
    { $unwind: '$members' },
    {
      $lookup: {
        from: 'users',
        localField: 'members.user',
        foreignField: '_id',
        as: 'memberData',
      },
    },
    { $unwind: '$memberData' },
    {
      $group: {
        _id: '$_id',
        group_name: { $first: '$group_name' },
        group_chat: { $first: '$group_chat' },
        members: {
          $push: {
            first_name: '$memberData.first_name',
            last_name: '$memberData.last_name',
            avatar: '$memberData.avatar',
            _id: '$memberData._id',
          },
        },
      },
    },
  ]);
};
