const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendSuccess, buildMeta } = require('../utils/apiResponse');
const { getPagination } = require('../utils/queryHelpers');
const { uploadFile } = require('../services/upload.service');
const { destroy } = require('../services/cloudinary.service');
const { logActivity } = require('../services/activityLog.service');

const StudyMaterial = require('../models/StudyMaterial.model');
const Student = require('../models/Student.model');
const Course = require('../models/Course.model');

/** GET /study-materials?course=&chapter=&type=&search= */
const listMaterials = catchAsync(async (req, res) => {
  const { course, chapter, type, search } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (course) filter.course = course;
  if (chapter) filter.chapter = chapter;
  if (type) filter.type = type;
  if (search) filter.$text = { $search: search };

  const [materials, total] = await Promise.all([
    StudyMaterial.find(filter).populate('course', 'name subject classLevel').sort({ createdAt: -1 }).skip(skip).limit(limit),
    StudyMaterial.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: materials, meta: buildMeta(page, limit, total) });
});

/** GET /study-materials/bookmarked (student) */
const listBookmarked = catchAsync(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id }).populate({
    path: 'bookmarks',
    populate: { path: 'course', select: 'name subject classLevel' },
  });
  if (!student) throw ApiError.notFound('Student profile not found');

  return sendSuccess(res, { data: student.bookmarks });
});

/** GET /study-materials/:id */
const getMaterial = catchAsync(async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id).populate('course', 'name subject classLevel');
  if (!material) throw ApiError.notFound('Study material not found');
  return sendSuccess(res, { data: material });
});

/** POST /study-materials (admin, multipart upload to Cloudinary) */
const createMaterial = catchAsync(async (req, res) => {
  const { title, description, course, chapter, type, videoUrl } = req.body;

  const courseDoc = await Course.findById(course);
  if (!courseDoc) throw ApiError.badRequest('Course does not exist');

  let fileUrl;
  let publicId;
  if (req.file) {
    const uploaded = await uploadFile(req.file, 'pinnacle/study-materials');
    fileUrl = uploaded.url;
    publicId = uploaded.publicId;
  }

  const material = await StudyMaterial.create({
    title,
    description,
    course,
    chapter: chapter || undefined,
    type,
    fileUrl,
    publicId,
    videoUrl,
    uploadedBy: req.user._id,
  });

  if (chapter) {
    await Course.findOneAndUpdate(
      { _id: course, 'chapters._id': chapter },
      { $addToSet: { 'chapters.$.materials': material._id } }
    );
  }

  await logActivity({ user: req.user._id, action: 'studyMaterial:create', req, meta: { materialId: material._id } });

  return sendSuccess(res, { statusCode: 201, message: 'Study material uploaded successfully', data: material });
});

/** DELETE /study-materials/:id (admin) */
const deleteMaterial = catchAsync(async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id);
  if (!material) throw ApiError.notFound('Study material not found');

  if (material.publicId) await destroy(material.publicId);
  await material.deleteOne();

  await Student.updateMany({ bookmarks: material._id }, { $pull: { bookmarks: material._id } });
  if (material.chapter) {
    await Course.findOneAndUpdate(
      { _id: material.course, 'chapters._id': material.chapter },
      { $pull: { 'chapters.$.materials': material._id } }
    );
  }

  await logActivity({ user: req.user._id, action: 'studyMaterial:delete', req, meta: { materialId: req.params.id } });

  return sendSuccess(res, { message: 'Study material deleted successfully' });
});

/** POST /study-materials/:id/bookmark (student, toggles in Student.bookmarks) */
const toggleBookmark = catchAsync(async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id);
  if (!material) throw ApiError.notFound('Study material not found');

  const student = await Student.findOne({ user: req.user._id });
  if (!student) throw ApiError.notFound('Student profile not found');

  const alreadyBookmarked = student.bookmarks.some((b) => b.toString() === material._id.toString());
  if (alreadyBookmarked) {
    student.bookmarks = student.bookmarks.filter((b) => b.toString() !== material._id.toString());
  } else {
    student.bookmarks.push(material._id);
  }
  await student.save();

  return sendSuccess(res, {
    message: alreadyBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks',
    data: { bookmarked: !alreadyBookmarked },
  });
});

module.exports = { listMaterials, listBookmarked, getMaterial, createMaterial, deleteMaterial, toggleBookmark };
