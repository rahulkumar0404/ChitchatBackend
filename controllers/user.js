import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import axios from 'axios';
import {
  INVALID_LOGIN_EMAIL,
  INVALID_LOGIN_PASSWORD,
  INVALID_SIGNUP_DETAILS,
  PREVIOUS_USER_EXIST,
  USER_NOT_FOUND,
  PASSWORD_NOT_MATCH,
} from '../constants/ExceptionMessage.js';
import { tryCatch } from '../middlewares/error.js';
import { Chat } from '../models/chat.js';
import { User } from '../models/user.js';
import { Request } from '../models/request.js';
import {
  cookieOptions,
  emitEvent,
  sendToken,
  generatePassword,
  uploadFilesToCloudinary,
} from '../utils/features.js';
import { ErrorHandler } from '../utils/utility.js';
import { NEW_REQUEST, REFETCH_CHATS } from '../constants/events.js';
import { sendMail } from '../utils/mail.js';
import { generate } from 'generate-password';
const registerUser = tryCatch(async (req, res, next) => {
  const { firstName, lastName, email, password, bio, confirmPassword } =
    req.body;
  const file = req?.file;
  if (!firstName || !email || !password || !confirmPassword) {
    return next(new ErrorHandler(`${INVALID_SIGNUP_DETAILS}`, 400));
  }

  if (password !== confirmPassword) {
    return next(new ErrorHandler(`${PASSWORD_NOT_MATCH}`, 400));
  }

  let avatarData = {};
  // if (!file) {
  //   (avatarData['public_id'] = 'aaaa'), (avatarData['url'] = 'sssss');
  // } else {
  if (file) {
    const result = await uploadFilesToCloudinary([file]);
    const avatar = {
      public_id: result[0].public_id,
      url: result[0].url,
    };
    avatarData = avatar;
  }
  const isUserExistWithEmail = await User.find({ email: email });

  if (isUserExistWithEmail.length > 0) {
    return next(new ErrorHandler(`${PREVIOUS_USER_EXIST}`, 400));
  }

  const userName = await getUsername(8);
  const user = await User.create({
    first_name: firstName,
    last_name: lastName,
    password: password,
    username: userName,
    email,
    bio,
    avatar: avatarData,
  });
  let userMessage = `<div>Your Username is <b> ${userName}</b>. You can login with this Username or Email </div>`;
  await sendMail(email, firstName, userMessage);
  const token = sendToken(user);
  return res
    .status(201)
    .cookie('chitChat', token, cookieOptions)
    .json({ _id: user._id.toString(), message: 'User Created successfully' });
});

const login = tryCatch(async (req, res, next) => {
  const { userName: value, password } = req.body;

  const user = await User.findOne({
    $or: [{ username: value }, { email: value }],
  }).select('+password');

  if (!user) {
    return next(new ErrorHandler(`${INVALID_LOGIN_EMAIL}`, 403));
  }
  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    return next(new ErrorHandler(`${INVALID_LOGIN_PASSWORD}`, 403));
  }

  const token = sendToken(user);

  return res
    .status(200)
    .cookie('chitChat', token, cookieOptions)
    .json({ success: true, message: `Welcome Back ${user.first_name}` });
});

const getMyProfile = tryCatch(async (req, res, next) => {
  const user = await User.findById(req.userId);

  if (!user) {
    return next(new ErrorHandler(`${USER_NOT_FOUND}`, 400));
  }

  return res.status(200).json({ success: true, user });
});

const logout = tryCatch(async (req, res, next) => {
  let cookies = { ...cookieOptions, maxAge: 0 };
  return res
    .status(200)
    .cookie('chitChat', '', cookies)
    .json({ success: true, message: 'Logout successfully' });
});

const searchUser = tryCatch(async (req, res, next) => {
  const { firstName = '' } = req.query;

  const myChats = await Chat.find({
    $and: [
      { group_chat: false },
      {
        members: {
          $elemMatch: { user: new mongoose.Types.ObjectId(req.userId) },
        },
      },
    ],
  });
  const allUsersFromMyChats = myChats
    .map((chat) => chat.members.map((member) => member.user.toString()))
    .flat();

  const allUserExceptMeAndFriends = await User.find({
    _id: { $nin: allUsersFromMyChats },
    first_name: { $regex: firstName, $options: 'i' },
  });
  const users = allUserExceptMeAndFriends.map(
    ({ _id, avatar, first_name, last_name }) => ({
      _id,
      avatar: avatar.url,
      name: `${first_name} ${last_name}`,
    })
  );
  return res.status(200).json({ users });
});

const sendFriendRequest = tryCatch(async (req, res, next) => {
  const { receiverId } = req.body;

  const request = await Request.find({
    $or: [
      { sender: req.userId, receiver: receiverId },
      { sender: receiverId, receiver: req.userId },
    ],
  });

  if (request.length > 0) {
    return next(new ErrorHandler('Request already send', 400));
  }

  const newRequest = await Request.create({
    sender: req.userId,
    receiver: receiverId,
  });

  emitEvent(req, NEW_REQUEST, [receiverId]);
  return res.status(200).json({
    _id: newRequest._id.toString(),
    message: 'Request sent successfully',
  });
});

const acceptFriendRequest = tryCatch(async (req, res, next) => {
  const { senderId, accept } = req.body;

  const request = await Request.findOne({
    sender: senderId,
    receiver: req.userId,
  })
    .populate('sender', 'first_name last_name')
    .populate('receiver', 'first_name last_name');

  if (!request) {
    return next(new ErrorHandler('Request not found', 400));
  }

  if (request.receiver._id.toString() !== req.userId.toString()) {
    return next(
      new ErrorHandler('You are not authorized to accept this request', 401)
    );
  }

  if (request.status === 'accepted') {
    return next(new ErrorHandler('User exist in your chat'));
  }
  if (!accept && request.status === 'pending') {
    await request.deleteOne();

    return res.status(200).json({
      message: 'Request deleted successfully',
    });
  }
  const members = [
    { user: request.sender._id.toString() },
    { user: request.receiver._id.toString() },
  ];

  const [message] = await Promise.all([
    Chat.create({
      members,
      group_name: `${request.sender.first_name} - ${request.receiver.first_name}`,
    }),
    request.updateOne({ status: 'accepted' }),
  ]);

  emitEvent(req, REFETCH_CHATS, members);
  return res.status(200).json({
    message: 'Friend Request accepted',
    senderId: request.sender._id,
    message_id: message._id.toString(),
  });
});

const getMyNotification = tryCatch(async (req, res, next) => {
  const request = await Request.find({
    $and: [{ receiver: req.userId }, { status: 'pending' }],
  }).populate({
    path: 'sender',
    select: 'first_name last_name avatar',
  });
  const allRequests = request.map(({ _id, sender }) => ({
    _id,
    sender: {
      _id: sender._id,
      name: `${sender.first_name} ${sender.last_name}`,
      avatar: sender.avatar.url,
    },
  }));

  const result = allRequests.length > 0 ? allRequests : 'No Request exist';
  return res.status(200).json({ result });
});

const forgetPassword = tryCatch(async (req, res, next) => {
  const { userName, recaptchaValue } = req.body;
  const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;
  const response = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecretKey}&response=${recaptchaValue}`
  );
  console.log(response);
  if (response.success) {
    return next(new ErrorHandler('Captcha Verification failed'));
  }
  const user = await User.find({ username: userName });

  if (!user) {
    return next(new ErrorHandler('User not found', 400));
  }
  const password = await generatePassword(8);
  let userMessage = `Your New Password is <b>${password}</b>.<br>You can login with this Password`;
  // await user.updateOne({ password: password });

  await sendMail(user.email, user.first_name, userMessage);
  // const token = sendToken(user); cookie('chitChat', token, cookieOptions)
  return res.status(200).json({
    // _id: user._id.toString(),
    message: 'New Password send successfully to your email',
  });
});

const getMyFriends = tryCatch(async (req, res, next) => {
  const chatId = req.query.chatId;

  const chats = await Chat.find({
    $and: [
      {
        members: { $elemMatch: { user: req.userId.toString() } },
      },
      { group_chat: false },
    ],
  })
    .populate('members.user', 'first_name last_name avatar')
    .lean();

  const friends = chats.map(({ members }) => {
    const otherUser = members.find(
      (member) => member.user._id.toString() !== req.userId.toString()
    );
    return {
      _id: otherUser.user._id.toString(),
      name: `${otherUser.user.first_name} ${otherUser.user.last_name}`,
      avatar: otherUser.user.avatar?.url,
    };
  });

  if (chatId) {
    const userChats = await Chat.findById(chatId);
    const chatMembers = userChats.members.map((member) =>
      member.user.toString()
    );
    const availableFriends = friends.filter(
      (friend) => !chatMembers.includes(friend._id)
    );
    return res.status(200).json({ availableFriends });
  } else {
    return res.status(200).json({ friends });
  }
});

async function getUsername(length) {
  const username = generate({ length: length, numbers: false });
  const existingUser = await User.findOne({ username });
  if (!existingUser) {
    return username;
  }
  return getUsername(length);
}

export {
  registerUser,
  login,
  getMyProfile,
  logout,
  searchUser,
  sendFriendRequest,
  acceptFriendRequest,
  getMyNotification,
  forgetPassword,
  getMyFriends,
};
