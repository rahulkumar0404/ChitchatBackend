import { v4 as uuid } from 'uuid';
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from './constants/constants.js';
import { getSockets } from './utils/helper.js';
import { Message } from './models/message.js';
const userSocketIds = new Map();

const setUpSocket = (io) => {
  io.use((socket, next) => {});
  io.on('connection', (socket) => {
    const user = {
      _id: 'aaa',
      name: 'abhishek',
    };

    userSocketIds.set(user._id, socket.id);
    socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
      const messageForRealTime = {
        content: message,
        _id: uuid(),
        sender: {
          _id: user._id,
          name: user.name,
        },
        chat: chatId,
        createdAt: new Date().toISOString(),
      };

      const membersSocket = getSockets(members);

      io.to(membersSocket).emit(NEW_MESSAGE, {
        chatId,
        message: messageForRealTime,
      });

      io.to(membersSocket).emit(NEW_MESSAGE_ALERT, { chatId });

      //   console.log('messageForRealTime', messageForRealTime);

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

    socket.on('disconnected', () => {
      userSocketIds.delete(user._id.toString());
    });
  });
};

export { setUpSocket, userSocketIds };
