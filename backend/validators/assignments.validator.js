const { body, param, query } = require('express-validator');

const listValidator = [
  query('course').optional().isMongoId(),
  query('class').optional().isIn(['10', '11', '12']),
  query('status').optional().isIn(['draft', 'published', 'closed']),
];

const createValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional({ checkFalsy: true }).trim(),
  body('instructions').optional({ checkFalsy: true }).trim(),
  body('course').isMongoId().withMessage('Valid course id is required'),
  body('chapter').optional({ checkFalsy: true }).isMongoId(),
  body('class').isIn(['10', '11', '12']).withMessage('Invalid class'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('maxMarks').optional({ checkFalsy: true }).isFloat({ min: 0 }).toFloat(),
];

const updateValidator = [param('id').isMongoId().withMessage('Invalid assignment id')];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid assignment id')];

const submissionIdParamValidator = [param('submissionId').isMongoId().withMessage('Invalid submission id')];

const gradeValidator = [
  param('submissionId').isMongoId().withMessage('Invalid submission id'),
  body('marks').isFloat({ min: 0 }).withMessage('Marks must be a positive number'),
  body('feedback').optional({ checkFalsy: true }).trim(),
];

const submitValidator = [
  param('id').isMongoId().withMessage('Invalid assignment id'),
  body('remarks').optional({ checkFalsy: true }).trim(),
];

module.exports = {
  listValidator,
  createValidator,
  updateValidator,
  idParamValidator,
  submissionIdParamValidator,
  gradeValidator,
  submitValidator,
};
