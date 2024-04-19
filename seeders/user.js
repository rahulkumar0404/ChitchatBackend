import { User } from '../models/user.js';
import { faker } from '@faker-js/faker';
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

export { createUser };
