const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendSuccess, buildMeta } = require('../utils/apiResponse');
const { getPagination } = require('../utils/queryHelpers');
const { uploadFiles: uploadMany, uploadFile: uploadOne } = require('../services/upload.service');
const { notifyUser, notifyUsers } = require('../services/notification.service');
const { logActivity } = require('../services/activityLog.service');

const Assignment = require('../models/Assignment.model');
const AssignmentSubmission = require('../models/AssignmentSubmission.model');
const Student = require('../models/Student.model');

/** GET /assignments?course=&class=&status= (role-aware) */
const listAssignments = catchAsync(async (req, res) => {
  const { course, class: classLevel, status } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (course) filter.course = course;
  if (classLevel) filter.classLevel = classLevel;

  let studentProfile = null;
  if (req.user.role === 'student') {
    studentProfile = await Student.findOne({ user: req.user._id });
    if (!studentProfile) throw ApiError.notFound('Student profile not found');
    filter.status = 'published';
    filter.classLevel = studentProfile.currentClass;
    if (studentProfile.course) filter.course = studentProfile.course;
  } else if (status) {
    filter.status = status;
  }

  const [assignments, total] = await Promise.all([
    Assignment.find(filter).populate('course', 'name subject classLevel').sort({ dueDate: 1 }).skip(skip).limit(limit),
    Assignment.countDocuments(filter),
  ]);

  let data = assignments;
  if (studentProfile) {
    const submissions = await AssignmentSubmission.find({
      student: studentProfile._id,
      assignment: { $in: assignments.map((a) => a._id) },
    });
    const byAssignment = new Map(submissions.map((s) => [s.assignment.toString(), s]));
    data = assignments.map((a) => ({
      ...a.toObject(),
      mySubmission: byAssignment.get(a._id.toString()) || null,
    }));
  }

  return sendSuccess(res, { data, meta: buildMeta(page, limit, total) });
});

/** GET /assignments/my-submissions (student) */
const mySubmissions = catchAsync(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) throw ApiError.notFound('Student profile not found');

  const { page, limit, skip } = getPagination(req.query);
  const filter = { student: student._id };

  const [submissions, total] = await Promise.all([
    AssignmentSubmission.find(filter)
      .populate({ path: 'assignment', populate: { path: 'course', select: 'name subject classLevel' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AssignmentSubmission.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: submissions, meta: buildMeta(page, limit, total) });
});

/** GET /assignments/:id */
const getAssignment = catchAsync(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id).populate('course', 'name subject classLevel');
  if (!assignment) throw ApiError.notFound('Assignment not found');
  return sendSuccess(res, { data: assignment });
});

/** POST /assignments (admin) */
const createAssignment = catchAsync(async (req, res) => {
  const { title, description, instructions, course, chapter, class: classLevel, dueDate, maxMarks } = req.body;

  const attachments = [];
  const files = req.files || {};
  if (files.files?.length) {
    const uploaded = await uploadMany(files.files, 'pinnacle/assignments/attachments');
    uploaded.forEach((f) => attachments.push({ url: f.url, publicId: f.publicId, type: f.mimetype }));
  }

  let solutionPdf;
  if (files.solutionPdf?.[0]) {
    const uploaded = await uploadOne(files.solutionPdf[0], 'pinnacle/assignments/solutions');
    solutionPdf = { url: uploaded.url, publicId: uploaded.publicId };
  }

  const assignment = await Assignment.create({
    title,
    description,
    instructions,
    course,
    chapter: chapter || undefined,
    classLevel,
    dueDate,
    maxMarks: maxMarks || 100,
    attachments,
    solutionPdf,
    createdBy: req.user._id,
  });

  await logActivity({ user: req.user._id, action: 'assignment:create', req, meta: { assignmentId: assignment._id } });

  return sendSuccess(res, { statusCode: 201, message: 'Assignment created successfully', data: assignment });
});

/** PATCH /assignments/:id (admin) */
const updateAssignment = catchAsync(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw ApiError.notFound('Assignment not found');

  const fields = ['title', 'description', 'instructions', 'course', 'chapter', 'classLevel', 'dueDate', 'maxMarks'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) assignment[field] = req.body[field];
  });
  if (req.body.class !== undefined) assignment.classLevel = req.body.class;

  const files = req.files || {};
  if (files.files?.length) {
    const uploaded = await uploadMany(files.files, 'pinnacle/assignments/attachments');
    uploaded.forEach((f) => assignment.attachments.push({ url: f.url, publicId: f.publicId, type: f.mimetype }));
  }
  if (files.solutionPdf?.[0]) {
    const uploaded = await uploadOne(files.solutionPdf[0], 'pinnacle/assignments/solutions');
    assignment.solutionPdf = { url: uploaded.url, publicId: uploaded.publicId };
  }

  await assignment.save();

  await logActivity({ user: req.user._id, action: 'assignment:update', req, meta: { assignmentId: assignment._id } });

  return sendSuccess(res, { message: 'Assignment updated successfully', data: assignment });
});

/** PATCH /assignments/:id/publish (admin) */
const publishAssignment = catchAsync(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw ApiError.notFound('Assignment not found');

  assignment.status = 'published';
  await assignment.save();

  const students = await Student.find({
    currentClass: assignment.classLevel,
    course: assignment.course,
    admissionStatus: 'approved',
  }).select('user');
  await notifyUsers(students.map((s) => s.user), {
    type: 'assignment',
    title: 'New Assignment Published',
    body: assignment.title,
    link: `/assignments/${assignment._id}`,
  });

  await logActivity({ user: req.user._id, action: 'assignment:publish', req, meta: { assignmentId: assignment._id } });

  return sendSuccess(res, { message: 'Assignment published successfully', data: assignment });
});

/** PATCH /assignments/:id/close (admin) */
const closeAssignment = catchAsync(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw ApiError.notFound('Assignment not found');

  assignment.status = 'closed';
  await assignment.save();

  await logActivity({ user: req.user._id, action: 'assignment:close', req, meta: { assignmentId: assignment._id } });

  return sendSuccess(res, { message: 'Assignment closed successfully', data: assignment });
});

/** DELETE /assignments/:id (admin) */
const deleteAssignment = catchAsync(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw ApiError.notFound('Assignment not found');

  await AssignmentSubmission.deleteMany({ assignment: assignment._id });
  await assignment.deleteOne();

  await logActivity({ user: req.user._id, action: 'assignment:delete', req, meta: { assignmentId: req.params.id } });

  return sendSuccess(res, { message: 'Assignment deleted successfully' });
});

/** POST /assignments/:id/submit (student, multipart: files, remarks) */
const submitAssignment = catchAsync(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw ApiError.notFound('Assignment not found');
  if (assignment.status !== 'published') throw ApiError.badRequest('This assignment is not open for submissions');

  const student = await Student.findOne({ user: req.user._id });
  if (!student) throw ApiError.notFound('Student profile not found');

  const files = req.files?.files || (req.file ? [req.file] : []);
  const uploaded = files.length ? await uploadMany(files, `pinnacle/assignments/${assignment._id}/submissions`) : [];
  const fileDocs = uploaded.map((f) => ({ url: f.url, publicId: f.publicId, type: f.mimetype }));

  const now = new Date();
  const status = now > new Date(assignment.dueDate) ? 'late' : 'submitted';

  let submission = await AssignmentSubmission.findOne({ assignment: assignment._id, student: student._id });
  if (submission) {
    submission.files = fileDocs.length ? fileDocs : submission.files;
    submission.remarks = req.body.remarks;
    submission.submittedAt = now;
    submission.status = status;
    submission.attemptNumber += 1;
    submission.marks = undefined;
    submission.feedback = undefined;
    submission.gradedBy = undefined;
    submission.gradedAt = undefined;
    await submission.save();
  } else {
    submission = await AssignmentSubmission.create({
      assignment: assignment._id,
      student: student._id,
      files: fileDocs,
      remarks: req.body.remarks,
      submittedAt: now,
      status,
    });
  }

  await logActivity({ user: req.user._id, action: 'assignment:submit', req, meta: { assignmentId: assignment._id, status } });

  return sendSuccess(res, { statusCode: 201, message: 'Assignment submitted successfully', data: submission });
});

/** GET /assignments/:id/submissions (admin) */
const listSubmissions = catchAsync(async (req, res) => {
  const { status } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = { assignment: req.params.id };
  if (status) filter.status = status;

  const [submissions, total] = await Promise.all([
    AssignmentSubmission.find(filter)
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AssignmentSubmission.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: submissions, meta: buildMeta(page, limit, total) });
});

/** PATCH /assignments/submissions/:submissionId/grade (admin) */
const gradeSubmission = catchAsync(async (req, res) => {
  const { marks, feedback } = req.body;
  const submission = await AssignmentSubmission.findById(req.params.submissionId).populate('student');
  if (!submission) throw ApiError.notFound('Submission not found');

  submission.marks = marks;
  submission.feedback = feedback;
  submission.status = 'checked';
  submission.gradedBy = req.user._id;
  submission.gradedAt = new Date();
  await submission.save();

  if (submission.student?.user) {
    await notifyUser({
      user: submission.student.user,
      type: 'assignment',
      title: 'Assignment Graded',
      body: `You scored ${marks} marks`,
      link: `/assignments/${submission.assignment}`,
    });
  }

  await logActivity({ user: req.user._id, action: 'assignment:grade', req, meta: { submissionId: submission._id, marks } });

  return sendSuccess(res, { message: 'Submission graded successfully', data: submission });
});

module.exports = {
  listAssignments,
  mySubmissions,
  getAssignment,
  createAssignment,
  updateAssignment,
  publishAssignment,
  closeAssignment,
  deleteAssignment,
  submitAssignment,
  listSubmissions,
  gradeSubmission,
};
