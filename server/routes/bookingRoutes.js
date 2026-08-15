const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, getSellerBookings, acceptBooking, rejectBooking, cancelBooking, completeBooking } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);
router.get('/seller', protect, getSellerBookings);
router.put('/:id/accept', protect, acceptBooking);
router.put('/:id/reject', protect, rejectBooking);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/complete', protect, completeBooking);

module.exports = router;
