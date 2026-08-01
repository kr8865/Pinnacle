const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendSuccess, buildMeta } = require('../utils/apiResponse');
const { getPagination } = require('../utils/queryHelpers');
const { notifyUser } = require('../services/notification.service');

const SupportTicket = require('../models/SupportTicket.model');
const Student = require('../models/Student.model');

/** POST /support-tickets (student) — { subject, category, description } */
const createTicket = catchAsync(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) throw ApiError.notFound('Student profile not found');

  const { subject, category, description } = req.body;
  const ticket = await SupportTicket.create({ student: student._id, subject, category, description });

  return sendSuccess(res, { statusCode: 201, message: 'Support ticket created successfully', data: ticket });
});

/** GET /support-tickets (admin: all, student: own) */
const listTickets = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.user.role === 'admin') {
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
  } else {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) throw ApiError.notFound('Student profile not found');
    filter.student = student._id;
  }

  const [tickets, total] = await Promise.all([
    SupportTicket.find(filter)
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .populate('responses.by', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SupportTicket.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: tickets, meta: buildMeta(page, limit, total) });
});

/** PATCH /support-tickets/:id (admin) — { status, response } */
const updateTicket = catchAsync(async (req, res) => {
  const { status, response } = req.body;
  const ticket = await SupportTicket.findById(req.params.id).populate({ path: 'student', populate: { path: 'user', select: 'name' } });
  if (!ticket) throw ApiError.notFound('Support ticket not found');

  if (response) {
    ticket.responses.push({ by: req.user._id, message: response, at: new Date() });
  }
  if (status) ticket.status = status;
  await ticket.save();

  if (ticket.student?.user) {
    await notifyUser({
      user: ticket.student.user._id || ticket.student.user,
      type: 'system',
      title: 'Support Ticket Updated',
      body: response || `Your ticket status is now ${status}`,
      link: `/support-tickets/${ticket._id}`,
    });
  }

  return sendSuccess(res, { message: 'Support ticket updated successfully', data: ticket });
});

module.exports = { createTicket, listTickets, updateTicket };
