const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const controller = require('../controllers/reports.controller');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/:type/export', controller.exportReport);

module.exports = router;
