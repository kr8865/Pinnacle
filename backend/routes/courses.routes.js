const express = require('express');
const { upload } = require('../middlewares/upload.middleware');
const { authenticate, authorize, optionalAuth } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const controller = require('../controllers/courses.controller');
const {
  createCourseValidator,
  updateCourseValidator,
  idParamValidator,
  addChapterValidator,
} = require('../validators/courses.validator');

const router = express.Router();

router.get('/', optionalAuth, controller.listCourses);
router.get('/:id', idParamValidator, validate, controller.getCourse);

router.post('/', authenticate, authorize('admin'), upload.single('thumbnail'), createCourseValidator, validate, controller.createCourse);
router.patch('/:id', authenticate, authorize('admin'), upload.single('thumbnail'), updateCourseValidator, validate, controller.updateCourse);
router.delete('/:id', authenticate, authorize('admin'), idParamValidator, validate, controller.deleteCourse);

router.post('/:id/chapters', authenticate, authorize('admin'), addChapterValidator, validate, controller.addChapter);

module.exports = router;
