const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const controller = require('../controllers/supportTickets.controller');
const { createTicketValidator, updateTicketValidator } = require('../validators/supportTickets.validator');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('student'), createTicketValidator, validate, controller.createTicket);
router.get('/', controller.listTickets);
router.patch('/:id', authorize('admin'), updateTicketValidator, validate, controller.updateTicket);

module.exports = router;
