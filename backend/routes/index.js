const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/students', require('./students.routes'));
router.use('/courses', require('./courses.routes'));
router.use('/study-materials', require('./studyMaterials.routes'));
router.use('/assignments', require('./assignments.routes'));
router.use('/attendance', require('./attendance.routes'));
router.use('/tests', require('./tests.routes'));
router.use('/results', require('./results.routes'));
router.use('/fees', require('./fees.routes'));
router.use('/payments', require('./payments.routes'));
router.use('/announcements', require('./announcements.routes'));
router.use('/notifications', require('./notifications.routes'));
router.use('/messages', require('./messages.routes'));
router.use('/support-tickets', require('./supportTickets.routes'));
router.use('/reports', require('./reports.routes'));
router.use('/analytics', require('./analytics.routes'));
router.use('/search', require('./search.routes'));

module.exports = router;
