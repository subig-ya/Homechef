const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { resetLimiter, createAuthLimiter } = require('../middleware/rateLimiter');

// Each brute-forceable auth endpoint gets its own limiter instance so an
// attacker hammering one route (or a test script) cannot lock a genuine user
// out of the others.
router.post('/register', createAuthLimiter(), registerUser);
router.post('/login', createAuthLimiter(), loginUser);
router.post('/forgot-password', resetLimiter, forgotPassword);
router.post('/reset-password', resetLimiter, resetPassword);
router.get('/me', protect, getCurrentUser);
router.put('/profile', protect, updateProfile);
router.put('/password', createAuthLimiter(), protect, changePassword);

module.exports = router;
