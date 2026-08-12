const express = require('express');
const router = express.Router();
const {
  getChefs,
  getChefById,
  updateMyProfile,
  addPortfolioItem,
  removePortfolioItem
} = require('../controllers/chefController');
const { protect, homechef } = require('../middleware/auth');

// Public chef directory + profile.
router.get('/', getChefs);
router.get('/:id', getChefById);

// HomeChef-only profile & portfolio management.
router.put('/me/profile', protect, homechef, updateMyProfile);
router.post('/me/portfolio', protect, homechef, addPortfolioItem);
router.delete('/me/portfolio/:itemId', protect, homechef, removePortfolioItem);

module.exports = router;
