const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendSuccess, buildMeta } = require('../utils/apiResponse');
const { getPagination } = require('../utils/queryHelpers');
const { logActivity } = require('../services/activityLog.service');

const Fee = require('../models/Fee.model');
const Payment = require('../models/Payment.model');
const Student = require('../models/Student.model');

const currentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  // April-March academic year convention.
  return now.getMonth() >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

/** POST /fees/generate (admin) — { student, amount, dueDate, installments, discount, scholarship } */
const generateFee = catchAsync(async (req, res) => {
  const { student, title, amount, dueDate, installments, discount, scholarship } = req.body;

  const studentDoc = await Student.findById(student);
  if (!studentDoc) throw ApiError.badRequest('Student does not exist');

  const numInstallments = Math.max(1, parseInt(installments, 10) || 1);
  const perInstallmentAmount = Number((amount / numInstallments).toFixed(2));
  const academicYear = currentAcademicYear();

  const fees = [];
  for (let i = 0; i < numInstallments; i += 1) {
    const installmentDueDate = new Date(dueDate);
    if (i > 0) installmentDueDate.setMonth(installmentDueDate.getMonth() + i);

    // eslint-disable-next-line no-await-in-loop
    const fee = await Fee.create({
      student,
      title: title || 'Tuition Fee',
      amount: perInstallmentAmount,
      dueDate: installmentDueDate,
      installmentNumber: i + 1,
      discount: i === 0 ? discount || 0 : 0,
      scholarship: i === 0 ? scholarship || 0 : 0,
      academicYear,
    });
    fees.push(fee);
  }

  await logActivity({ user: req.user._id, action: 'fee:generate', req, meta: { student, amount, installments: numInstallments } });

  return sendSuccess(res, { statusCode: 201, message: 'Fee generated successfully', data: fees });
});

/** GET /fees/due (student) */
const dueFees = catchAsync(async (req, res) => {
  const studentDoc = await Student.findOne({ user: req.user._id });
  if (!studentDoc) throw ApiError.notFound('Student profile not found');

  const fees = await Fee.find({ student: studentDoc._id, status: { $in: ['pending', 'overdue', 'partially-paid'] } }).sort({ dueDate: 1 });

  return sendSuccess(res, { data: fees });
});

/** GET /fees?student=&status= (admin) */
const listFees = catchAsync(async (req, res) => {
  const { student, status } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (student) filter.student = student;
  if (status) filter.status = status;

  const [fees, total] = await Promise.all([
    Fee.find(filter)
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(limit),
    Fee.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: fees, meta: buildMeta(page, limit, total) });
});

/** GET /fees/reports/revenue (admin) — monthly revenue analytics */
const revenueReport = catchAsync(async (req, res) => {
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const monthly = await Payment.aggregate([
    { $match: { status: 'success', createdAt: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: { $month: '$createdAt' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const result = Array.from({ length: 12 }, (_, idx) => {
    const found = monthly.find((m) => m._id === idx + 1);
    return { month: idx + 1, total: found ? found.total : 0, count: found ? found.count : 0 };
  });

  const totalRevenue = result.reduce((sum, m) => sum + m.total, 0);
  const pendingAmount = await Fee.aggregate([
    { $match: { status: { $in: ['pending', 'overdue', 'partially-paid'] } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  return sendSuccess(res, {
    data: {
      year,
      monthly: result,
      totalRevenue,
      totalDue: pendingAmount[0]?.total || 0,
    },
  });
});

module.exports = { generateFee, dueFees, listFees, revenueReport };
