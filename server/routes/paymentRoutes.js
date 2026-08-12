const express = require('express');
const router = express.Router();
const { initiatePayment, verifyPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/khalti/initiate', protect, initiatePayment);
router.post('/khalti/verify', protect, verifyPayment);

module.exports = router;
