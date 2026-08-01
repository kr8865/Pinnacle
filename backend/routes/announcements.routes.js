const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const controller = require('../controllers/announcements.controller');
const { createValidator, idParamValidator } = require('../validators/announcements.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', controller.listAnnouncements);
router.post('/', authorize('admin'), createValidator, validate, controller.createAnnouncement);
router.patch('/:id', authorize('admin'), idParamValidator, validate, controller.updateAnnouncement);
router.delete('/:id', authorize('admin'), idParamValidator, validate, controller.deleteAnnouncement);

module.exports = router;
