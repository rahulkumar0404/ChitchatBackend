import { passwordString } from './schemaDefinition.js';

const adminLoginSchema = {
  $id: '/admin/login',
  type: 'object',
  properties: {
    userName: { type: 'string', minLength: 6, required: true },
    password: passwordString,
  },
  required: ['userName', 'password'],
  additionalProperties: false,
  errorMessage: {
    type: 'should be an object',
    properties: {
      userName: 'UserName is required and minimum 6 characters Long',
      password:
        'Password is required and contains atleast one Uppercase,lowercase and number',
    },
  },
};

export { adminLoginSchema };