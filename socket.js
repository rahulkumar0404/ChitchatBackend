import { v4 as uuid } from 'uuid';
import {
  CHAT_JOINED,
  CHAT_LEAVED,
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  ONLINE_USERS,
  START_TYPING,
  STOP_TYPING,
} from './constants/events.js';
import { getMemberIdsFromMember, getSockets } from './utils/helper.js';
import { Message } from './models/message.js';
import cookieParser from 'cookie-parser';
import { socketAuthenticator } from './middlewares/auth.js';
const userSocketIds = new Map();
const onlineUsers = new Set();
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
      const memberIds = await getMemberIdsFromMember(members);
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
        throw new Error(error.message)
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

    socket.on(CHAT_JOINED, async ({ userId, members }) => {
      onlineUsers.add(userId);
      if (members) {
        const memberIds = await getMemberIdsFromMember(members);
        const membersSocket = getSockets(memberIds);
        io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));
      }
    });
    socket.on(CHAT_LEAVED, async ({ userId, members }) => {
      onlineUsers.delete(userId);
      if (members) {
        const memberIds = await getMemberIdsFromMember(members);
        const membersSocket = getSockets(memberIds);
        io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));
      }
    });

    socket.on('disconnect', () => {
      userSocketIds.delete(user._id.toString());
      onlineUsers.delete(user._id.toString());
      socket.broadcast.emit(ONLINE_USERS, Array.from(onlineUsers));
    });
  });
};

export { setUpSocket, userSocketIds };
