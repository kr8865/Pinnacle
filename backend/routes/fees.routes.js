const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const controller = require('../controllers/fees.controller');
const { generateFeeValidator, listValidator } = require('../validators/fees.validator');

const router = express.Router();

router.use(authenticate);

router.post('/generate', authorize('admin'), generateFeeValidator, validate, controller.generateFee);
router.get('/due', authorize('student'), controller.dueFees);
router.get('/reports/revenue', authorize('admin'), controller.revenueReport);
router.get('/', authorize('admin'), listValidator, validate, controller.listFees);

module.exports = router;
