const express = require('express');
const { upload } = require('../middlewares/upload.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const controller = require('../controllers/assignments.controller');
const {
  listValidator,
  createValidator,
  idParamValidator,
  submissionIdParamValidator,
  gradeValidator,
  submitValidator,
} = require('../validators/assignments.validator');

const router = express.Router();

const attachmentsUpload = upload.fields([
  { name: 'files', maxCount: 10 },
  { name: 'solutionPdf', maxCount: 1 },
]);

router.use(authenticate);

router.get('/my-submissions', authorize('student'), controller.mySubmissions);
router.get('/', listValidator, validate, controller.listAssignments);

router.post('/', authorize('admin'), attachmentsUpload, createValidator, validate, controller.createAssignment);

router.patch('/submissions/:submissionId/grade', authorize('admin'), gradeValidator, validate, controller.gradeSubmission);

router.get('/:id', idParamValidator, validate, controller.getAssignment);
router.get('/:id/submissions', authorize('admin'), idParamValidator, validate, controller.listSubmissions);

router.patch('/:id', authorize('admin'), attachmentsUpload, idParamValidator, validate, controller.updateAssignment);
router.patch('/:id/publish', authorize('admin'), idParamValidator, validate, controller.publishAssignment);
router.patch('/:id/close', authorize('admin'), idParamValidator, validate, controller.closeAssignment);
router.delete('/:id', authorize('admin'), idParamValidator, validate, controller.deleteAssignment);

router.post('/:id/submit', authorize('student'), upload.fields([{ name: 'files', maxCount: 10 }]), submitValidator, validate, controller.submitAssignment);

module.exports = router;
