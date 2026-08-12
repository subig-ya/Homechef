const express = require('express');
const router = express.Router();
const { getHealthStatus } = require('../controllers/healthController');

// GET /api/health - Endpoint to check API status
router.get('/', getHealthStatus);

module.exports = router;
