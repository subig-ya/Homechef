const express = require('express');
const router = express.Router();
const { getMyFavorites, toggleFavorite } = require('../controllers/favoriteController');
const { protect } = require('../middleware/auth');

// A customer's saved chefs and dishes.
router.get('/', protect, getMyFavorites);
router.post('/toggle', protect, toggleFavorite);

module.exports = router;
