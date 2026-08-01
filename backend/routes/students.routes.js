const express = require('express');
const { upload } = require('../middlewares/upload.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const controller = require('../controllers/students.controller');
const {
  listStudentsValidator,
  idParamValidator,
  studentIdParamValidator,
  updateStudentValidator,
  rejectStudentValidator,
  bulkDeleteValidator,
} = require('../validators/students.validator');

const router = express.Router();

// Public verification endpoint — must be registered before authenticate is applied globally below,
// and before the generic "/:id" route so "verify" isn't captured as an id.
router.get('/verify/:studentId', studentIdParamValidator, validate, controller.verifyByStudentId);

router.use(authenticate);

router.get('/', authorize('admin'), listStudentsValidator, validate, controller.listStudents);

router.post('/bulk-upload', authorize('admin'), upload.single('file'), controller.bulkUpload);
router.post('/bulk-delete', authorize('admin'), bulkDeleteValidator, validate, controller.bulkDelete);

router.get('/export/excel', authorize('admin'), controller.exportExcel);
router.get('/export/pdf', authorize('admin'), controller.exportPdf);

router.get('/:id', idParamValidator, validate, controller.getStudent);
router.get('/:id/documents', idParamValidator, validate, controller.getStudentDocuments);
router.get('/:id/id-card', idParamValidator, validate, controller.getIdCard);

router.patch('/:id', updateStudentValidator, validate, controller.updateStudent);
router.patch('/:id/approve', authorize('admin'), idParamValidator, validate, controller.approveStudent);
router.patch('/:id/reject', authorize('admin'), rejectStudentValidator, validate, controller.rejectStudent);
router.patch('/:id/suspend', authorize('admin'), idParamValidator, validate, controller.suspendStudent);

router.delete('/:id', authorize('admin'), idParamValidator, validate, controller.deleteStudent);

module.exports = router;
