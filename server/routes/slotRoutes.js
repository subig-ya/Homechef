const express = require('express');
const router = express.Router();
const { createSlot, getSlotsBySeller, getAllSlots } = require('../controllers/slotController');
const { protect, homechef } = require('../middleware/auth');

router.get('/', getAllSlots);
// Managing availability is a HomeChef privilege.
router.get('/me', protect, homechef, getSlotsBySeller);
router.get('/chef', protect, homechef, getSlotsBySeller);
router.post('/', protect, homechef, createSlot);

module.exports = router;
