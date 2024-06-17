import { tryCatch } from '../middlewares/error.js';
import { ErrorHandler } from '../utils/utility.js';
import { Chat } from '../models/chat.js';
import { User } from '../models/user.js';
import {
  emitEvent,
  deleteFilesFromCloudinary,
  uploadFilesToCloudinary,
} from '../utils/features.js';
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
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  REFETCH_CHATS,
} from '../constants/events.js';
import mongoose from 'mongoose';
import { getMemberIdsFromMember } from '../utils/helper.js';
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

  const allMembersUserIds = allMembers.map((member) => member.user.toString());
  const chat = await Chat.create({
    group_name: groupName,
    group_chat: true,
    creator: req.userId,
    members: allMembers,
  });

  emitEvent(req, ALERT, allMembersUserIds, {
    message: `Welcome to ${groupName} groupChat`,
    chatId : chat._id.toString()
  }); //allMembers
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
  const transformedChats = chats.map((chat, index) => {
    return {
      _id: chat._id,
      groupName: chat.group_chat
        ? chat.group_name
        : `${otherMembers[index][0].first_name} ${otherMembers[index][0].last_name}`,
      groupChat: chat.group_chat,
      avatar: chat.group_chat
        ? chat.members.slice(0, 3).map(({ avatar }) => avatar?.url)
        : [otherMembers[index][0].avatar?.url],
      members: chat.members.reduce((prev, curr) => {
        if (curr._id.toString() != req.userId.toString()) {
          prev.push(curr._id);
        }
        return prev;
      }, []),
      // lastMessage: chat.lastMessage,
    };
  });

  const sortedTransformedChats = transformedChats.sort((a, b) => {
    const groupNameA = a.groupName.toUpperCase();
    const groupNameB = b.groupName.toUpperCase();
    if (groupNameA > groupNameB) {
      return 1;
    }
    if (groupNameA < groupNameB) {
      return -1;
    }
    return 0;
  });

  return res.status(200).json({ success: true, chats: sortedTransformedChats });
});

export const getMyGroups = tryCatch(async (req, res, next) => {
  const chats = await fetchGroups(req.userId);

  const groups = chats.map(({ members, _id, group_chat, group_name }) => ({
    _id,
    groupChat: group_chat,
    groupName: group_name,
    avatar: members.slice(0, 3).map(({ avatar }) => avatar?.url),
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

  const chatMemberIds = await getMemberIdsFromMember(chat.members);
  emitEvent(
    req,
    ALERT,
    chatMemberIds,
    `${allUsersName} has been added to the group`
  );

  emitEvent(req, REFETCH_CHATS, chatMemberIds);
  return res
    .status(200)
    .json({ success: true, message: 'Member added successfully' });
});

export const removeMember = tryCatch(async (req, res, next) => {
  const { userId, chatId } = req.body;
  const chat = await validateChat(chatId, req.userId, userId);
  const prevChatMemberIds = await getMemberIdsFromMember(chat.members);
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

  emitEvent(req, REFETCH_CHATS, prevChatMemberIds);
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

  let userMessage = `Message ${
    isAdmin ? 'added' : 'removed'
  } as admin successfully`;
  return res.status(200).json({ success: true, message: userMessage });
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

  if (chatGroup.members.length < 3) {
    return next(new ErrorHandler(`${GROUP_TOO_SMALL}`, 403));
  }
  const groupName = chatGroup.group_name;
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

  const chatMemberIds = await getMemberIdsFromMember(chatGroup.members);
  emitEvent(req, ALERT, chatMemberIds, {
    message: `${user.fullName} has left the group`,
    chatId
  });

  return res.status(200).json({
    success: true,
    message: `You have successfully left the ${groupName} group`,
  });
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

  const attachment = await uploadFilesToCloudinary(files);

  const messageForDb = {
    content: '',
    attachment,
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
  const chatUsers = chat.members.map((member) => member.user.toString());
  emitEvent(req, NEW_MESSAGE, chatUsers, {
    message: messageForRealTime,
    chatId,
  });

  emitEvent(req, NEW_MESSAGE_ALERT, chatUsers, {
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
    // const chat = await Chat.find({
    //   _id: new mongoose.Types.ObjectId(id),
    // })
    //   .populate('members.user', 'first_name last_name avatar')
    //   .lean();
    if (chat.length < 1) {
      return next(new ErrorHandler(`${CHAT_NOT_FOUND}`, 400));
    }
    let newChats = Object.assign(
      {},
      ...chat.map((chat) => ({
        ['chats']: {
          groupName: chat.group_name,
          groupChat: chat.group_chat,
          members: chat.members.map(
            ({ _id, first_name, avatar, last_name }) => ({
              _id,
              name: `${first_name} ${last_name}`,
              avatar: avatar?.url,
            })
          ),
        },
      }))
    );

    return res.status(200).json({ success: true, chat: newChats.chats });
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
  const chatUsers = await getMemberIdsFromMember(chat.members);
  chat.group_name = name;

  await chat.save();

  emitEvent(req, REFETCH_CHATS, chatUsers); //chat.members
  return res.status(200).json({ message: 'Group name changed Successfully' });
});

export const deleteChat = tryCatch(async (req, res, next) => {
  const chatId = req.params.id;
  const userId = req.userId;
  const chat = await Chat.findById(chatId);

  if (!chat) {
    return next(new ErrorHandler(`${CHAT_NOT_FOUND}`, 400));
  }

  let isAdmin = await isUserAdmin(chat, userId);
  if (chat.group_chat && !isAdmin) {
    return next(new ErrorHandler(`${INSUFFICIENT_ACCESS}`, 403));
  }

  let chatMembers = chat.members.map((member) => member.user.toString());
  if (!chat.groupChat && !chatMembers.includes(userId)) {
    return next(new ErrorHandler(`${INSUFFICIENT_ACCESS}`, 403));
  }

  // we have to delete the message + attachments + files

  const messagesWithAttachments = await Message.find({
    chat: chatId,
    attachment: { $exists: true, $ne: [] },
  });
  const publicIds = [];

  messagesWithAttachments.forEach(({ attachment }) => {
    attachment.forEach(({ public_id }) => {
      publicIds.push(public_id);
    });
  });

  await Promise.all([
    // delete files from cloudinary
    deleteFilesFromCloudinary(publicIds),
    chat.deleteOne(),
    Message.deleteMany({ chat: chatId }),
  ]);

  emitEvent(req, REFETCH_CHATS, chatMembers);

  return res.status(200).json({ message: 'Chat deleted successfully' });
});

export const getMessages = tryCatch(async (req, res, next) => {
  const chatId = req.params.id;
  const { page = 1 } = req.query;
  const resultPerPage = 20;

  const skip = (page - 1) * resultPerPage;
  const chat = await Chat.findById(chatId);
  if (!chat) {
    return next(new ErrorHandler('Chat not found', 404));
  }

  const chatMemberIds = await getMemberIdsFromMember(chat.members);
  if (!chatMemberIds.includes(req.userId.toString())) {
    return next(
      new ErrorHandler('You are not allowed to access this chat', 403)
    );
  }

  const [messages, totalMessagesCount] = await Promise.all([
    Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(resultPerPage)
      .populate('sender', 'first_name last_name avatar')
      .lean(),
    Message.countDocuments({ chat: chatId }),
  ]);

  const totalPages = Math.ceil(totalMessagesCount / resultPerPage) || 0;

  return res.status(200).json({
    messages: messages.reverse(),
    totalPages,
  });
});

export const isGroupChat = tryCatch(async (req, res, next) => {
  const { id } = req.params;
  const chat = await Chat.findOne({ _id: id });
  return res.status(200).json({ isGroupChat: chat.group_chat });
});
const validateChat = async (
  chatId,
  userId,
  members,
  isAddOrRemoveMember = true
) => {
  const chatGroup = await Chat.findById(chatId);
  if (!chatGroup) {
    throw new ErrorHandler(`${CHAT_NOT_FOUND}`, 400);
  }

  if (!chatGroup.group_chat) {
    throw new ErrorHandler(`${GROUP_ERROR}`, 400);
  }

  const isAdmin = await isUserAdmin(chatGroup, userId);
  if (!isAdmin) {
    throw new ErrorHandler(`${INSUFFICIENT_ACCESS}`, 403);
  }

  if (isAddOrRemoveMember && (!members || members.length < 1)) {
    throw new ErrorHandler(`${MEMBER_LESS_THAN}`, 400);
  }

  return chatGroup;
};

const isUserAdmin = async (chatGroup, userId) => {
  const chatMembers = chatGroup.members.find(
    (member) => member.user.toString() === userId.toString()
  );
  const isGroupCreator =
    chatGroup.groupChat && chatGroup.creator.toString() != userId.toString();
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
    {
      $sort: {
        group_name: 1, // Sort ascending by first_name
      },
    },
    // {
    //   $group: {
    //     _id: '$_id',
    //     group_name: { $first: '$group_name' },
    //     group_chat: { $first: '$group_chat' },
    //     members: { $push: '$members' },
    //   },
    // },
  ]);
};
