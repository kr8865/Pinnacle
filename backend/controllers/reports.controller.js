const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

const Student = require('../models/Student.model');
const Attendance = require('../models/Attendance.model');
const Fee = require('../models/Fee.model');
const Payment = require('../models/Payment.model');
const Assignment = require('../models/Assignment.model');

/** Each report type resolves to a title, column definitions, and a data loader. */
const REPORT_DEFINITIONS = {
  student: {
    title: 'Students Report',
    columns: [
      { header: 'Student ID', key: 'studentId', width: 16 },
      { header: 'Name', key: 'name', width: 24 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Class', key: 'currentClass', width: 8 },
      { header: 'Course', key: 'course', width: 22 },
      { header: 'Status', key: 'status', width: 14 },
    ],
    load: async () => {
      const students = await Student.find().populate('user', 'name email').populate('course', 'name').sort({ createdAt: -1 });
      return students.map((s) => ({
        studentId: s.studentId || '',
        name: s.user?.name || '',
        email: s.user?.email || '',
        currentClass: s.currentClass,
        course: s.course?.name || '',
        status: s.admissionStatus,
      }));
    },
  },
  admission: {
    title: 'Admissions Report',
    columns: [
      { header: 'Registration No', key: 'registrationNumber', width: 18 },
      { header: 'Name', key: 'name', width: 24 },
      { header: 'Class', key: 'currentClass', width: 8 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Applied On', key: 'createdAt', width: 18 },
    ],
    load: async () => {
      const students = await Student.find().populate('user', 'name').sort({ createdAt: -1 });
      return students.map((s) => ({
        registrationNumber: s.registrationNumber || '',
        name: s.user?.name || '',
        currentClass: s.currentClass,
        status: s.admissionStatus,
        createdAt: s.createdAt.toISOString().slice(0, 10),
      }));
    },
  },
  attendance: {
    title: 'Attendance Report',
    columns: [
      { header: 'Student', key: 'name', width: 24 },
      { header: 'Course', key: 'course', width: 20 },
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Status', key: 'status', width: 12 },
    ],
    load: async () => {
      const records = await Attendance.find()
        .populate({ path: 'student', populate: { path: 'user', select: 'name' } })
        .populate('course', 'name')
        .sort({ date: -1 })
        .limit(5000);
      return records.map((r) => ({
        name: r.student?.user?.name || '',
        course: r.course?.name || '',
        date: r.date.toISOString().slice(0, 10),
        status: r.status,
      }));
    },
  },
  fee: {
    title: 'Fees Report',
    columns: [
      { header: 'Student', key: 'name', width: 24 },
      { header: 'Title', key: 'title', width: 20 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'Due Date', key: 'dueDate', width: 14 },
      { header: 'Status', key: 'status', width: 14 },
    ],
    load: async () => {
      const fees = await Fee.find().populate({ path: 'student', populate: { path: 'user', select: 'name' } }).sort({ dueDate: -1 });
      return fees.map((f) => ({
        name: f.student?.user?.name || '',
        title: f.title,
        amount: f.amount,
        dueDate: f.dueDate.toISOString().slice(0, 10),
        status: f.status,
      }));
    },
  },
  revenue: {
    title: 'Revenue Report',
    columns: [
      { header: 'Student', key: 'name', width: 24 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'Method', key: 'method', width: 14 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Date', key: 'date', width: 14 },
    ],
    load: async () => {
      const payments = await Payment.find({ status: 'success' })
        .populate({ path: 'student', populate: { path: 'user', select: 'name' } })
        .sort({ createdAt: -1 });
      return payments.map((p) => ({
        name: p.student?.user?.name || '',
        amount: p.amount,
        method: p.method,
        status: p.status,
        date: p.createdAt.toISOString().slice(0, 10),
      }));
    },
  },
  assignment: {
    title: 'Assignments Report',
    columns: [
      { header: 'Title', key: 'title', width: 26 },
      { header: 'Course', key: 'course', width: 20 },
      { header: 'Class', key: 'classLevel', width: 8 },
      { header: 'Due Date', key: 'dueDate', width: 14 },
      { header: 'Status', key: 'status', width: 12 },
    ],
    load: async () => {
      const assignments = await Assignment.find().populate('course', 'name').sort({ createdAt: -1 });
      return assignments.map((a) => ({
        title: a.title,
        course: a.course?.name || '',
        classLevel: a.classLevel,
        dueDate: a.dueDate.toISOString().slice(0, 10),
        status: a.status,
      }));
    },
  },
};

/** GET /reports/:type/export?format=excel|pdf (admin) */
const exportReport = catchAsync(async (req, res) => {
  const { type } = req.params;
  const { format = 'excel' } = req.query;

  const definition = REPORT_DEFINITIONS[type];
  if (!definition) throw ApiError.badRequest(`Unsupported report type: ${type}`);

  const rows = await definition.load();

  if (format === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report.pdf"`);

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    doc.pipe(res);
    doc.fontSize(16).text(`Pinnacle Tuition Classes — ${definition.title}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(9);
    rows.forEach((row, idx) => {
      const line = definition.columns.map((c) => `${c.header}: ${row[c.key] ?? '-'}`).join(' | ');
      doc.text(`${idx + 1}. ${line}`);
    });
    doc.end();
    return null;
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(definition.title);
  sheet.columns = definition.columns;
  rows.forEach((row) => sheet.addRow(row));
  sheet.getRow(1).font = { bold: true };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${type}-report.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
  return null;
});

module.exports = { exportReport };
