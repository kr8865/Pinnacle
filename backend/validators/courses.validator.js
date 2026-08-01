const { body, param } = require('express-validator');

const createCourseValidator = [
  body('name').trim().notEmpty().withMessage('Course name is required'),
  body('classLevel').isIn(['10', '11', '12']).withMessage('Invalid class level'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('description').optional({ checkFalsy: true }).trim(),
  body('teacher').optional({ checkFalsy: true }).isMongoId(),
];

const updateCourseValidator = [
  param('id').isMongoId().withMessage('Invalid course id'),
  body('name').optional({ checkFalsy: true }).trim(),
  body('classLevel').optional({ checkFalsy: true }).isIn(['10', '11', '12']),
  body('subject').optional({ checkFalsy: true }).trim(),
  body('description').optional({ checkFalsy: true }).trim(),
  body('teacher').optional({ checkFalsy: true }).isMongoId(),
  body('isActive').optional().isBoolean().toBoolean(),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid course id')];

const addChapterValidator = [
  param('id').isMongoId().withMessage('Invalid course id'),
  body('title').trim().notEmpty().withMessage('Chapter title is required'),
  body('order').optional().isInt({ min: 0 }).toInt(),
];

module.exports = { createCourseValidator, updateCourseValidator, idParamValidator, addChapterValidator };
