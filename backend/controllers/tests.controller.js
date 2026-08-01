const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendSuccess, buildMeta } = require('../utils/apiResponse');
const { getPagination } = require('../utils/queryHelpers');
const { notifyUsers } = require('../services/notification.service');
const { logActivity } = require('../services/activityLog.service');

const Test = require('../models/Test.model');
const Result = require('../models/Result.model');
const Student = require('../models/Student.model');

const stripAnswers = (test) => {
  const obj = test.toObject ? test.toObject() : test;
  return {
    ...obj,
    questions: (obj.questions || []).map((q) => ({ _id: q._id, text: q.text, options: q.options, marks: q.marks })),
  };
};

/** POST /tests (admin) */
const createTest = catchAsync(async (req, res) => {
  const { title, course, chapter, type, durationMinutes, negativeMarking, questions } = req.body;

  const test = await Test.create({
    title,
    course,
    chapter: chapter || undefined,
    type: type || 'mcq',
    durationMinutes,
    negativeMarking: negativeMarking || 0,
    questions,
    createdBy: req.user._id,
  });

  await logActivity({ user: req.user._id, action: 'test:create', req, meta: { testId: test._id } });

  return sendSuccess(res, { statusCode: 201, message: 'Test created successfully', data: test });
});

/** GET /tests?course= (student sees published+active only) */
const listTests = catchAsync(async (req, res) => {
  const { course, status } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (course) filter.course = course;

  if (req.user.role === 'student') {
    filter.status = 'published';
  } else if (status) {
    filter.status = status;
  }

  const [tests, total] = await Promise.all([
    Test.find(filter).populate('course', 'name subject classLevel').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Test.countDocuments(filter),
  ]);

  const data = req.user.role === 'student' ? tests.map(stripAnswers) : tests;

  return sendSuccess(res, { data, meta: buildMeta(page, limit, total) });
});

/** GET /tests/:id */
const getTest = catchAsync(async (req, res) => {
  const test = await Test.findById(req.params.id).populate('course', 'name subject classLevel');
  if (!test) throw ApiError.notFound('Test not found');

  const data = req.user.role === 'student' ? stripAnswers(test) : test;
  return sendSuccess(res, { data });
});

/** PATCH /tests/:id (admin) */
const updateTest = catchAsync(async (req, res) => {
  const test = await Test.findById(req.params.id);
  if (!test) throw ApiError.notFound('Test not found');

  const fields = ['title', 'course', 'chapter', 'type', 'durationMinutes', 'negativeMarking', 'questions', 'status'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) test[field] = req.body[field];
  });
  await test.save();

  await logActivity({ user: req.user._id, action: 'test:update', req, meta: { testId: test._id } });

  return sendSuccess(res, { message: 'Test updated successfully', data: test });
});

/** DELETE /tests/:id (admin) */
const deleteTest = catchAsync(async (req, res) => {
  const test = await Test.findById(req.params.id);
  if (!test) throw ApiError.notFound('Test not found');

  await Result.deleteMany({ test: test._id });
  await test.deleteOne();

  await logActivity({ user: req.user._id, action: 'test:delete', req, meta: { testId: req.params.id } });

  return sendSuccess(res, { message: 'Test deleted successfully' });
});

/** PATCH /tests/:id/publish (admin) — convenience action, not explicitly in contract but mirrors assignments. */
const publishTest = catchAsync(async (req, res) => {
  const test = await Test.findById(req.params.id);
  if (!test) throw ApiError.notFound('Test not found');

  test.status = 'published';
  await test.save();

  const students = await Student.find({ course: test.course, admissionStatus: 'approved' }).select('user');
  await notifyUsers(students.map((s) => s.user), {
    type: 'exam',
    title: 'New Test Published',
    body: test.title,
    link: `/tests/${test._id}`,
  });

  return sendSuccess(res, { message: 'Test published successfully', data: test });
});

/** POST /tests/:id/start (student) */
const startTest = catchAsync(async (req, res) => {
  const test = await Test.findById(req.params.id);
  if (!test) throw ApiError.notFound('Test not found');
  if (test.status !== 'published') throw ApiError.badRequest('This test is not currently available');

  const student = await Student.findOne({ user: req.user._id });
  if (!student) throw ApiError.notFound('Student profile not found');

  let result = await Result.findOne({ test: test._id, student: student._id });
  if (result && result.status !== 'in-progress') {
    throw ApiError.conflict('You have already attempted this test');
  }

  if (!result) {
    result = await Result.create({
      test: test._id,
      student: student._id,
      startedAt: new Date(),
      status: 'in-progress',
      totalMarks: test.totalMarks,
    });
  }

  return sendSuccess(res, {
    statusCode: 201,
    data: {
      resultId: result._id,
      startedAt: result.startedAt,
      durationMinutes: test.durationMinutes,
      totalMarks: test.totalMarks,
      questions: test.questions.map((q) => ({ _id: q._id, text: q.text, options: q.options, marks: q.marks })),
    },
  });
});

const recomputeRanks = async (testId) => {
  const results = await Result.find({ test: testId, status: { $in: ['submitted', 'auto-submitted'] } }).sort({ score: -1 });
  await Promise.all(results.map((r, idx) => Result.updateOne({ _id: r._id }, { $set: { rank: idx + 1 } })));
};

/** POST /tests/:id/submit (student) — { answers:[{questionId, selected}] } */
const submitTest = catchAsync(async (req, res) => {
  const { answers, autoSubmit } = req.body;
  const test = await Test.findById(req.params.id);
  if (!test) throw ApiError.notFound('Test not found');

  const student = await Student.findOne({ user: req.user._id });
  if (!student) throw ApiError.notFound('Student profile not found');

  const result = await Result.findOne({ test: test._id, student: student._id });
  if (!result) throw ApiError.badRequest('You have not started this test');
  if (result.status !== 'in-progress') throw ApiError.conflict('This test has already been submitted');

  const answerMap = new Map((answers || []).map((a) => [String(a.questionId), a.selected]));

  let score = 0;
  let correctCount = 0;
  let answeredCount = 0;
  const gradedAnswers = test.questions.map((q) => {
    const selected = answerMap.has(String(q._id)) ? answerMap.get(String(q._id)) : undefined;
    let correct = false;
    let marksAwarded = 0;

    if (selected !== undefined && selected !== null) {
      answeredCount += 1;
      if (Number(selected) === q.correctOption) {
        correct = true;
        marksAwarded = q.marks;
        correctCount += 1;
      } else {
        const negative = q.negativeMarks || test.negativeMarking * q.marks;
        marksAwarded = -Math.abs(negative);
      }
    }

    score += marksAwarded;
    return { question: q._id, selected: selected ?? undefined, correct, marksAwarded };
  });

  score = Math.max(0, Number(score.toFixed(2)));
  const totalMarks = test.totalMarks || 1;
  const percentage = Number(((score / totalMarks) * 100).toFixed(2));

  result.answers = gradedAnswers;
  result.score = score;
  result.totalMarks = test.totalMarks;
  result.percentage = percentage;
  result.submittedAt = new Date();
  result.status = autoSubmit ? 'auto-submitted' : 'submitted';
  result.chapterWisePerformance = [
    { chapter: test.chapter, correct: correctCount, total: test.questions.length },
  ];
  await result.save();

  await recomputeRanks(test._id);
  const updated = await Result.findById(result._id);

  await logActivity({ user: req.user._id, action: 'test:submit', req, meta: { testId: test._id, score, percentage } });

  return sendSuccess(res, { message: 'Test submitted successfully', data: updated });
});

/** GET /tests/:id/leaderboard */
const leaderboard = catchAsync(async (req, res) => {
  const results = await Result.find({ test: req.params.id, status: { $in: ['submitted', 'auto-submitted'] } })
    .populate({ path: 'student', populate: { path: 'user', select: 'name' } })
    .sort({ score: -1 })
    .limit(100);

  const data = results.map((r) => ({
    rank: r.rank,
    student: r.student?.user?.name || 'Unknown',
    studentId: r.student?.studentId,
    score: r.score,
    totalMarks: r.totalMarks,
    percentage: r.percentage,
    submittedAt: r.submittedAt,
  }));

  return sendSuccess(res, { data });
});

module.exports = {
  createTest,
  listTests,
  getTest,
  updateTest,
  deleteTest,
  publishTest,
  startTest,
  submitTest,
  leaderboard,
};
