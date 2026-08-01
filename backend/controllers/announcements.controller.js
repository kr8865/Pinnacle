const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendSuccess, buildMeta } = require('../utils/apiResponse');
const { getPagination } = require('../utils/queryHelpers');
const { notifyUsers, emitToRoom } = require('../services/notification.service');
const { logActivity } = require('../services/activityLog.service');

const Announcement = require('../models/Announcement.model');
const Student = require('../models/Student.model');

const publishAnnouncement = async (announcement) => {
  announcement.status = 'published';
  announcement.publishedAt = new Date();
  await announcement.save();

  let targetStudents = [];
  if (announcement.audience === 'all') {
    targetStudents = await Student.find({ admissionStatus: 'approved' }).select('user');
    emitToRoom('role:student', 'announcement:new', announcement);
  } else if (announcement.audience === 'class') {
    targetStudents = await Student.find({ admissionStatus: 'approved', currentClass: announcement.targetClass }).select('user');
    emitToRoom('role:student', 'announcement:new', announcement);
  } else if (announcement.audience === 'course') {
    targetStudents = await Student.find({ admissionStatus: 'approved', course: announcement.targetCourse }).select('user');
    emitToRoom(`course:${announcement.targetCourse}`, 'announcement:new', announcement);
  }

  if (targetStudents.length) {
    await notifyUsers(targetStudents.map((s) => s.user), {
      type: 'announcement',
      title: announcement.title,
      body: announcement.body,
      link: '/announcements',
    });
  }

  return announcement;
};

/** GET /announcements (role-aware) */
const listAnnouncements = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.user.role === 'admin') {
    if (req.query.status) filter.status = req.query.status;
  } else {
    filter.status = 'published';
    const student = await Student.findOne({ user: req.user._id });
    const orConditions = [{ audience: 'all' }];
    if (student) {
      orConditions.push({ audience: 'class', targetClass: student.currentClass });
      if (student.course) orConditions.push({ audience: 'course', targetCourse: student.course });
    }
    filter.$or = orConditions;
  }

  const [announcements, total] = await Promise.all([
    Announcement.find(filter).populate('targetCourse', 'name subject').sort({ publishedAt: -1, createdAt: -1 }).skip(skip).limit(limit),
    Announcement.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: announcements, meta: buildMeta(page, limit, total) });
});

/** POST /announcements (admin) */
const createAnnouncement = catchAsync(async (req, res) => {
  const { title, body, audience, targetClass, targetCourse, scheduledAt } = req.body;

  let announcement = await Announcement.create({
    title,
    body,
    audience: audience || 'all',
    targetClass: audience === 'class' ? targetClass : undefined,
    targetCourse: audience === 'course' ? targetCourse : undefined,
    scheduledAt: scheduledAt || undefined,
    status: 'draft',
    createdBy: req.user._id,
  });

  if (!scheduledAt || new Date(scheduledAt) <= new Date()) {
    announcement = await publishAnnouncement(announcement);
  } else {
    announcement.status = 'scheduled';
    await announcement.save();
  }

  await logActivity({ user: req.user._id, action: 'announcement:create', req, meta: { announcementId: announcement._id } });

  return sendSuccess(res, { statusCode: 201, message: 'Announcement created successfully', data: announcement });
});

/** PATCH /announcements/:id (admin) */
const updateAnnouncement = catchAsync(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) throw ApiError.notFound('Announcement not found');

  const wasPublished = announcement.status === 'published';
  const fields = ['title', 'body', 'audience', 'targetClass', 'targetCourse', 'scheduledAt'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) announcement[field] = req.body[field];
  });

  if (req.body.status === 'published' && !wasPublished) {
    await publishAnnouncement(announcement);
  } else {
    await announcement.save();
  }

  await logActivity({ user: req.user._id, action: 'announcement:update', req, meta: { announcementId: announcement._id } });

  return sendSuccess(res, { message: 'Announcement updated successfully', data: announcement });
});

/** DELETE /announcements/:id (admin) */
const deleteAnnouncement = catchAsync(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) throw ApiError.notFound('Announcement not found');

  await announcement.deleteOne();

  await logActivity({ user: req.user._id, action: 'announcement:delete', req, meta: { announcementId: req.params.id } });

  return sendSuccess(res, { message: 'Announcement deleted successfully' });
});

module.exports = { listAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement };
