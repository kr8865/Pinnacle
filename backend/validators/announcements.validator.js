const { body, param } = require('express-validator');

const createValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('body').trim().notEmpty().withMessage('Body is required'),
  body('audience').optional().isIn(['all', 'class', 'course']),
  body('targetClass').optional({ checkFalsy: true }).isIn(['10', '11', '12']),
  body('targetCourse').optional({ checkFalsy: true }).isMongoId(),
  body('scheduledAt').optional({ checkFalsy: true }).isISO8601(),
];

const updateValidator = [param('id').isMongoId().withMessage('Invalid announcement id')];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid announcement id')];

module.exports = { createValidator, updateValidator, idParamValidator };
