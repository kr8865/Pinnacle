const { body, param, query } = require('express-validator');

const createValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('course').isMongoId().withMessage('Valid course id is required'),
  body('chapter').optional({ checkFalsy: true }).isMongoId(),
  body('type').optional().isIn(['mcq', 'subjective']),
  body('durationMinutes').isInt({ min: 1 }).withMessage('Duration must be a positive number of minutes'),
  body('negativeMarking').optional().isFloat({ min: 0 }).toFloat(),
  body('questions').isArray({ min: 1 }).withMessage('questions must be a non-empty array'),
  body('questions.*.text').notEmpty().withMessage('Question text is required'),
  body('questions.*.options').isArray({ min: 2 }).withMessage('Question must have at least 2 options'),
  body('questions.*.correctOption').isInt({ min: 0 }).withMessage('correctOption must be a valid option index'),
  body('questions.*.marks').optional().isFloat({ min: 0 }).toFloat(),
];

const updateValidator = [param('id').isMongoId().withMessage('Invalid test id')];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid test id')];

const listValidator = [query('course').optional().isMongoId()];

const submitValidator = [
  param('id').isMongoId().withMessage('Invalid test id'),
  body('answers').isArray().withMessage('answers must be an array'),
  body('answers.*.questionId').isMongoId().withMessage('Invalid questionId in answers'),
  body('answers.*.selected').optional({ nullable: true }).isInt({ min: 0 }),
];

module.exports = { createValidator, updateValidator, idParamValidator, listValidator, submitValidator };
