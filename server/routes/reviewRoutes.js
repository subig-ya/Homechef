const express = require('express');
const router = express.Router();
const { createReview, getReviewsByDish, getReviewsBySeller } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createReview);
router.get('/dish/:dishId', getReviewsByDish);
router.get('/seller/:sellerId', getReviewsBySeller);

module.exports = router;
