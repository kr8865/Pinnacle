const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const controller = require('../controllers/tests.controller');
const { createValidator, updateValidator, idParamValidator, listValidator, submitValidator } = require('../validators/tests.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', listValidator, validate, controller.listTests);
router.post('/', authorize('admin'), createValidator, validate, controller.createTest);

router.get('/:id', idParamValidator, validate, controller.getTest);
router.patch('/:id', authorize('admin'), updateValidator, validate, controller.updateTest);
router.delete('/:id', authorize('admin'), idParamValidator, validate, controller.deleteTest);
router.patch('/:id/publish', authorize('admin'), idParamValidator, validate, controller.publishTest);

router.post('/:id/start', authorize('student'), idParamValidator, validate, controller.startTest);
router.post('/:id/submit', authorize('student'), submitValidator, validate, controller.submitTest);
router.get('/:id/leaderboard', idParamValidator, validate, controller.leaderboard);

module.exports = router;
