const express = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const controller = require('../controllers/search.controller');

const router = express.Router();

router.get('/', authenticate, controller.globalSearch);

module.exports = router;
