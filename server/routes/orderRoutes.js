const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getSellerOrders, updateOrderStatus, cancelOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/seller', protect, getSellerOrders);
router.put('/:id/status', protect, updateOrderStatus);
router.post('/:id/cancel', protect, cancelOrder);

module.exports = router;
