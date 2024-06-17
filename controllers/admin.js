import { tryCatch } from '../middlewares/error.js';
import { Chat } from '../models/chat.js';
import { User } from '../models/user.js';
import { Message } from '../models/message.js';
import { ErrorHandler } from '../utils/utility.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { cookieOptions } from '../utils/features.js';
const adminLogin = tryCatch(async (req, res, next) => {
  const { userName, password } = req.body;
  const user = await User.findOne({ username: userName }).select('+password');
  if (!user) {
    return next(new ErrorHandler('Invalid User', 401));
  }
  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    return next(new ErrorHandler('Unauthorized access', 403));
  }
  const token = jwt.sign(
    { id: user._id.toString() },
    process.env.ADMIN_SECRET_TOKEN,
    {
      expiresIn: '15m',
    }
  );
  return res
    .status(200)
    .cookie('chitchat-admin-token', token, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 15,
    })
    .json({ message: `Welcome ${user.first_name} to Admin Panel` });
});

const adminLogout = tryCatch(async (req, res, next) => {
  return res
    .status(200)
    .cookie('chitchat-admin-token', '', { ...cookieOptions, maxAge: 0 })
    .json({ message: 'Logged out successfully' });
});

const getAdminData = tryCatch(async (req, res, next) => {
  return res.status(200).json({ isAdmin: true });
});
const getAllUsers = tryCatch(async (req, res, next) => {
  const users = await User.find({});
  const transformUsers = await Promise.all(
    users.map(async ({ first_name, avatar, username, last_name, _id }) => {
      const [groups, friends] = await Promise.all([
        Chat.countDocuments({ group_chat: true, 'members.user': _id }),
        Chat.countDocuments({ group_chat: false, 'members.user': _id }),
      ]);
      return {
        _id,
        name: `${first_name} ${last_name}`,
        username,
        avatar: avatar.url,
        groups,
        friends,
      };
    })
  );
  return res.status(200).json({ users: transformUsers });
});

const getAllChats = tryCatch(async (req, res, next) => {
  const chats = await Chat.find({})
    .populate('members.user', 'first_name last_name avatar')
    .populate('creator', 'first_name last_name avatar')
    .lean();

  const transformedChat = await Promise.all(
    chats.map(async ({ members, _id, group_chat, group_name, creator }) => {
      const totalMessages = await Message.countDocuments({
        chat: _id.toString(),
      });
      return {
        _id,
        groupChat: group_chat,
        name: group_name,
        avatar: members.map((member) => member.user?.avatar?.url),
        members: members.map(({ _id, user }) => {
          if (!user) {
            console.log(_id);
          }
          return {
            _id,
            name: `${user.first_name} ${user.last_name}`,
            avatar: user?.avatar?.url,
          };
        }),
        creator: {
          name: group_chat
            ? `${creator.first_name} ${creator.last_name}`
            : 'None',
          avatar: group_chat ? creator.avatar?.url : '',
        },
        totalMembers: members.length,
        totalMessages,
      };
    })
  );
  console.log(transformedChat);
  return res.status(200).json({ chats: transformedChat });
});

const getAllMessages = tryCatch(async (req, res, next) => {
  const messages = await Message.find({})
    .populate('sender', 'first_name avatar last_name')
    .populate('chat', 'group_chat');

  const transformMessage = messages.map(
    ({ content, attachment, sender, createdAt, _id, chat }) => ({
      _id,
      attachment,
      content,
      createdAt,
      chat: chat._id,
      groupChat: chat.group_chat,
      sender: {
        _id: sender._id,
        name: `${sender.first_name} ${sender.last_name}`,
        avatar: sender.avatar.url,
      },
    })
  );
  return res.status(200).json({ messages: transformMessage });
});

const getDashboardStats = tryCatch(async (req, res, next) => {
  const [groupsCount, usersCount, messagesCount, totalChatCount] =
    await Promise.all([
      Chat.countDocuments({ group_chat: true }),
      User.countDocuments(),
      Message.countDocuments(),
      Chat.countDocuments(),
    ]);

  const today = new Date();
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const last7DaysMessage = await Message.find({
    createdAt: { $gte: last7Days, $lte: today },
  }).select('createdAt');

  const messages = new Array(7).fill(0);
  const dayInMilisecons = 1000 * 60 * 60 * 24;
  last7DaysMessage.forEach((message) => {
    const index = Math.floor(
      (today.getTime() - message.createdAt.getTime()) / dayInMilisecons
    );
    messages[6 - index]++;
  });

  const stats = {
    groupsCount,
    usersCount,
    messagesCount,
    totalChatCount,
    messages,
  };
  return res.status(200).json({ stats });
});

export {
  adminLogin,
  adminLogout,
  getAdminData,
  getAllUsers,
  getAllChats,
  getAllMessages,
  getDashboardStats,
};
