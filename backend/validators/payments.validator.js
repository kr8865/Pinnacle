const { body, param } = require('express-validator');

/** POST /payments/create-order — { feeId } */
const createOrderValidator = [body('feeId').isMongoId().withMessage('Valid feeId is required')];

/** POST /payments/verify — { razorpay_order_id, razorpay_payment_id, razorpay_signature } */
const verifyPaymentValidator = [
  body('razorpay_order_id').notEmpty().withMessage('razorpay_order_id is required'),
  body('razorpay_payment_id').notEmpty().withMessage('razorpay_payment_id is required'),
  body('razorpay_signature').notEmpty().withMessage('razorpay_signature is required'),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid payment id')];

/** POST /payments/:id/approve */
const approvePaymentValidator = [param('id').isMongoId().withMessage('Invalid payment id')];

/** POST /payments/:id/reject — { reason } */
const rejectPaymentValidator = [
  param('id').isMongoId().withMessage('Invalid payment id'),
  body('reason').optional({ checkFalsy: true }).trim(),
];

module.exports = {
  createOrderValidator,
  verifyPaymentValidator,
  idParamValidator,
  approvePaymentValidator,
  rejectPaymentValidator,
};
