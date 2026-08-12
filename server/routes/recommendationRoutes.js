const express = require('express');
const router = express.Router();
const { getRecommendedSellers } = require('../controllers/recommendationController');

// GET /api/recommendations/sellers — top ranked HomeChefs (single-account sellers).
router.get('/sellers', getRecommendedSellers);

module.exports = router;
