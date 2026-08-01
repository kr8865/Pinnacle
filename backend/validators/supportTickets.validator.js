const { body, param } = require('express-validator');

const createTicketValidator = [
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('category').optional().isIn(['technical', 'fee', 'academic', 'other']),
  body('description').trim().notEmpty().withMessage('Description is required'),
];

const updateTicketValidator = [
  param('id').isMongoId().withMessage('Invalid ticket id'),
  body('status').optional().isIn(['open', 'in-progress', 'resolved', 'closed']),
  body('response').optional({ checkFalsy: true }).trim(),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid ticket id')];

module.exports = { createTicketValidator, updateTicketValidator, idParamValidator };
