const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');

const Result = require('../models/Result.model');
const Student = require('../models/Student.model');

const buildPerformanceSummary = (results) => {
  const chapterMap = new Map();
  results.forEach((r) => {
    (r.chapterWisePerformance || []).forEach((cp) => {
      const key = cp.chapter ? cp.chapter.toString() : 'general';
      if (!chapterMap.has(key)) chapterMap.set(key, { chapter: cp.chapter, correct: 0, total: 0 });
      const entry = chapterMap.get(key);
      entry.correct += cp.correct;
      entry.total += cp.total;
    });
  });

  const chapterWisePerformance = Array.from(chapterMap.values()).map((c) => ({
    ...c,
    percentage: c.total ? Number(((c.correct / c.total) * 100).toFixed(2)) : 0,
  }));

  const weakChapters = chapterWisePerformance.filter((c) => c.percentage < 50);
  const strongChapters = chapterWisePerformance.filter((c) => c.percentage >= 75);

  const submitted = results.filter((r) => r.status !== 'in-progress');
  const averagePercentage = submitted.length
    ? Number((submitted.reduce((sum, r) => sum + (r.percentage || 0), 0) / submitted.length).toFixed(2))
    : 0;

  return {
    testsAttempted: submitted.length,
    averagePercentage,
    chapterWisePerformance,
    weakChapters,
    strongChapters,
  };
};

/** GET /results/my (student) */
const myResults = catchAsync(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) throw ApiError.notFound('Student profile not found');

  const results = await Result.find({ student: student._id })
    .populate('test', 'title course chapter totalMarks type')
    .sort({ createdAt: -1 });

  return sendSuccess(res, { data: { results, performance: buildPerformanceSummary(results) } });
});

/** GET /results/:studentId (admin) */
const getResultsForStudent = catchAsync(async (req, res) => {
  const results = await Result.find({ student: req.params.studentId })
    .populate('test', 'title course chapter totalMarks type')
    .sort({ createdAt: -1 });

  return sendSuccess(res, { data: { results, performance: buildPerformanceSummary(results) } });
});

module.exports = { myResults, getResultsForStudent };
