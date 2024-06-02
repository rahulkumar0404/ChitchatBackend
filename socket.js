import { v4 as uuid } from 'uuid';
import {
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  START_TYPING,
  STOP_TYPING,
} from './constants/constants.js';
import { getMemberIdsFromMember, getSockets } from './utils/helper.js';
import { Message } from './models/message.js';
import cookieParser from 'cookie-parser';
import { socketAuthenticator } from './middlewares/auth.js';
const userSocketIds = new Map();

const setUpSocket = (io) => {
  io.use((socket, next) => {
    cookieParser()(socket.request, socket.request.res, async (error) => {
      await socketAuthenticator(error, socket, next);
    });
  });
  io.on('connection', (socket) => {
    const user = socket.user;
    userSocketIds.set(user._id.toString(), socket.id);
    socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
      const messageForRealTime = {
        content: message,
        _id: uuid(),
        sender: {
          _id: user._id,
          name: `${user.first_name} `,
        },
        chat: chatId,
        createdAt: new Date().toISOString(),
      };
      const memberIds = await getMemberIdsFromMember(members)
      const membersSocket = getSockets(memberIds);

      io.to(membersSocket).emit(NEW_MESSAGE, {
        chatId,
        message: messageForRealTime,
      });

      io.to(membersSocket).emit(NEW_MESSAGE_ALERT, { chatId });

      const messageForDatabase = {
        content: message,
        sender: user._id,
        chat: chatId,
      };

      try {
        await Message.create(messageForDatabase);
      } catch (error) {
        console.log(error.message);
      }
    });

    socket.on(START_TYPING, ({ members, chatId }) => {
      const membersIds = members.map((member) => member.user.toString());
      const membersSocket = getSockets(membersIds);
      socket.to(membersSocket).emit(START_TYPING, { chatId });
    });

    socket.on(STOP_TYPING, ({ members, chatId }) => {
      const membersIds = members.map((member) => member.user.toString());
      const membersSocket = getSockets(membersIds);
      socket.to(membersSocket).emit(STOP_TYPING, { chatId });
    });

    socket.on('disconnected', () => {
      userSocketIds.delete(user._id.toString());
    });
  });
};

export { setUpSocket, userSocketIds };
