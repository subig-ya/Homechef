const express = require('express');
const router = express.Router();
const {
  getOrCreateConversation,
  getMyConversations,
  getMessages,
  sendMessage,
  markConversationRead
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

// Chat between any two registered accounts.
router.post('/conversations', protect, getOrCreateConversation);
router.get('/conversations', protect, getMyConversations);
router.get('/conversations/:id/messages', protect, getMessages);
router.post('/conversations/:id/messages', protect, sendMessage);
router.put('/conversations/:id/read', protect, markConversationRead);

module.exports = router;
