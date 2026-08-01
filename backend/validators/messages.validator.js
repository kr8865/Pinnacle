const { body, param } = require('express-validator');

const withUserParamValidator = [param('withUserId').isMongoId().withMessage('Invalid user id')];

const sendMessageValidator = [
  body('to').isMongoId().withMessage('Valid recipient id is required'),
  body('body').trim().notEmpty().withMessage('Message body is required'),
];

module.exports = { withUserParamValidator, sendMessageValidator };
