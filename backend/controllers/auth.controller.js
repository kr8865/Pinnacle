const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshExpiryDate,
  generateResetToken,
  hashToken,
} = require('../utils/tokens');
const { generateSequentialCode } = require('../utils/idGenerators');
const { uploadFile } = require('../services/upload.service');
const { logActivity } = require('../services/activityLog.service');
const { sendMail } = require('../config/mailer');

const User = require('../models/User.model');
const Student = require('../models/Student.model');
const Course = require('../models/Course.model');
const Document = require('../models/Document.model');

const REFRESH_COOKIE_NAME = 'refreshToken';

const cookieOptions = (remember) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: (remember ? Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 30) : Number(process.env.JWT_REFRESH_EXPIRES_DAYS_SHORT || 1)) * 24 * 60 * 60 * 1000,
});

const issueTokens = async (user, { remember = false } = {}) => {
  const accessToken = signAccessToken({ id: user._id, role: user.role });
  const refreshToken = signRefreshToken({ id: user._id, role: user.role, remember }, remember);

  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push({ token: refreshToken, expiresAt: refreshExpiryDate(remember) });
  // Keep the list from growing unbounded across many logins/devices.
  if (user.refreshTokens.length > 10) user.refreshTokens = user.refreshTokens.slice(-10);
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

const FILE_FIELDS = ['photo', 'signature', 'tenthMarksheet', 'eleventhMarksheet', 'idProof', 'parentPhoto'];

/** POST /auth/register — student self-registration (multipart). */
const register = catchAsync(async (req, res) => {
  const {
    studentName,
    fatherName,
    motherName,
    email,
    password,
    mobile,
    parentMobile,
    address,
    city,
    state,
    pincode,
    gender,
    dob,
    schoolName,
    board,
    currentClass,
    selectedCourse,
    aadharNumber,
    bloodGroup,
    emergencyContact,
    previousSchool,
    tenthPercentage,
    twelfthPercentage,
    medicalInfo,
    termsAccepted,
  } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw ApiError.conflict('An account with this email already exists');

  // Course selection is optional for now — only look it up if one was actually
  // provided, and don't hard-fail registration if it's missing/invalid.
  let course = null;
  if (selectedCourse) {
    course = await Course.findById(selectedCourse).catch(() => null);
  }

  let user;
  let student;
  try {
    user = await User.create({
      name: studentName || email.split('@')[0],
      email,
      password,
      role: 'student',
      phone: mobile,
    });

    const registrationNumber = await generateSequentialCode(Student, 'registrationNumber', 'PTC-REG');

    student = await Student.create({
      user: user._id,
      fatherName,
      motherName,
      mobile,
      parentMobile,
      address,
      city,
      state,
      pincode,
      gender: gender || undefined,
      dob: dob || undefined,
      schoolName,
      board: board || undefined,
      currentClass: currentClass || undefined,
      course: course?._id,
      aadharNumber,
      bloodGroup,
      emergencyContact,
      previousSchool,
      tenthPercentage: tenthPercentage || undefined,
      twelfthPercentage: twelfthPercentage || undefined,
      medicalInfo,
      termsAccepted: termsAccepted === true || termsAccepted === 'true',
      registrationNumber,
      admissionStatus: 'pending',
      searchName: studentName,
    });

    const files = req.files || {};
    const documentIds = [];
    for (const field of FILE_FIELDS) {
      const fileArr = files[field];
      if (fileArr && fileArr[0]) {
        // eslint-disable-next-line no-await-in-loop
        const uploaded = await uploadFile(fileArr[0], `pinnacle/students/${student._id}`);
        // eslint-disable-next-line no-await-in-loop
        const doc = await Document.create({
          student: student._id,
          type: field,
          url: uploaded.url,
          publicId: uploaded.publicId,
        });
        documentIds.push(doc._id);
      }
    }
    if (documentIds.length) {
      student.documents = documentIds;
      await student.save();
    }
  } catch (err) {
    // Best-effort rollback so a failed registration doesn't leave orphan records.
    if (student) await Student.findByIdAndDelete(student._id).catch(() => {});
    if (user) await User.findByIdAndDelete(user._id).catch(() => {});
    throw err;
  }

  await logActivity({ user: user._id, action: 'student:register', req, meta: { registrationNumber: student.registrationNumber } });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Registration submitted successfully. Please wait for admin approval.',
    data: {
      registrationNumber: student.registrationNumber,
      studentMongoId: student._id,
      admissionStatus: student.admissionStatus,
    },
  });
});

const authenticateCredentials = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) throw ApiError.unauthorized('Invalid email or password');
  if (!user.isActive) throw ApiError.forbidden('Account is deactivated');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw ApiError.unauthorized('Invalid email or password');

  return user;
};

/** POST /auth/login */
const login = catchAsync(async (req, res) => {
  const { email, password, remember } = req.body;
  const user = await authenticateCredentials({ email, password });

  let student = null;
  if (user.role === 'student') {
    student = await Student.findOne({ user: user._id }).populate('course', 'name subject classLevel');
    if (!student || student.admissionStatus !== 'approved') {
      throw ApiError.forbidden(
        student && student.admissionStatus === 'pending'
          ? 'Your admission is still pending approval'
          : student && student.admissionStatus === 'rejected'
          ? 'Your admission was rejected'
          : student && student.admissionStatus === 'suspended'
          ? 'Your account has been suspended'
          : 'Student profile not found'
      );
    }
  }

  const { accessToken, refreshToken } = await issueTokens(user, { remember: !!remember });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions(!!remember));

  await logActivity({ user: user._id, action: 'auth:login', req });

  const userData = user.toSafeJSON();
  if (student) userData.studentProfile = student;

  return sendSuccess(res, { data: { accessToken, user: userData } });
});

/** POST /auth/admin-login */
const adminLogin = catchAsync(async (req, res) => {
  const { email, password, remember } = req.body;
  const user = await authenticateCredentials({ email, password });

  if (user.role !== 'admin') throw ApiError.forbidden('This login is restricted to administrators');

  const { accessToken, refreshToken } = await issueTokens(user, { remember: !!remember });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions(!!remember));

  await logActivity({ user: user._id, action: 'auth:admin-login', req });

  return sendSuccess(res, { data: { accessToken, user: user.toSafeJSON() } });
});

/** POST /auth/refresh */
const refresh = catchAsync(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) throw ApiError.unauthorized('Refresh token missing');

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) throw ApiError.unauthorized('User no longer exists');

  const stored = (user.refreshTokens || []).find((rt) => rt.token === token);
  if (!stored) throw ApiError.unauthorized('Refresh token has been revoked');

  const remember = !!decoded.remember;
  const accessToken = signAccessToken({ id: user._id, role: user.role });

  // Rotate the refresh token for security.
  const newRefreshToken = signRefreshToken({ id: user._id, role: user.role, remember }, remember);
  user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== token);
  user.refreshTokens.push({ token: newRefreshToken, expiresAt: refreshExpiryDate(remember) });
  await user.save({ validateBeforeSave: false });

  res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, cookieOptions(remember));

  return sendSuccess(res, { data: { accessToken } });
});

/** POST /auth/logout */
const logout = catchAsync(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (token) {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await User.findById(decoded.id);
      if (user) {
        user.refreshTokens = (user.refreshTokens || []).filter((rt) => rt.token !== token);
        await user.save({ validateBeforeSave: false });
        await logActivity({ user: user._id, action: 'auth:logout', req });
      }
    } catch (err) {
      // Token invalid/expired — nothing to revoke, just clear the cookie below.
    }
  }

  res.clearCookie(REFRESH_COOKIE_NAME, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  return sendSuccess(res, { message: 'Logged out successfully' });
});

/** POST /auth/forgot-password */
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  // Always respond success to avoid leaking which emails are registered.
  if (!user) {
    return sendSuccess(res, { message: 'If that email is registered, a reset link has been sent.' });
  }

  const { rawToken, hashedToken } = generateResetToken();
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${rawToken}`;
  await sendMail({
    to: user.email,
    subject: 'Pinnacle Tuition Classes — Password Reset',
    html: `<p>Hi ${user.name},</p><p>You requested a password reset. Click the link below to set a new password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, you can safely ignore this email.</p>`,
  });

  return sendSuccess(res, { message: 'If that email is registered, a reset link has been sent.' });
});

/** POST /auth/reset-password/:token */
const resetPassword = catchAsync(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+password +passwordResetToken +passwordResetExpires');

  if (!user) throw ApiError.badRequest('Password reset token is invalid or has expired');

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // invalidate existing sessions
  await user.save();

  await logActivity({ user: user._id, action: 'auth:reset-password', req });

  return sendSuccess(res, { message: 'Password has been reset successfully. Please log in again.' });
});

/** POST /auth/change-password (auth required) */
const changePassword = catchAsync(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) throw ApiError.badRequest('Current password is incorrect', [{ field: 'oldPassword', message: 'Incorrect password' }]);

  user.password = newPassword;
  user.refreshTokens = [];
  await user.save();

  await logActivity({ user: user._id, action: 'auth:change-password', req });

  return sendSuccess(res, { message: 'Password changed successfully. Please log in again.' });
});

/** GET /auth/me */
const me = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  const data = user.toSafeJSON();

  if (user.role === 'student') {
    const student = await Student.findOne({ user: user._id }).populate('course', 'name subject classLevel');
    data.studentProfile = student;
  }

  return sendSuccess(res, { data });
});

module.exports = {
  register,
  login,
  adminLogin,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  me,
};
