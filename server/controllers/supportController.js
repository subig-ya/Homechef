const SupportTicket = require('../models/SupportTicket');

const CATEGORIES = ['ACCOUNT', 'PAYMENTS', 'ORDERS', 'BOOKINGS', 'TECHNICAL', 'OTHER'];
const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

/**
 * POST /api/support — a chef files a support ticket / complaint. It lands in
 * the admin support queue.
 */
const createTicket = async (req, res, next) => {
  try {
    const { subject, message, category } = req.body;

    if (typeof subject !== 'string' || subject.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Please give your issue a short subject (at least 5 characters).'
      });
    }

    if (typeof message !== 'string' || message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please describe your issue in at least 10 characters.'
      });
    }

    const ticketCategory = CATEGORIES.includes(category) ? category : 'OTHER';

    const ticket = await SupportTicket.create({
      chefId: req.user._id,
      subject: String(subject).trim(),
      message: String(message).trim(),
      category: ticketCategory
    });

    res.status(201).json({
      success: true,
      message: 'Your issue has been submitted. The HomeChef team will review it and update you here.',
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/support/me — the logged-in chef's own tickets, newest first.
 */
const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ chefId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: tickets.length,
      message: 'Your support tickets fetched successfully',
      data: tickets
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/support — all tickets, newest first. Optional ?status= filter.
 */
const getAllTickets = async (req, res, next) => {
  try {
    const { status } = req.query;

    const query = {};
    if (STATUSES.includes(status)) {
      query.status = status;
    }

    const tickets = await SupportTicket.find(query)
      .populate('chefId', 'name email profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      message: 'Support tickets fetched successfully',
      data: tickets
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/support/:id — update status and/or add an admin note/response.
 */
const updateTicketStatus = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;

    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be one of OPEN, IN_PROGRESS, RESOLVED, or CLOSED.'
      });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found.'
      });
    }

    if (status) ticket.status = status;
    if (typeof adminNote === 'string') ticket.adminNote = adminNote.trim().slice(0, 2000);
    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Ticket updated.',
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTicket, getMyTickets, getAllTickets, updateTicketStatus };
