const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const controller = require('../controllers/payments.controller');
const {
  createOrderValidator,
  verifyPaymentValidator,
  idParamValidator,
  approvePaymentValidator,
  rejectPaymentValidator,
} = require('../validators/payments.validator');

const router = express.Router();

router.use(authenticate);

router.post('/create-order', authorize('student'), createOrderValidator, validate, controller.createPaymentOrder);
router.post('/verify', authorize('student'), verifyPaymentValidator, validate, controller.verifyPayment);

router.get('/history', authorize('student'), controller.paymentHistory);

router.post('/:id/approve', authorize('admin'), approvePaymentValidator, validate, controller.approvePayment);
router.post('/:id/reject', authorize('admin'), rejectPaymentValidator, validate, controller.rejectPayment);

router.get('/:id/receipt', idParamValidator, validate, controller.getReceipt);

module.exports = router;
