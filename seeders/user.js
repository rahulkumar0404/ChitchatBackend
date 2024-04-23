import { User } from '../models/user.js';
import { faker, simpleFaker } from '@faker-js/faker';
import { Chat } from '../models/chat.js';
import { Message } from '../models/message.js';
const createUser = async (numUsers) => {
  try {
    const userPromise = [];

    for (let i = 0; i < numUsers; i++) {
      const tempUser = User.create({
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        email: faker.internet.email(),
        username: faker.internet.userName(),
        bio: faker.lorem.sentence(10),
        password: 'password',
        avatar: {
          public_id: faker.system.fileName(),
          url: faker.image.avatar(),
        },
      });
      userPromise.push(tempUser);
    }

    await Promise.all(userPromise);
    console.log('Users created', numUsers);
    process.exit(1);
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }
};

const createSampleSingleChats = async (chatCount) => {
  try {
    const users = await User.find().select('_id');
    const chatsPromise = [];

    for (let i = 0; i < chatCount; i++) {
      for (let j = i+1; j < users.length; j++) {
        chatsPromise.push(
          Chat.create({
            group_name: faker.lorem.words(2),
            members: [
              { user: users[i], isAdmin: false },
              { user: users[j], isAdmin: false },
            ],
          })
        );
      }
    }
    await Promise.all(chatsPromise);
    console.log('Chat created');
    process.exit();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

const createSampleGroupChats = async (numCount) => {
  try {
    const users = await User.find().select('_id');
    const chatsPromise = [];

    for (let i = 0; i < numCount; i++) {
      const numMembers = simpleFaker.number.int({
        min: 3,
        max: users.length,
      });
      const members = [];
      for (let j = 0; j < numMembers; j++) {
        const randomIndex = Math.floor(Math.random() * users.length);
        const randomUser = users[randomIndex];

        if (members.length > 0) {
          const hasUserExist = members.some(
            (member) => member.user === randomUser
          );
          if (!hasUserExist) {
            members.unshift({ user: randomUser, isAdmin: false });
          }
        } else {
          members.push({ user: randomUser, isAdmin: true });
        }
      }
      const chat = Chat.create({
        group_chat: true,
        group_name: faker.lorem.words(1),
        members,
        creator: members[0].user._id.toString(),
      });
      chatsPromise.push(chat);
      await Promise.all(chatsPromise);
      console.log('Group Chats created successfully');
      process.exit();
    }
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

const createSampleMessage = async (numMessages) => {
  try {
    const users = await User.find().select('_id');
    const chats = await Chat.find().select('_id');

    const messagesPromise = [];

    for (let i = 0; i < numMessages; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomChat = chats[Math.floor(Math.random() * chats.length)];

      messagesPromise.push(
        Message.create({
          chat: randomChat,
          sender: randomUser,
          content: faker.lorem.sentence(),
        })
      );
    }

    await Promise.all(messagesPromise);
    console.log('message created successfully');
    process.exit();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

const createMessagesInGroup = async(chatId, numCount) => {
  try {
    const users = await User.find().select('_id');

    const messagesPromise = [];

    for (let i = 0; i < numCount; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];

      messagesPromise.push(
        Message.create({
          chat: chatId,
          sender: randomUser,
          content: faker.lorem.sentence(),
        })
      );
    }

    await Promise.all(messagesPromise);
    console.log('message created successfully');
    process.exit();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
} 
export {
  createUser,
  createSampleSingleChats,
  createSampleGroupChats,
  createSampleMessage,
  createMessagesInGroup,
};
