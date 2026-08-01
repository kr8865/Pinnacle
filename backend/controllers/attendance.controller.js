const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendSuccess, buildMeta } = require('../utils/apiResponse');
const { getPagination } = require('../utils/queryHelpers');
const { logActivity } = require('../services/activityLog.service');

const Attendance = require('../models/Attendance.model');
const Student = require('../models/Student.model');

/** POST /attendance/mark (admin) — { course, date, records: [{ student, status }] } */
const markAttendance = catchAsync(async (req, res) => {
  const { course, date, records } = req.body;
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);

  const results = await Promise.all(
    records.map(({ student, status }) =>
      Attendance.findOneAndUpdate(
        { student, course, date: day },
        { $set: { status, markedBy: req.user._id } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );

  await logActivity({ user: req.user._id, action: 'attendance:mark', req, meta: { course, date: day, count: records.length } });

  return sendSuccess(res, { statusCode: 201, message: 'Attendance marked successfully', data: results });
});

/** GET /attendance?student=&course=&month=&year= */
const listAttendance = catchAsync(async (req, res) => {
  const { student, course, month, year } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};

  if (req.user.role === 'student') {
    const studentProfile = await Student.findOne({ user: req.user._id });
    if (!studentProfile) throw ApiError.notFound('Student profile not found');
    filter.student = studentProfile._id;
  } else if (student) {
    filter.student = student;
  }

  if (course) filter.course = course;

  if (month && year) {
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 1);
    filter.date = { $gte: start, $lt: end };
  } else if (year) {
    filter.date = { $gte: new Date(Number(year), 0, 1), $lt: new Date(Number(year) + 1, 0, 1) };
  }

  const [records, total] = await Promise.all([
    Attendance.find(filter)
      .populate('course', 'name subject classLevel')
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    Attendance.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: records, meta: buildMeta(page, limit, total) });
});

/** GET /attendance/summary/:studentId — { present, absent, percentage, monthly:[...] } */
const attendanceSummary = catchAsync(async (req, res) => {
  const { studentId } = req.params;

  if (req.user.role === 'student') {
    const studentProfile = await Student.findOne({ user: req.user._id });
    if (!studentProfile || studentProfile._id.toString() !== studentId) {
      throw ApiError.forbidden('You cannot view this attendance summary');
    }
  }

  const records = await Attendance.find({ student: studentId });
  const present = records.filter((r) => r.status === 'present').length;
  const absent = records.filter((r) => r.status === 'absent').length;
  const leave = records.filter((r) => r.status === 'leave').length;
  const total = records.length;
  const percentage = total ? Number(((present / total) * 100).toFixed(2)) : 0;

  const monthlyMap = new Map();
  records.forEach((r) => {
    const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyMap.has(key)) monthlyMap.set(key, { month: key, present: 0, absent: 0, leave: 0, total: 0 });
    const entry = monthlyMap.get(key);
    entry[r.status] += 1;
    entry.total += 1;
  });

  const monthly = Array.from(monthlyMap.values())
    .map((m) => ({ ...m, percentage: m.total ? Number(((m.present / m.total) * 100).toFixed(2)) : 0 }))
    .sort((a, b) => (a.month > b.month ? 1 : -1));

  return sendSuccess(res, { data: { present, absent, leave, total, percentage, monthly } });
});

module.exports = { markAttendance, listAttendance, attendanceSummary };
