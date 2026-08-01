const { body, query } = require('express-validator');

const generateFeeValidator = [
  body('student').isMongoId().withMessage('Valid student id is required'),
  body('title').optional({ checkFalsy: true }).trim(),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('installments').optional().isInt({ min: 1 }).toInt(),
  body('discount').optional().isFloat({ min: 0 }).toFloat(),
  body('scholarship').optional().isFloat({ min: 0 }).toFloat(),
];

const listValidator = [
  query('student').optional().isMongoId(),
  query('status').optional().isIn(['pending', 'paid', 'overdue', 'partially-paid']),
];

module.exports = {
  generateFeeValidator,
  listValidator,
};
