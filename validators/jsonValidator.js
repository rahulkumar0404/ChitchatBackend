import Ajv from 'ajv';
import ajvKeyword from 'ajv-keywords';
import ajvFormats from 'ajv-formats'
import ajvErrors from 'ajv-errors';
import { ErrorHandler } from '../utils/utility.js';
import { registerSchema, loginSchema, requestIdSchema, acceptRequestSchema, forgetPasswordSchema } from './user.js';
import {
  addMembersSchema,
  createGroupChatSchema,
  removeMemberSchema,
  renameGroupSchema,
  updateAdminSchema,
  updateAdminSchemaId,
  chatIdSchema,
  sendAttachmentFileSchema,
  sendAttachmentSchema,
} from './chat.js';
import {adminLoginSchema} from './admin.js'
const ajv = new Ajv({ allErrors: true });

ajvErrors(ajvKeyword(ajvFormats(ajv)));
function validateAjvSchema(schemaName, req, res, next) {
  try {
    const validate = ajv.compile(schemaName);

    if (!validate(req.body)) {
      const errorMessage = validate.errors
        .map((error) => error.message)
        .join(',');
      return next(new ErrorHandler(errorMessage, 400));
    } else {
      return next();
    }
  } catch (err) {
    return next(new ErrorHandler(err.message, 400));
  }
}

function validateAjvSchemaParams(schemaName, req, res, next) {
  try {
    const validate = ajv.compile(schemaName);

    if (!validate(req.params)) {
      const errorMessage = validate.errors
        .map((error) => error.message)
        .join(',');
      return next(new ErrorHandler(errorMessage, 400));
    } else return next();
  } catch (err) {
    return next(new ErrorHandler(err.message, 400));
  }
}

function validateAjvFilesSchema(schemaName, req, res, next) {
  try {
    const validate = ajv.compile(schemaName);
    const files = req.files || [];
    if (!validate(files)) {
      const errorMessage = validate.errors
        .map((error) => error.message)
        .join(',');
      return next(new ErrorHandler(errorMessage, 400));
    } else return next();
  } catch (err) {
    return next(new ErrorHandler(err.message, 400));
  }
}

const registerUserValidator = function (req, res, next) {
  validateAjvSchema(registerSchema, req, res, next);
};

const loginUserValidator = function (req, res, next) {
  validateAjvSchema(loginSchema, req, res, next);
};

const createGroupChatValidator = function (req, res, next) {
  validateAjvSchema(createGroupChatSchema, req, res, next);
};

const addMemberValidator = function (req, res, next) {
  validateAjvSchema(addMembersSchema, req, res, next);
};

const removeMemberValidator = function (req, res, next) {
  validateAjvSchema(removeMemberSchema, req, res, next);
};

const updateAdminValidator = function (req, res, next) {
  validateAjvSchema(updateAdminSchema, req, res, next, true);
};

const updateAdminParamsValidator = function (req, res, next) {
  validateAjvSchemaParams(updateAdminSchemaId, req, res, next);
};

const renameGroupValidator = function (req, res, next) {
  validateAjvSchema(renameGroupSchema, req, res, next);
};

const sendAttachmentsValidator = function (req, res, next) {
  validateAjvSchema(sendAttachmentSchema, req, res, (err) => {
    if (err) {
      return next(err);
    }
    validateAjvFilesSchema(sendAttachmentFileSchema, req, res, next);
  });
};

const chatIdValidator = function (req, res, next) {
  validateAjvSchemaParams(chatIdSchema, req, res, next);
};

const receiverIdValidator = function (req, res, next){
  validateAjvSchema(requestIdSchema, req, res, next)
}
const acceptRequestValidator = function (req, res, next){
  validateAjvSchema(acceptRequestSchema, req, res, next)
}

const adminLoginValidator = function (req, res, next){
  validateAjvSchema(adminLoginSchema, req, res, next);
}

const forgetPasswordValidator = function (req, res, next) {
  validateAjvSchema(forgetPasswordSchema, req, res, next);
};
export {
  registerUserValidator,
  loginUserValidator,
  createGroupChatValidator,
  addMemberValidator,
  removeMemberValidator,
  updateAdminValidator,
  renameGroupValidator,
  updateAdminParamsValidator,
  sendAttachmentsValidator,
  chatIdValidator,
  receiverIdValidator,
  acceptRequestValidator,
  adminLoginValidator,
  forgetPasswordValidator,
};
