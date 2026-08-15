const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getAdminUsers,
  banUser,
  unbanUser,
  getAdminChefs,
  getAdminChefById,
  banChef,
  unbanChef,
  removeChef
} = require('../controllers/adminController');
const { getReports, updateReportStatus } = require('../controllers/reportController');
const { getAllTickets, updateTicketStatus } = require('../controllers/supportController');
const { protect, admin } = require('../middleware/auth');

router.get('/dashboard', protect, admin, getAdminDashboard);

// User management (customers, chefs, admins)
router.get('/users', protect, admin, getAdminUsers);
router.put('/users/:id/ban', protect, admin, banUser);
router.put('/users/:id/unban', protect, admin, unbanUser);

// Chef management & activity
router.get('/chefs', protect, admin, getAdminChefs);
router.get('/chefs/:id', protect, admin, getAdminChefById);
router.put('/chefs/:id/ban', protect, admin, banChef);
router.put('/chefs/:id/unban', protect, admin, unbanChef);
router.delete('/chefs/:id', protect, admin, removeChef);

// Reports queue
router.get('/reports', protect, admin, getReports);
router.put('/reports/:id', protect, admin, updateReportStatus);

// Chef support-ticket queue
router.get('/support', protect, admin, getAllTickets);
router.put('/support/:id', protect, admin, updateTicketStatus);

module.exports = router;
