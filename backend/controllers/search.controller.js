const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');

const Student = require('../models/Student.model');
const Assignment = require('../models/Assignment.model');
const Course = require('../models/Course.model');
const Payment = require('../models/Payment.model');
const Attendance = require('../models/Attendance.model');
const StudyMaterial = require('../models/StudyMaterial.model');

const LIMIT = 10;

/** GET /search?q= — global search, role-scoped. */
const globalSearch = catchAsync(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return sendSuccess(res, { data: {} });

  const regex = new RegExp(q, 'i');

  if (req.user.role === 'admin') {
    const [students, assignments, courses, payments, attendance] = await Promise.all([
      Student.find({ $text: { $search: q } })
        .limit(LIMIT)
        .populate('user', 'name email')
        .catch(() => Student.find({ searchName: regex }).limit(LIMIT).populate('user', 'name email')),
      Assignment.find({ title: regex }).limit(LIMIT).populate('course', 'name'),
      Course.find({ $or: [{ name: regex }, { subject: regex }] }).limit(LIMIT),
      Payment.find({ razorpayOrderId: regex }).limit(LIMIT).populate({ path: 'student', populate: { path: 'user', select: 'name' } }),
      Attendance.find()
        .populate({ path: 'student', populate: { path: 'user', select: 'name' } })
        .limit(LIMIT * 5)
        .then((records) => records.filter((r) => r.student?.user?.name && regex.test(r.student.user.name)).slice(0, LIMIT)),
    ]);

    return sendSuccess(res, { data: { students, assignments, courses, payments, attendance } });
  }

  // Students are scoped to their own accessible data.
  const studentProfile = await Student.findOne({ user: req.user._id });
  const [courses, materials, assignments] = await Promise.all([
    Course.find({ $or: [{ name: regex }, { subject: regex }], isActive: true }).limit(LIMIT),
    StudyMaterial.find({ title: regex, ...(studentProfile?.course ? { course: studentProfile.course } : {}) }).limit(LIMIT),
    Assignment.find({
      title: regex,
      status: 'published',
      ...(studentProfile ? { classLevel: studentProfile.currentClass } : {}),
    }).limit(LIMIT),
  ]);

  return sendSuccess(res, { data: { courses, materials, assignments } });
});

module.exports = { globalSearch };
