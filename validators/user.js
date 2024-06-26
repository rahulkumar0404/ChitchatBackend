import {
  nonEmptyString,
  nonEmptyString_min3,
  passwordString,
} from './schemaDefinition.js';
const registerSchema = {
  $id: '/user/signup',
  type: 'object',
  properties: {
    firstName: nonEmptyString_min3,
    lastName: nonEmptyString_min3,
    password: passwordString,
    confirmPassword: passwordString,
    email: { type: 'string', format: 'email' },
    avatar: {
      oneOf: [
        {
          type: 'object',
          properties: {
            public_id: { type: 'string' },
            url: { type: 'string' },
          },
        },
        {
          type: 'string',
        },
        {
          type: 'null',
        },
      ],
    },
    bio: { type: 'string' },
  },
  required: ['firstName', 'lastName', 'password', 'email', 'confirmPassword'],
  additionalProperties: false,
  errorMessage: {
    type: 'should be an object',
    properties: {
      firstName: 'FirstName is Required and minimum 3 character long',
      lastName: 'LastName is Required and minimum 3 character long',
      password: 'Password is Required and minimum 6 character long',
      userName: 'Username is Required and minimum 3 character long',
      email: 'Email is Required',
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

const requestIdSchema = {
  $id: '/user/sendrequest',
  type: 'object',
  properties: {
    receiverId: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
  },
  required: ['receiverId'],
  additionalProperties: false,
  errorMessage: {
    type: 'should be an object',
    properties: {
      receiverId: 'ReceiverId is required',
    },
  },
};
const acceptRequestSchema = {
  $id: '/user/acceptrequest',
  type: 'object',
  properties: {
    senderId: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
    accept: { type: 'boolean', enum: [true, false] },
  },
  required: ['senderId', 'accept'],
  additionalProperties: false,
  errorMessage: {
    type: 'should be an object',
    properties: {
      senderId: 'SenderId is required.',
      accept: 'Please accept the request.',
    },
  },
};

const forgetPasswordSchema = {
  $id: '/user/forgetPassword',
  type: 'object',
  properties: {
    userName: nonEmptyString_min3,
    recaptchaValue: nonEmptyString,
  },
  required: ['userName', 'recaptchaValue'],
  additionalProperties: false,
  errorMessage: {
    type: 'should be an object',
    required: {
      userName: 'Username is Required and minimum 3 character long',
      recaptchaValue: 'captcha is Required',
    },
  },
};

export {
  registerSchema,
  loginSchema,
  requestIdSchema,
  acceptRequestSchema,
  forgetPasswordSchema,
};
