const { body, param, query } = require('express-validator');

const TYPES = ['notes', 'video', 'pyq', 'worksheet', 'book', 'formula-sheet'];

const listValidator = [
  query('course').optional().isMongoId(),
  query('chapter').optional().isMongoId(),
  query('type').optional().isIn(TYPES),
];

const createValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional({ checkFalsy: true }).trim(),
  body('course').isMongoId().withMessage('Valid course id is required'),
  body('chapter').optional({ checkFalsy: true }).isMongoId(),
  body('type').isIn(TYPES).withMessage('Invalid material type'),
  body('videoUrl').optional({ checkFalsy: true }).isURL().withMessage('Invalid video URL'),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid study material id')];

module.exports = { listValidator, createValidator, idParamValidator, TYPES };
