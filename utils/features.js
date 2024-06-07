import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { generate } from 'generate-password';
import { v2 as cloudinary } from 'cloudinary';
import { EXPIRES_TIME } from '../constants/events.js';
import { getBase64, getSockets } from './helper.js';
import pLimit from 'p-limit';
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
  const io = req.app.get('io');
  const userSocket = getSockets(users);
  io.to(userSocket).emit(event, data);
};

const deleteFilesFromCloudinary = async (publicIds) => {
  console.log('delete from cloudinary');
};

const generatePassword = async (length) => {
  const password = generate({
    length: length,
    numbers: true,
  });
  return password;
};

const uploadFilesWithRetry = async (file, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          getBase64(file),
          { resource_type: 'auto', public_id: uuid() },
          (error, result) => {
            if (error) {
              console.error(`Attempt ${attempt} - Upload error:`, error);
              return reject(error);
            }
            resolve(result);
          }
        );
      });
    } catch (error) {
      if (attempt < retries) {
        console.log(`Retrying upload (${attempt}/${retries})...`);
      } else {
        throw new Error(
          error.message || 'Error uploading file. Please try again.'
        );
      }
    }
  }
};

const uploadFilesToCloudinary = async (files = [], concurrencyLimit = 5) => {
  if (files.length === 0) {
    throw new Error('No files to upload');
  }

  const limit = pLimit(concurrencyLimit);

  const uploadPromises = files.map((file) =>
    limit(() => uploadFilesWithRetry(file))
  );

  try {
    const results = await Promise.all(uploadPromises);
    const formattedResults = results.map((result) => ({
      public_id: result.public_id,
      url: result.secure_url,
    }));
    return formattedResults;
  } catch (error) {
    console.error('Error during upload:', error);
    throw new Error(
      error.message || 'Error uploading files. Please try again.'
    );
  }
};

export {
  connectDb,
  sendToken,
  cookieOptions,
  emitEvent,
  deleteFilesFromCloudinary,
  generatePassword,
  uploadFilesToCloudinary,
};
