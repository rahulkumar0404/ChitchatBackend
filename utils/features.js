import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { EXPIRES_TIME } from '../constants/constants.js';
const connectDb = (uri) => {
  mongoose
    .connect(uri)
    .then(() => {
      console.log(`db connected successfully`);
    })
    .catch((err) => {
      console.log(err.message || 'db connection failure');
    });
};

const sendToken = (user) => {
  const token = jwt.sign({ id: user._id }, process.env.SECRET_TOKEN);
  return token;
};

const cookieOptions = {
  maxAge: EXPIRES_TIME,
  sameSite: 'none',
  httpOnly: true,
  secure: true,
};

const emitEvent = (req, event, users, data) => {
  console.log('emiting event', event);
};
export { connectDb, sendToken, cookieOptions, emitEvent };
