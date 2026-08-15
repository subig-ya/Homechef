const express = require('express');
const router = express.Router();
const { createReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

// Users file a report against a chef, listing, or review.
router.post('/', protect, createReport);

module.exports = router;
