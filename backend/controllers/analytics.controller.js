const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');

const Student = require('../models/Student.model');
const Course = require('../models/Course.model');
const Assignment = require('../models/Assignment.model');
const AssignmentSubmission = require('../models/AssignmentSubmission.model');
const Attendance = require('../models/Attendance.model');
const Payment = require('../models/Payment.model');
const Fee = require('../models/Fee.model');
const User = require('../models/User.model');

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};
const endOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/** GET /analytics/dashboard (admin) */
const dashboard = catchAsync(async (req, res) => {
  const today = new Date();

  const [
    totalStudents,
    activeStudents,
    coursesCount,
    todayAttendanceRecords,
    assignmentsPublished,
    assignmentsSubmittedCount,
    revenueAgg,
    feeDueAgg,
    recentAdmissions,
    recentPayments,
    recentAssignments,
  ] = await Promise.all([
    Student.countDocuments({ admissionStatus: 'approved' }),
    Student.countDocuments({ admissionStatus: 'approved' }).then(async (count) => {
      const users = await User.countDocuments({ role: 'student', isActive: true });
      return Math.min(count, users);
    }),
    Course.countDocuments({ isActive: true }),
    Attendance.find({ date: { $gte: startOfDay(today), $lte: endOfDay(today) } }),
    Assignment.countDocuments({ status: 'published' }),
    AssignmentSubmission.countDocuments({ status: { $in: ['submitted', 'late', 'checked'] } }),
    Payment.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Fee.aggregate([
      { $match: { status: { $in: ['pending', 'overdue', 'partially-paid'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Student.find({ admissionStatus: 'approved' }).sort({ approvedAt: -1 }).limit(5).populate('user', 'name email').populate('course', 'name'),
    Payment.find({ status: 'success' }).sort({ createdAt: -1 }).limit(5).populate({ path: 'student', populate: { path: 'user', select: 'name' } }),
    Assignment.find().sort({ createdAt: -1 }).limit(5).populate('course', 'name'),
  ]);

  const presentToday = todayAttendanceRecords.filter((a) => a.status === 'present').length;
  const totalMarkedToday = todayAttendanceRecords.length;

  return sendSuccess(res, {
    data: {
      totals: {
        students: totalStudents,
        activeStudents,
        courses: coursesCount,
      },
      todayAttendance: {
        present: presentToday,
        total: totalMarkedToday,
        percentage: totalMarkedToday ? Number(((presentToday / totalMarkedToday) * 100).toFixed(2)) : 0,
      },
      assignments: {
        published: assignmentsPublished,
        submitted: assignmentsSubmittedCount,
      },
      revenue: revenueAgg[0]?.total || 0,
      feeDue: feeDueAgg[0]?.total || 0,
      recentAdmissions,
      recentPayments,
      recentAssignments,
    },
  });
});

const parseRange = (range) => {
  const days = { '7d': 7, '30d': 30, '90d': 90, '6m': 182, '1y': 365 }[range] || 30;
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { start, end };
};

/** GET /analytics/graphs?type=revenue|attendance|admissions|growth&range= (admin) */
const graphs = catchAsync(async (req, res) => {
  const { type, range } = req.query;
  const { start, end } = parseRange(range);

  if (type === 'revenue') {
    const data = await Payment.aggregate([
      { $match: { status: 'success', createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' }, d: { $dayOfMonth: '$createdAt' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } },
    ]);
    return sendSuccess(res, { data: data.map((d) => ({ date: `${d._id.y}-${String(d._id.m).padStart(2, '0')}-${String(d._id.d).padStart(2, '0')}`, total: d.total })) });
  }

  if (type === 'attendance') {
    const data = await Attendance.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, status: '$status' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);
    return sendSuccess(res, { data });
  }

  if (type === 'admissions') {
    const data = await Student.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return sendSuccess(res, { data: data.map((d) => ({ date: d._id, count: d.count })) });
  }

  if (type === 'growth') {
    const data = await Student.aggregate([
      { $match: { admissionStatus: 'approved' } },
      {
        $group: {
          _id: { y: { $year: '$approvedAt' }, m: { $month: '$approvedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]);
    let cumulative = 0;
    const series = data.map((d) => {
      cumulative += d.count;
      return { date: `${d._id.y}-${String(d._id.m).padStart(2, '0')}`, count: d.count, cumulative };
    });
    return sendSuccess(res, { data: series });
  }

  throw ApiError.badRequest('Invalid graph type. Use revenue, attendance, admissions, or growth.');
});

module.exports = { dashboard, graphs };
