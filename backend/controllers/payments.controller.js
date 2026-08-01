const PDFDocument = require('pdfkit');

const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendSuccess, buildMeta } = require('../utils/apiResponse');
const { getPagination } = require('../utils/queryHelpers');
const { generateReceiptNumber } = require('../utils/idGenerators');
const { createOrder, verifySignature } = require('../services/razorpay.service');
const { uploadGeneratedBuffer } = require('../services/upload.service');
const { notifyUser } = require('../services/notification.service');
const { logActivity } = require('../services/activityLog.service');

const Fee = require('../models/Fee.model');
const Payment = require('../models/Payment.model');
const Receipt = require('../models/Receipt.model');
const Student = require('../models/Student.model');

const payableAmount = (fee) => Number((fee.amount - (fee.discount || 0) - (fee.scholarship || 0)).toFixed(2));

const buildReceiptPdfBuffer = ({ receiptNumber, payment, fee, studentName, studentCode }) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text('Pinnacle Tuition Classes', { align: 'center' });
    doc.fontSize(12).text('Fee Payment Receipt', { align: 'center' });
    doc.moveDown(1.5);
    doc.fontSize(10);
    doc.text(`Receipt No: ${receiptNumber}`);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`);
    doc.moveDown();
    doc.text(`Student: ${studentName || 'N/A'}`);
    doc.text(`Student ID: ${studentCode || 'N/A'}`);
    doc.moveDown();
    doc.text(`Fee Title: ${fee.title}`);
    doc.text(`Installment: ${fee.installmentNumber}`);
    doc.text(`Amount Paid: Rs. ${payment.amount}`);
    doc.text(`Payment Method: ${payment.method}`);
    doc.text(`Payment Status: ${payment.status}`);
    if (payment.razorpayPaymentId) doc.text(`Transaction Ref: ${payment.razorpayPaymentId}`);
    doc.moveDown(2);
    doc.text('This is a system-generated receipt.', { align: 'center' });
    doc.end();
  });

/** Generates + uploads a receipt PDF for a successful payment and persists a Receipt record. */
const generateReceiptForPayment = async (payment, fee, studentUser) => {
  const receiptNumber = await generateReceiptNumber(Receipt);
  const buffer = await buildReceiptPdfBuffer({
    receiptNumber,
    payment,
    fee,
    studentName: studentUser?.name,
    studentCode: studentUser?.studentId,
  });
  const uploaded = await uploadGeneratedBuffer(buffer, 'pinnacle/receipts', `receipt-${receiptNumber}`, 'raw');

  return Receipt.create({
    payment: payment._id,
    receiptNumber,
    pdfUrl: uploaded.url,
    publicId: uploaded.publicId,
    issuedAt: new Date(),
  });
};

/** POST /payments/create-order (student) — { feeId } */
const createPaymentOrder = catchAsync(async (req, res) => {
  const { feeId } = req.body;
  const studentDoc = await Student.findOne({ user: req.user._id });
  if (!studentDoc) throw ApiError.notFound('Student profile not found');

  const fee = await Fee.findOne({ _id: feeId, student: studentDoc._id });
  if (!fee) throw ApiError.notFound('Fee record not found');
  if (fee.status === 'paid') throw ApiError.conflict('This fee has already been paid');

  const amount = payableAmount(fee);
  const order = await createOrder({ amount, receipt: `fee_${fee._id}`, notes: { feeId: fee._id.toString(), studentId: studentDoc._id.toString() } });

  const payment = await Payment.create({
    fee: fee._id,
    student: studentDoc._id,
    amount,
    method: 'razorpay',
    razorpayOrderId: order.id,
    status: 'created',
  });

  return sendSuccess(res, {
    statusCode: 201,
    data: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      paymentId: payment._id,
    },
  });
});

/** POST /payments/verify (student) */
const verifyPayment = catchAsync(async (req, res) => {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;

  const payment = await Payment.findOne({ razorpayOrderId: orderId }).populate('student');
  if (!payment) throw ApiError.notFound('Payment order not found');

  const isValid = verifySignature({
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  });

  if (!isValid) {
    payment.status = 'failed';
    await payment.save();
    throw ApiError.badRequest('Payment signature verification failed');
  }

  payment.razorpayPaymentId = paymentId;
  payment.razorpaySignature = signature;
  payment.status = 'success';
  await payment.save();

  const fee = await Fee.findById(payment.fee);
  if (fee) {
    fee.status = payment.amount >= payableAmount(fee) ? 'paid' : 'partially-paid';
    await fee.save();
  }

  const studentUser = await Student.findById(payment.student._id).populate('user', 'name');
  const receipt = await generateReceiptForPayment(payment, fee, {
    name: studentUser?.user?.name,
    studentId: studentUser?.studentId,
  });

  await notifyUser({
    user: payment.student.user,
    type: 'fee',
    title: 'Payment Successful',
    body: `Your payment of Rs. ${payment.amount} was received successfully.`,
    link: `/payments/${payment._id}/receipt`,
  });

  await logActivity({ user: req.user._id, action: 'payment:verify', req, meta: { paymentId: payment._id } });

  return sendSuccess(res, { message: 'Payment verified successfully', data: { payment, receipt } });
});

/** POST /payments/:id/approve (admin, manual/offline payments) */
const approvePayment = catchAsync(async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate({ path: 'student', populate: { path: 'user', select: 'name' } });
  if (!payment) throw ApiError.notFound('Payment not found');
  if (payment.status === 'success') throw ApiError.conflict('Payment already approved');

  payment.status = 'success';
  payment.approvedBy = req.user._id;
  await payment.save();

  const fee = await Fee.findById(payment.fee);
  if (fee) {
    fee.status = payment.amount >= payableAmount(fee) ? 'paid' : 'partially-paid';
    await fee.save();
  }

  const receipt = await generateReceiptForPayment(payment, fee, {
    name: payment.student?.user?.name,
    studentId: payment.student?.studentId,
  });

  await notifyUser({
    user: payment.student.user._id || payment.student.user,
    type: 'fee',
    title: 'Payment Approved',
    body: `Your payment of Rs. ${payment.amount} has been approved.`,
    link: `/payments/${payment._id}/receipt`,
  });

  await logActivity({ user: req.user._id, action: 'payment:approve', req, meta: { paymentId: payment._id } });

  return sendSuccess(res, { message: 'Payment approved successfully', data: { payment, receipt } });
});

/** POST /payments/:id/reject (admin) */
const rejectPayment = catchAsync(async (req, res) => {
  const { reason } = req.body;
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw ApiError.notFound('Payment not found');

  payment.status = 'rejected';
  payment.rejectedReason = reason;
  await payment.save();

  await logActivity({ user: req.user._id, action: 'payment:reject', req, meta: { paymentId: payment._id, reason } });

  return sendSuccess(res, { message: 'Payment rejected', data: payment });
});

/** GET /payments/history (student) */
const paymentHistory = catchAsync(async (req, res) => {
  const studentDoc = await Student.findOne({ user: req.user._id });
  if (!studentDoc) throw ApiError.notFound('Student profile not found');

  const { page, limit, skip } = getPagination(req.query);
  const filter = { student: studentDoc._id };

  const [payments, total] = await Promise.all([
    Payment.find(filter).populate('fee', 'title amount dueDate installmentNumber').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Payment.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: payments, meta: buildMeta(page, limit, total) });
});

/** GET /payments/:id/receipt */
const getReceipt = catchAsync(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw ApiError.notFound('Payment not found');

  if (req.user.role !== 'admin') {
    const studentDoc = await Student.findOne({ user: req.user._id });
    if (!studentDoc || studentDoc._id.toString() !== payment.student.toString()) {
      throw ApiError.forbidden('You cannot access this receipt');
    }
  }

  const receipt = await Receipt.findOne({ payment: payment._id });
  if (!receipt) throw ApiError.notFound('Receipt not found for this payment');

  return sendSuccess(res, { data: receipt });
});

module.exports = { createPaymentOrder, verifyPayment, approvePayment, rejectPayment, paymentHistory, getReceipt };
