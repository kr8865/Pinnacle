const { param } = require('express-validator');

/** GET /results/:studentId (admin) */
const studentIdParamValidator = [param('studentId').isMongoId().withMessage('Invalid student id')];

module.exports = { studentIdParamValidator };
