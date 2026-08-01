const { body, param } = require('express-validator');

const registerValidator = [
  body('studentName').trim().notEmpty().withMessage('Student name is required'),
  body('fatherName').trim().notEmpty().withMessage("Father's name is required"),
  body('motherName').optional({ checkFalsy: true }).trim(),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('mobile').trim().notEmpty().withMessage('Mobile number is required'),
  body('parentMobile').optional({ checkFalsy: true }).trim(),
  body('address').optional({ checkFalsy: true }).trim(),
  body('city').optional({ checkFalsy: true }).trim(),
  body('state').optional({ checkFalsy: true }).trim(),
  body('pincode').optional({ checkFalsy: true }).trim(),
  body('gender').optional({ checkFalsy: true }).isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('dob').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid date of birth'),
  body('schoolName').optional({ checkFalsy: true }).trim(),
  body('board').optional({ checkFalsy: true }).isIn(['CBSE', 'ICSE', 'State', 'Other']).withMessage('Invalid board'),
  body('currentClass').isIn(['10', '11', '12']).withMessage('Invalid class'),
  body('selectedCourse').notEmpty().withMessage('Course selection is required').isMongoId().withMessage('Invalid course id'),
  body('aadharNumber').optional({ checkFalsy: true }).trim(),
  body('bloodGroup').optional({ checkFalsy: true }).trim(),
  body('emergencyContact').optional({ checkFalsy: true }).trim(),
  body('previousSchool').optional({ checkFalsy: true }).trim(),
  body('tenthPercentage').optional({ checkFalsy: true }).isFloat({ min: 0, max: 100 }).withMessage('Invalid 10th percentage'),
  body('twelfthPercentage').optional({ checkFalsy: true }).isFloat({ min: 0, max: 100 }).withMessage('Invalid 12th percentage'),
  body('medicalInfo').optional({ checkFalsy: true }).trim(),
  body('termsAccepted')
    .customSanitizer((v) => {
      const val = Array.isArray(v) ? v[v.length - 1] : v;
      if (typeof val === 'string') return val === 'true' || val === 'on' || val === '1';
      return Boolean(val);
    })
    .equals(true)
    .withMessage('Terms must be accepted'),
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  body('remember').optional().isBoolean().toBoolean(),
];

const refreshValidator = [];

const forgotPasswordValidator = [body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail()];

const resetPasswordValidator = [
  param('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const changePasswordValidator = [
  body('oldPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

module.exports = {
  registerValidator,
  loginValidator,
  refreshValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
};
