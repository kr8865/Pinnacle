const { body, param, query } = require('express-validator');

const markValidator = [
  body('course').isMongoId().withMessage('Valid course id is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('records').isArray({ min: 1 }).withMessage('records must be a non-empty array'),
  body('records.*.student').isMongoId().withMessage('Invalid student id in records'),
  body('records.*.status').isIn(['present', 'absent', 'leave']).withMessage('Invalid attendance status'),
];

const listValidator = [
  query('student').optional().isMongoId(),
  query('course').optional().isMongoId(),
  query('month').optional().isInt({ min: 1, max: 12 }).toInt(),
  query('year').optional().isInt({ min: 2000, max: 2100 }).toInt(),
];

const summaryValidator = [param('studentId').isMongoId().withMessage('Invalid student id')];

module.exports = { markValidator, listValidator, summaryValidator };
