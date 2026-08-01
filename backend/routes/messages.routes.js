const express = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const controller = require('../controllers/messages.controller');
const { withUserParamValidator, sendMessageValidator } = require('../validators/messages.validator');

const router = express.Router();

router.use(authenticate);

router.post('/', sendMessageValidator, validate, controller.sendMessage);
router.get('/:withUserId', withUserParamValidator, validate, controller.getThread);

module.exports = router;
