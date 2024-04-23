import { nonEmptyString_min3, passwordString } from './schemaDefinition.js';
const registerSchema = {
  $id: '/user/signup',
  type: 'object',
  properties: {
    firstName: nonEmptyString_min3,
    lastName: nonEmptyString_min3,
    userName: nonEmptyString_min3,
    password: passwordString,
    email: { type: 'string', format: 'email' },
    avatar: {
      type: 'object',
      properties: {
        public_id: { type: 'string' },
        url: { type: 'string' },
      },
    },
    bio: { type: 'string' },
  },
  required: ['firstName', 'lastName', 'userName', 'password', 'email', 'bio'],
  additionalProperties: false,
  errorMessage: {
    type: 'should be an object',
    properties: {
      firstName: 'FirstName is Required and minimum 3 character long',
      lastName: 'LastName is Required and minimum 3 character long',
      userName: 'Username is Required and minimum 3 character long',
      password: 'Password is Required and minimum 6 character long',
      email: 'Email is Required',
      Bio: 'Bio is Required',
    },
  },
};

const loginSchema = {
  $id: '/user/login',
  type: 'object',
  properties: {
    userName: nonEmptyString_min3,
    password: passwordString,
  },
  required: ['userName', 'password'],
  additionalProperties: false,
  errorMessage: {
    type: 'should be an object',
    required: {
      userName: 'Username is Required and minimum 3 character long',
      password: 'Password is Required and minimum 6 character long',
    },
  },
};

export { registerSchema, loginSchema };
