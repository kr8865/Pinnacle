const express = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const controller = require('../controllers/notifications.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', controller.listNotifications);
router.patch('/read-all', controller.markAllRead);
router.patch('/:id/read', controller.markRead);

module.exports = router;
