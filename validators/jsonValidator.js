import Ajv from 'ajv';
import ajvKeyword from 'ajv-keywords';
import ajvErrors from 'ajv-errors';
import { ErrorHandler } from '../utils/utility.js';
import { registerSchema, loginSchema } from './user.js';
import {
  addMembersSchema,
  createGroupChatSchema,
  removeMemberSchema,
  renameGroupSchema,
  updateAdminSchema,
} from './chat.js';
const ajv = new Ajv({ allErrors: true });

ajvErrors(ajvKeyword(ajv));
function validateAjvSchema(schemaName, validateWithParams = false) {
  return function (req, res, next) {
    try {
      const validate = ajv.compile(schemaName);

      if (validateWithParams && !validate(req.params)) {
        const errorMessage = validate.errors
          .map((error) => error.message)
          .join(',');
        return next(new ErrorHandler(errorMessage, 400));
      }
      if (!validate(req.body)) {
        const errorMessage = validate.errors
          .map((error) => error.message)
          .join(',');
        return next(new ErrorHandler(errorMessage, 400));
      } else return next();
    } catch (err) {
      return next(new ErrorHandler(err.message, 400));
    }
  };
}

const registerUserValidator = function (req, res, next) {
  validateAjvSchema(registerSchema);
};

const loginUserValidator = function (req, res, next) {
  validateAjvSchema(loginSchema);
};

const createGroupChatValidator = function (req, res, next) {
  validateAjvSchema(createGroupChatSchema);
};

const addMemberValidator = function (req, res, next) {
  validateAjvSchema(addMembersSchema);
};

const removeMemberValidator = function (req, res, next) {
  validateAjvSchema(removeMemberSchema);
};

const updateAdminValidator = function (req, res, next) {
  validateAjvSchema(updateAdminSchema);
};
const renameGroupValidator = function (req, res, next) {
  validateAjvSchema(renameGroupSchema);
};

export {
  registerUserValidator,
  loginUserValidator,
  createGroupChatValidator,
  addMemberValidator,
  removeMemberValidator,
  updateAdminValidator,
  renameGroupValidator,
};
