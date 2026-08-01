const { body, param, query } = require('express-validator');

const listStudentsValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
  query('status').optional().isIn(['pending', 'approved', 'rejected', 'suspended']),
  query('course').optional().isMongoId(),
  query('class').optional().isIn(['10', '11', '12']),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid student id')];

const studentIdParamValidator = [param('studentId').notEmpty().withMessage('studentId is required')];

const updateStudentValidator = [
  param('id').isMongoId().withMessage('Invalid student id'),
  body('fatherName').optional({ checkFalsy: true }).trim(),
  body('motherName').optional({ checkFalsy: true }).trim(),
  body('mobile').optional({ checkFalsy: true }).trim(),
  body('parentMobile').optional({ checkFalsy: true }).trim(),
  body('address').optional({ checkFalsy: true }).trim(),
  body('city').optional({ checkFalsy: true }).trim(),
  body('state').optional({ checkFalsy: true }).trim(),
  body('pincode').optional({ checkFalsy: true }).trim(),
  body('gender').optional({ checkFalsy: true }).isIn(['male', 'female', 'other']),
  body('dob').optional({ checkFalsy: true }).isISO8601(),
  body('schoolName').optional({ checkFalsy: true }).trim(),
  body('board').optional({ checkFalsy: true }).isIn(['CBSE', 'ICSE', 'State', 'Other']),
  body('currentClass').optional({ checkFalsy: true }).isIn(['10', '11', '12']),
  body('course').optional({ checkFalsy: true }).isMongoId(),
  body('bloodGroup').optional({ checkFalsy: true }).trim(),
  body('emergencyContact').optional({ checkFalsy: true }).trim(),
  body('previousSchool').optional({ checkFalsy: true }).trim(),
  body('medicalInfo').optional({ checkFalsy: true }).trim(),
];

const rejectStudentValidator = [
  param('id').isMongoId().withMessage('Invalid student id'),
  body('reason').trim().notEmpty().withMessage('Rejection reason is required'),
];

const bulkDeleteValidator = [
  body('ids').isArray({ min: 1 }).withMessage('ids must be a non-empty array'),
  body('ids.*').isMongoId().withMessage('Invalid id in ids array'),
];

module.exports = {
  listStudentsValidator,
  idParamValidator,
  studentIdParamValidator,
  updateStudentValidator,
  rejectStudentValidator,
  bulkDeleteValidator,
};
