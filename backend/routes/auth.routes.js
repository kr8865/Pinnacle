const express = require('express');
const { upload } = require('../middlewares/upload.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { authLimiter } = require('../middlewares/rateLimiter.middleware');
const validate = require('../middlewares/validate.middleware');
const controller = require('../controllers/auth.controller');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} = require('../validators/auth.validator');

const router = express.Router();

const admissionUpload = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'signature', maxCount: 1 },
  { name: 'tenthMarksheet', maxCount: 1 },
  { name: 'eleventhMarksheet', maxCount: 1 },
  { name: 'idProof', maxCount: 1 },
  { name: 'parentPhoto', maxCount: 1 },
]);

router.post('/register', admissionUpload, registerValidator, validate, controller.register);
router.post('/login', authLimiter, loginValidator, validate, controller.login);
router.post('/admin-login', authLimiter, loginValidator, validate, controller.adminLogin);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validate, controller.forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPasswordValidator, validate, controller.resetPassword);
router.post('/change-password', authenticate, changePasswordValidator, validate, controller.changePassword);
router.get('/me', authenticate, controller.me);

module.exports = router;
