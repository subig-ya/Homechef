const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Resolve the conversation a user participates in, or throw a 403.
 */
const getConversationForUser = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return null;
  if (!conversation.participants.some((p) => p.toString() === userId.toString())) return null;
  return conversation;
};

/**
 * POST /api/chat/conversations — get or create a 1:1 conversation with another
 * user. Works for any two registered accounts (customer↔chef, customer↔customer…).
 */
const getOrCreateConversation = async (req, res, next) => {
  try {
    const { otherUserId } = req.body;

    if (!mongoose.isValidObjectId(otherUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid user.' });
    }

    if (otherUserId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot start a chat with yourself.' });
    }

    const otherUser = await User.findById(otherUserId).select('name email profileImage role isBanned');
    if (!otherUser) {
      return res.status(404).json({ success: false, message: 'That user no longer exists.' });
    }
    if (otherUser.isBanned) {
      return res.status(400).json({ success: false, message: 'That account is suspended.' });
    }

    // Atomically find-or-create. Two racing requests (e.g. a component
    // mounting twice) both upsert on the same deterministic key, and the
    // unique index makes sure only one conversation is ever created.
    const sortedIds = [req.user._id.toString(), otherUser._id.toString()].sort();
    const participantKey = sortedIds.join('_');

    const conversation = await Conversation.findOneAndUpdate(
      { participantKey },
      {
        $setOnInsert: {
          participants: sortedIds.map((id) => new mongoose.Types.ObjectId(id)),
          participantKey
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Conversation ready',
      data: {
        _id: conversation._id,
        createdAt: conversation.createdAt,
        otherUser: {
          _id: otherUser._id,
          name: otherUser.name,
          email: otherUser.email,
          profileImage: otherUser.profileImage,
          role: otherUser.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/chat/conversations — the current user's conversations, newest
 * activity first, with the other participant, last message and unread count.
 */
const getMyConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .sort({ lastMessageAt: -1 })
      .limit(100);

    const enriched = await Promise.all(
      conversations.map(async (conversation) => {
        const otherUserId = conversation.participants.find(
          (p) => p.toString() !== req.user._id.toString()
        );
        const otherUser = await User.findById(otherUserId).select('name email profileImage role');
        const unreadCount = await Message.countDocuments({
          conversationId: conversation._id,
          senderId: { $ne: req.user._id },
          readBy: { $ne: req.user._id }
        });

        return {
          _id: conversation._id,
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageAt,
          createdAt: conversation.createdAt,
          unreadCount,
          otherUser: otherUser
            ? {
                _id: otherUser._id,
                name: otherUser.name,
                email: otherUser.email,
                profileImage: otherUser.profileImage,
                role: otherUser.role
              }
            : null
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enriched.length,
      message: 'Conversations fetched successfully',
      data: enriched
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/chat/conversations/:id/messages — all messages for a conversation.
 * Marks the viewer's incoming messages as read.
 */
const getMessages = async (req, res, next) => {
  try {
    const conversation = await getConversationForUser(req.params.id, req.user._id);
    if (!conversation) {
      return res.status(403).json({ success: false, message: 'You are not part of this conversation.' });
    }

    await Message.updateMany(
      {
        conversationId: conversation._id,
        senderId: { $ne: req.user._id },
        readBy: { $ne: req.user._id }
      },
      { $addToSet: { readBy: req.user._id } }
    );

    const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      message: 'Messages fetched successfully',
      data: { me: req.user._id, messages }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/chat/conversations/:id/messages — send a message. Notifies the
 * recipient so the new message shows up in their notifications too.
 */
const sendMessage = async (req, res, next) => {
  try {
    const conversation = await getConversationForUser(req.params.id, req.user._id);
    if (!conversation) {
      return res.status(403).json({ success: false, message: 'You are not part of this conversation.' });
    }

    const { text } = req.body;
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }
    if (text.trim().length > 1000) {
      return res.status(400).json({ success: false, message: 'Message is too long (1000 characters max).' });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user._id,
      text: text.trim()
    });

    const preview = text.trim().length > 60 ? `${text.trim().slice(0, 60)}…` : text.trim();
    conversation.lastMessage = preview;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const recipientId = conversation.participants.find((p) => p.toString() !== req.user._id.toString());
    if (recipientId) {
      await Notification.create({
        recipient: recipientId,
        title: 'New message',
        message: `New message from ${req.user.name}: “${preview}”`,
        type: 'MESSAGE'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent',
      data: message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/chat/conversations/:id/read — explicitly mark all incoming
 * messages as read.
 */
const markConversationRead = async (req, res, next) => {
  try {
    const conversation = await getConversationForUser(req.params.id, req.user._id);
    if (!conversation) {
      return res.status(403).json({ success: false, message: 'You are not part of this conversation.' });
    }

    await Message.updateMany(
      { conversationId: conversation._id, senderId: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.status(200).json({ success: true, message: 'Conversation marked as read.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getOrCreateConversation, getMyConversations, getMessages, sendMessage, markConversationRead };
