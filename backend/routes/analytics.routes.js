const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const controller = require('../controllers/analytics.controller');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/dashboard', controller.dashboard);
router.get('/graphs', controller.graphs);

module.exports = router;
