import bcrypt from 'bcrypt';
import { User } from '../models/user.js';
import { sendToken, cookieOptions } from '../utils/features.js';
import { ErrorHandler } from '../utils/utility.js';
import { tryCatch } from '../middlewares/error.js';
import {
  INVALID_SIGNUP_DETAILS,
  INVALID_LOGIN_PASSWORD,
  INVALID_LOGIN_EMAIL,
  INVALID_USER,
  USER_NOT_FOUND,
} from '../constants/ExceptionMessage.js';

export const registerUser = tryCatch(async (req, res, next) => {
  const { firstName, lastName, email, password, userName, bio, avatar } =
    req.body;

  if (!firstName || !email || !password || !userName) {
    return next(`${INVALID_SIGNUP_DETAILS}`);
  }

  let avatarData = {};
  if (!avatar) {
    (avatarData['public_id'] = 'aaaa'), (avatarData['url'] = 'sssss');
  } else avatarData = avatar;
  const user = await User.create({
    first_name: firstName,
    last_name: lastName,
    password: password,
    username: userName,
    email,
    bio,
    avatar: avatarData,
  });

  const token = sendToken(user);
  return res
    .status(201)
    .cookie('chitChat', token, cookieOptions)
    .json({ success: true, message: 'User Created successfully' });
});

export const login = tryCatch(async (req, res, next) => {
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

export const getMyProfile = tryCatch(async (req, res, next) => {
  const user = await User.findById(req.userId);

  if (!user) {
    return next(new ErrorHandler(`${USER_NOT_FOUND}`, 400));
  }

  return res.status(200).json({ success: true, user });
});

export const logout = tryCatch(async (req, res, next) => {
  let cookies = { ...cookieOptions, maxAge: 0 };
  return res
    .status(200)
    .cookie('chitChat', '', cookies)
    .json({ success: true, message: 'Logout successfully' });
});

export const searchUser = tryCatch(async (req, res, next) => {
  const { firstName, lastName } = req.query;

  const users = await User.find({ first_name: firstName, last_name: lastName });

  return res.status(200).json({ success: true, users });
});
