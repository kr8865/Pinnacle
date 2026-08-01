const express = require('express');
const { upload } = require('../middlewares/upload.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const controller = require('../controllers/studyMaterials.controller');
const { listValidator, createValidator, idParamValidator } = require('../validators/studyMaterials.validator');

const router = express.Router();

router.use(authenticate);

router.get('/bookmarked', authorize('student'), controller.listBookmarked);
router.get('/', listValidator, validate, controller.listMaterials);
router.get('/:id', idParamValidator, validate, controller.getMaterial);

router.post('/', authorize('admin'), upload.single('file'), createValidator, validate, controller.createMaterial);
router.delete('/:id', authorize('admin'), idParamValidator, validate, controller.deleteMaterial);

router.post('/:id/bookmark', authorize('student'), idParamValidator, validate, controller.toggleBookmark);

module.exports = router;
