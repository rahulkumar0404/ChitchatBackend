const nonEmptyString_min3 = {
  type: 'string',
  minLength: 3,
  maxLength: 30,
  transform: ['trim'],
};

const nonEmptyString_min1 = {
  type: 'string',
  minLength: 1,
  transform: ['trim'],
};

const nonEmptyString = {
  type: 'string',
  transform: ['trim'],
};

const passwordString = {
  type: 'string',
  transform: ['trim'],
  pattern: '[a-zA-Z0-9]$',
  minLength: 6,
  maxLength: 20,
};

export {
  nonEmptyString,
  nonEmptyString_min1,
  nonEmptyString_min3,
  passwordString,
};
