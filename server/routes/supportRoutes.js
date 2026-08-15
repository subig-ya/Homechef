const express = require('express');
const router = express.Router();
const { createTicket, getMyTickets } = require('../controllers/supportController');
const { protect } = require('../middleware/auth');

// Anyone (customer or chef) files a support ticket / complaint that goes to
// the admin queue. getMyTickets returns that user's own tickets.
router.post('/', protect, createTicket);
router.get('/me', protect, getMyTickets);

module.exports = router;
