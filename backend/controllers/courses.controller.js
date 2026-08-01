const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendSuccess, buildMeta } = require('../utils/apiResponse');
const { getPagination } = require('../utils/queryHelpers');
const { uploadFile } = require('../services/upload.service');
const { destroy } = require('../services/cloudinary.service');
const { logActivity } = require('../services/activityLog.service');

const Course = require('../models/Course.model');

/** GET /courses (public) */
const listCourses = catchAsync(async (req, res) => {
  const { classLevel, subject, search, isActive } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (classLevel) filter.classLevel = classLevel;
  if (subject) filter.subject = new RegExp(subject, 'i');
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  else if (!req.user || req.user.role !== 'admin') filter.isActive = true;
  if (search) filter.$text = { $search: search };

  const [courses, total] = await Promise.all([
    Course.find(filter).sort({ classLevel: 1, subject: 1 }).skip(skip).limit(limit),
    Course.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: courses, meta: buildMeta(page, limit, total) });
});

/** GET /courses/:id */
const getCourse = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.id).populate('chapters.materials');
  if (!course) throw ApiError.notFound('Course not found');
  return sendSuccess(res, { data: course });
});

/** POST /courses (admin) */
const createCourse = catchAsync(async (req, res) => {
  const { name, classLevel, subject, description, teacher } = req.body;

  const course = await Course.create({ name, classLevel, subject, description, teacher: teacher || null });

  if (req.file) {
    const uploaded = await uploadFile(req.file, 'pinnacle/courses');
    course.thumbnail = { url: uploaded.url, publicId: uploaded.publicId };
    await course.save();
  }

  await logActivity({ user: req.user._id, action: 'course:create', req, meta: { courseId: course._id } });

  return sendSuccess(res, { statusCode: 201, message: 'Course created successfully', data: course });
});

/** PATCH /courses/:id (admin) */
const updateCourse = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw ApiError.notFound('Course not found');

  const fields = ['name', 'classLevel', 'subject', 'description', 'teacher', 'isActive'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) course[field] = req.body[field];
  });

  if (req.file) {
    if (course.thumbnail?.publicId) await destroy(course.thumbnail.publicId);
    const uploaded = await uploadFile(req.file, 'pinnacle/courses');
    course.thumbnail = { url: uploaded.url, publicId: uploaded.publicId };
  }

  await course.save();

  await logActivity({ user: req.user._id, action: 'course:update', req, meta: { courseId: course._id } });

  return sendSuccess(res, { message: 'Course updated successfully', data: course });
});

/** DELETE /courses/:id (admin) */
const deleteCourse = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw ApiError.notFound('Course not found');

  if (course.thumbnail?.publicId) await destroy(course.thumbnail.publicId);
  await course.deleteOne();

  await logActivity({ user: req.user._id, action: 'course:delete', req, meta: { courseId: req.params.id } });

  return sendSuccess(res, { message: 'Course deleted successfully' });
});

/** POST /courses/:id/chapters (admin) */
const addChapter = catchAsync(async (req, res) => {
  const { title, order } = req.body;
  const course = await Course.findById(req.params.id);
  if (!course) throw ApiError.notFound('Course not found');

  course.chapters.push({ title, order: order || course.chapters.length });
  await course.save();

  await logActivity({ user: req.user._id, action: 'course:add-chapter', req, meta: { courseId: course._id, title } });

  return sendSuccess(res, { statusCode: 201, message: 'Chapter added successfully', data: course });
});

module.exports = { listCourses, getCourse, createCourse, updateCourse, deleteCourse, addChapter };
