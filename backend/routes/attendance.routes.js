const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const controller = require('../controllers/attendance.controller');
const { markValidator, listValidator, summaryValidator } = require('../validators/attendance.validator');

const router = express.Router();

router.use(authenticate);

router.post('/mark', authorize('admin'), markValidator, validate, controller.markAttendance);
router.get('/', listValidator, validate, controller.listAttendance);
router.get('/summary/:studentId', summaryValidator, validate, controller.attendanceSummary);

module.exports = router;
