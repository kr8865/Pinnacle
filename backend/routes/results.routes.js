const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const controller = require('../controllers/results.controller');
const { studentIdParamValidator } = require('../validators/results.validator');

const router = express.Router();

router.use(authenticate);

router.get('/my', authorize('student'), controller.myResults);
router.get('/:studentId', authorize('admin'), studentIdParamValidator, validate, controller.getResultsForStudent);

module.exports = router;
