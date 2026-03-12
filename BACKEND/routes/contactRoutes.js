const express = require('express');
const router = express.Router();
const contactController = require('../controller/contactController');

// POST /contact  -> submit contact form
router.post('/', contactController.submitContact);

module.exports = router;
