const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { parse } = require('csv-parse/sync');

const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendSuccess, buildMeta } = require('../utils/apiResponse');
const { getPagination } = require('../utils/queryHelpers');
const { generateStudentCodes, generateSequentialCode } = require('../utils/idGenerators');
const { generateQRDataURL } = require('../services/qrcode.service');
const { notifyUser } = require('../services/notification.service');
const { logActivity } = require('../services/activityLog.service');
const { sendMail } = require('../config/mailer');

const Student = require('../models/Student.model');
const User = require('../models/User.model');
const Document = require('../models/Document.model');
const Course = require('../models/Course.model');

const POPULATE_USER = 'name email phone isActive avatar';
const POPULATE_COURSE = 'name subject classLevel';

const isSelf = async (req, studentDoc) => studentDoc.user && studentDoc.user._id
  ? studentDoc.user._id.toString() === req.user._id.toString()
  : studentDoc.user.toString() === req.user._id.toString();

/** GET /students (admin) */
const listStudents = catchAsync(async (req, res) => {
  const { status, course, class: classLevel, city, search } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (status) filter.admissionStatus = status;
  if (course) filter.course = course;
  if (classLevel) filter.currentClass = classLevel;
  if (city) filter.city = new RegExp(city, 'i');
  if (search) filter.$text = { $search: search };

  const [students, total] = await Promise.all([
    Student.find(filter)
      .populate('user', POPULATE_USER)
      .populate('course', POPULATE_COURSE)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Student.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: students, meta: buildMeta(page, limit, total) });
});

/** GET /students/:id (admin, or self) */
const getStudent = catchAsync(async (req, res) => {
  const student = await Student.findById(req.params.id).populate('user', POPULATE_USER).populate('course', POPULATE_COURSE);
  if (!student) throw ApiError.notFound('Student not found');

  if (req.user.role !== 'admin' && !(await isSelf(req, student))) {
    throw ApiError.forbidden('You cannot access this student record');
  }

  return sendSuccess(res, { data: student });
});

const SELF_EDITABLE_FIELDS = [
  'mobile',
  'parentMobile',
  'address',
  'city',
  'state',
  'pincode',
  'emergencyContact',
  'medicalInfo',
  'bloodGroup',
];

const ADMIN_EDITABLE_FIELDS = [
  ...SELF_EDITABLE_FIELDS,
  'fatherName',
  'motherName',
  'gender',
  'dob',
  'schoolName',
  'board',
  'currentClass',
  'course',
  'previousSchool',
  'tenthPercentage',
  'twelfthPercentage',
];

/** PATCH /students/:id (admin/self depending on field set) */
const updateStudent = catchAsync(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw ApiError.notFound('Student not found');

  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && !(await isSelf(req, student))) {
    throw ApiError.forbidden('You cannot update this student record');
  }

  const allowedFields = isAdmin ? ADMIN_EDITABLE_FIELDS : SELF_EDITABLE_FIELDS;
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) student[field] = req.body[field];
  });

  await student.save();
  await logActivity({ user: req.user._id, action: 'student:update', req, meta: { studentId: student._id } });

  return sendSuccess(res, { message: 'Student updated successfully', data: student });
});

/** PATCH /students/:id/approve (admin) */
const approveStudent = catchAsync(async (req, res) => {
  const student = await Student.findById(req.params.id).populate('user', 'name email');
  if (!student) throw ApiError.notFound('Student not found');
  if (student.admissionStatus === 'approved') throw ApiError.conflict('Student is already approved');

  if (!student.registrationNumber) {
    student.registrationNumber = await generateSequentialCode(Student, 'registrationNumber', 'PTC-REG');
  }
  const codes = await generateStudentCodes(Student);
  student.studentId = codes.studentId;
  student.admissionNumber = codes.admissionNumber;
  student.admissionStatus = 'approved';
  student.rejectionReason = undefined;
  student.approvedBy = req.user._id;
  student.approvedAt = new Date();
  await student.save();

  if (student.user?.email) {
    await sendMail({
      to: student.user.email,
      subject: 'Welcome to Pinnacle Tuition Classes — Admission Approved',
      html: `<p>Dear ${student.user.name},</p><p>Congratulations! Your admission has been approved.</p><p>Student ID: <b>${student.studentId}</b><br/>Admission Number: <b>${student.admissionNumber}</b></p><p>You can now log in to your student portal.</p>`,
    });
  }

  await notifyUser({
    user: student.user._id,
    type: 'system',
    title: 'Admission Approved',
    body: `Your admission has been approved. Student ID: ${student.studentId}`,
    link: '/dashboard',
  });

  await logActivity({ user: req.user._id, action: 'student:approve', req, meta: { studentId: student._id } });

  return sendSuccess(res, { message: 'Student approved successfully', data: student });
});

/** PATCH /students/:id/reject (admin) */
const rejectStudent = catchAsync(async (req, res) => {
  const { reason } = req.body;
  const student = await Student.findById(req.params.id).populate('user', 'name email');
  if (!student) throw ApiError.notFound('Student not found');

  student.admissionStatus = 'rejected';
  student.rejectionReason = reason;
  await student.save();

  if (student.user?._id) {
    await notifyUser({
      user: student.user._id,
      type: 'system',
      title: 'Admission Rejected',
      body: `Your admission application was rejected. Reason: ${reason}`,
    });
  }

  await logActivity({ user: req.user._id, action: 'student:reject', req, meta: { studentId: student._id, reason } });

  return sendSuccess(res, { message: 'Student rejected', data: student });
});

/** PATCH /students/:id/suspend (admin) */
const suspendStudent = catchAsync(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw ApiError.notFound('Student not found');

  student.admissionStatus = 'suspended';
  await student.save();

  await User.findByIdAndUpdate(student.user, { $set: { refreshTokens: [] } });

  await logActivity({ user: req.user._id, action: 'student:suspend', req, meta: { studentId: student._id } });

  return sendSuccess(res, { message: 'Student suspended', data: student });
});

/** DELETE /students/:id (admin) */
const deleteStudent = catchAsync(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw ApiError.notFound('Student not found');

  await Document.deleteMany({ student: student._id });
  await User.findByIdAndDelete(student.user);
  await student.deleteOne();

  await logActivity({ user: req.user._id, action: 'student:delete', req, meta: { studentId: req.params.id } });

  return sendSuccess(res, { message: 'Student deleted successfully' });
});

/** POST /students/bulk-upload (admin, CSV via multer) */
const bulkUpload = catchAsync(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('CSV file is required');

  let records;
  try {
    records = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });
  } catch (err) {
    throw ApiError.badRequest(`Could not parse CSV file: ${err.message}`);
  }

  const results = { created: 0, failed: 0, errors: [] };

  for (let i = 0; i < records.length; i += 1) {
    const row = records[i];
    const rowNum = i + 2; // account for header row
    try {
      const studentName = row.studentName || row.name;
      const email = (row.email || '').toLowerCase().trim();
      const fatherName = row.fatherName;
      const mobile = row.mobile;
      const currentClass = row.currentClass || row.class;
      const courseRef = row.course || row.selectedCourse;

      if (!studentName || !email || !fatherName || !mobile || !currentClass) {
        throw new Error('Missing required column(s): studentName, email, fatherName, mobile, currentClass');
      }

      // eslint-disable-next-line no-await-in-loop
      const existing = await User.findOne({ email });
      if (existing) throw new Error(`Email ${email} already registered`);

      let course = null;
      if (courseRef) {
        // eslint-disable-next-line no-await-in-loop
        course = (await Course.findById(courseRef).catch(() => null)) || (await Course.findOne({ name: new RegExp(`^${courseRef}$`, 'i') }));
      }

      const password = row.password || Math.random().toString(36).slice(-8);
      // eslint-disable-next-line no-await-in-loop
      const user = await User.create({ name: studentName, email, password, role: 'student', phone: mobile });

      // eslint-disable-next-line no-await-in-loop
      const registrationNumber = await generateSequentialCode(Student, 'registrationNumber', 'PTC-REG');

      // eslint-disable-next-line no-await-in-loop
      await Student.create({
        user: user._id,
        fatherName,
        motherName: row.motherName,
        mobile,
        parentMobile: row.parentMobile,
        address: row.address,
        city: row.city,
        state: row.state,
        pincode: row.pincode,
        gender: row.gender,
        schoolName: row.schoolName,
        board: row.board,
        currentClass: String(currentClass),
        course: course ? course._id : undefined,
        registrationNumber,
        admissionStatus: 'pending',
        searchName: studentName,
      });

      results.created += 1;
    } catch (err) {
      results.failed += 1;
      results.errors.push({ row: rowNum, message: err.message });
    }
  }

  await logActivity({ user: req.user._id, action: 'student:bulk-upload', req, meta: results });

  return sendSuccess(res, { message: 'Bulk upload processed', data: results });
});

/** POST /students/bulk-delete (admin) */
const bulkDelete = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const students = await Student.find({ _id: { $in: ids } });
  const userIds = students.map((s) => s.user);

  await Document.deleteMany({ student: { $in: ids } });
  await User.deleteMany({ _id: { $in: userIds } });
  const result = await Student.deleteMany({ _id: { $in: ids } });

  await logActivity({ user: req.user._id, action: 'student:bulk-delete', req, meta: { count: result.deletedCount } });

  return sendSuccess(res, { message: 'Students deleted successfully', data: { deletedCount: result.deletedCount } });
});

const buildExportFilter = (query) => {
  const { status, course, class: classLevel, city, search } = query;
  const filter = {};
  if (status) filter.admissionStatus = status;
  if (course) filter.course = course;
  if (classLevel) filter.currentClass = classLevel;
  if (city) filter.city = new RegExp(city, 'i');
  if (search) filter.$text = { $search: search };
  return filter;
};

/** GET /students/export/excel (admin) */
const exportExcel = catchAsync(async (req, res) => {
  const filter = buildExportFilter(req.query);
  const students = await Student.find(filter).populate('user', POPULATE_USER).populate('course', POPULATE_COURSE).sort({ createdAt: -1 });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Students');
  sheet.columns = [
    { header: 'Student ID', key: 'studentId', width: 16 },
    { header: 'Registration No', key: 'registrationNumber', width: 18 },
    { header: 'Admission No', key: 'admissionNumber', width: 18 },
    { header: 'Name', key: 'name', width: 24 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Mobile', key: 'mobile', width: 16 },
    { header: 'Class', key: 'currentClass', width: 8 },
    { header: 'Course', key: 'course', width: 22 },
    { header: 'City', key: 'city', width: 16 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Admitted On', key: 'createdAt', width: 18 },
  ];

  students.forEach((s) => {
    sheet.addRow({
      studentId: s.studentId || '',
      registrationNumber: s.registrationNumber || '',
      admissionNumber: s.admissionNumber || '',
      name: s.user?.name || '',
      email: s.user?.email || '',
      mobile: s.mobile,
      currentClass: s.currentClass,
      course: s.course?.name || '',
      city: s.city || '',
      status: s.admissionStatus,
      createdAt: s.createdAt.toISOString().slice(0, 10),
    });
  });
  sheet.getRow(1).font = { bold: true };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="students-export.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});

/** GET /students/export/pdf (admin) */
const exportPdf = catchAsync(async (req, res) => {
  const filter = buildExportFilter(req.query);
  const students = await Student.find(filter).populate('user', POPULATE_USER).populate('course', POPULATE_COURSE).sort({ createdAt: -1 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="students-export.pdf"');

  const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
  doc.pipe(res);

  doc.fontSize(16).text('Pinnacle Tuition Classes — Students Export', { align: 'center' });
  doc.moveDown();
  doc.fontSize(9);

  students.forEach((s, idx) => {
    doc.text(
      `${idx + 1}. ${s.user?.name || '-'} | ${s.studentId || 'N/A'} | ${s.user?.email || '-'} | Class ${s.currentClass} | ${s.course?.name || '-'} | ${s.admissionStatus}`
    );
  });

  doc.end();
});

/** GET /students/:id/documents */
const getStudentDocuments = catchAsync(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw ApiError.notFound('Student not found');
  if (req.user.role !== 'admin' && !(await isSelf(req, student))) {
    throw ApiError.forbidden('You cannot access these documents');
  }

  const documents = await Document.find({ student: student._id });
  return sendSuccess(res, { data: documents });
});

/** GET /students/:id/id-card */
const getIdCard = catchAsync(async (req, res) => {
  const student = await Student.findById(req.params.id).populate('user', 'name email avatar').populate('course', 'name subject classLevel');
  if (!student) throw ApiError.notFound('Student not found');
  if (req.user.role !== 'admin' && !(await isSelf(req, student))) {
    throw ApiError.forbidden('You cannot access this ID card');
  }
  if (student.admissionStatus !== 'approved') {
    throw ApiError.badRequest('ID card is only available for approved students');
  }

  const qrPayload = JSON.stringify({ studentId: student.studentId, admissionNumber: student.admissionNumber });
  const qrDataUrl = await generateQRDataURL(qrPayload);

  return sendSuccess(res, {
    data: {
      studentId: student.studentId,
      admissionNumber: student.admissionNumber,
      registrationNumber: student.registrationNumber,
      name: student.user?.name,
      photo: student.user?.avatar?.url,
      course: student.course,
      currentClass: student.currentClass,
      bloodGroup: student.bloodGroup,
      qrPayload,
      qrDataUrl,
    },
  });
});

/** GET /students/verify/:studentId (public) */
const verifyByStudentId = catchAsync(async (req, res) => {
  const student = await Student.findOne({ studentId: req.params.studentId })
    .populate('user', 'name')
    .populate('course', 'name subject classLevel');

  if (!student || student.admissionStatus !== 'approved') {
    return sendSuccess(res, { data: { valid: false } });
  }

  return sendSuccess(res, {
    data: {
      valid: true,
      studentId: student.studentId,
      admissionNumber: student.admissionNumber,
      name: student.user?.name,
      course: student.course,
      currentClass: student.currentClass,
      admissionStatus: student.admissionStatus,
    },
  });
});

module.exports = {
  listStudents,
  getStudent,
  updateStudent,
  approveStudent,
  rejectStudent,
  suspendStudent,
  deleteStudent,
  bulkUpload,
  bulkDelete,
  exportExcel,
  exportPdf,
  getStudentDocuments,
  getIdCard,
  verifyByStudentId,
};
