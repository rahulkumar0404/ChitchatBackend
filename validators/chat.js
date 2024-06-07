import { nonEmptyString, nonEmptyString_min3 } from './schemaDefinition.js';

const createGroupChatSchema = {
  $id: '/chat/groupchat',
  type: 'object',
  properties: {
    groupName: nonEmptyString,
    members: {
      type: 'array',
      items: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
    },
  },
  required: ['groupName', 'members'],
  additionalProperties: false,
  errorMessage: {
    type: 'should be an object',
    properties: {
      groupName: 'GroupName is Required.',
      members: 'Members is Required.',
    },
  },
};

const addMembersSchema = {
  $id: '/chat/add/members',
  type: 'object',
  properties: {
    chatId: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
    members: {
      type: 'array',
      items: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
    },
  },
  required: ['chatId', 'members'],
  additionalProperties: false,
  errorMessage: {
    type: 'should be an object',
    properties: {
      chatId: 'Invalid Group or chatId is not Present',
      members: 'Invalid memberId or members is not present',
    },
  },
};

const removeMemberSchema = {
  $id: '/chat/remove/members',
  type: 'object',
  properties: {
    chatId: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
    userId: {
      type: 'array',
      items: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
    },
  },
  required: ['chatId', 'userId'],
  additionalProperties: false,
  errorMessage: {
    type: 'should be an object',
    properties: {
      chatId: 'GroupId is Required.',
      userId: 'UserId is Required.',
    },
  },
};

const updateAdminSchema = {
  $id: '/chat/:groupId/member/:userId',
  type: 'object',
  properties: {
    isAdmin: { type: 'boolean', enum: [true, false] },
  },
  required: ['isAdmin'],
  additionalProperties: false,
};

const updateAdminSchemaId = {
  $id: '/chat/:groupId/member/:userId/2',
  type: 'object',
  properties: {
    groupId: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
    userId: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
  },
  required: ['groupId', 'userId'],
  additionalProperties: false,
};

const renameGroupSchema = {
  $id: '/chat/:id',
  type: 'object',
  properties: {
    name: nonEmptyString_min3,
  },
  required: ['name'],
  additionalProperties: false,
};

const sendAttachmentSchema = {
  $id: '/chat/messages',
  type: 'object',
  properties: {
    chatId: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
  },
  required: ['chatId'],
  additionalProperties: false,
  errorMessage: {
    type: 'should be an string',
    properties: {
      chatId: 'ChatId is required',
    },
  },
};

const chatIdSchema = {
  $id: '/chat/messages/id',
  // ...sendAttachmentSchema,
  properties: {
    id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
  },
  required: ['id'],
  additionalProperties: false,
  errorMessage: {
    type: 'should be an string',
    properties: {
      id: 'Id is required',
    },
  },
};
const sendAttachmentFileSchema = {
  $id: '/chat/messages/attachment',
  type: 'array',
  items: {
    type: 'object',
  },
  minLength: 1,
  maxLength: 5,
  required: ['files'],
  additionalProperties: false,
  errorMessage: {
    type: 'should be an object',
    properties: {
      files: 'At least upload one file',
    },
  },
};

export {
  createGroupChatSchema,
  addMembersSchema,
  removeMemberSchema,
  updateAdminSchema,
  renameGroupSchema,
  updateAdminSchemaId,
  chatIdSchema,
  sendAttachmentFileSchema,
  sendAttachmentSchema,
};
