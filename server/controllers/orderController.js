const Order = require('../models/Order');
const Dish = require('../models/Dish');
const Notification = require('../models/Notification');

const createOrder = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required.' });
    }

    // Resolve each item against the listed food so the seller and price are
    // taken from the real listing, never from unvalidated client input.
    let totalAmount = 0;
    const resolvedItems = [];

    for (const item of items) {
      const dish = await Dish.findById(item.dishId);
      if (!dish) {
        return res.status(400).json({ success: false, message: `Listing not found: ${item.name || item.dishId}` });
      }
      const quantity = Number(item.quantity) || 1;
      const lineTotal = dish.price * quantity;
      totalAmount += lineTotal;
      resolvedItems.push({
        dishId: dish._id,
        name: dish.name,
        quantity,
        price: dish.price
      });
    }

    // The seller is the User who owns the listing — same account can buy and sell.
    const sellerId = (await Dish.findById(resolvedItems[0].dishId)).sellerId;

    const order = await Order.create({
      customerId: req.user._id,
      sellerId,
      items: resolvedItems,
      totalAmount
    });

    await Notification.create({
      userId: req.user._id,
      title: 'Order placed',
      message: `Your order for ${resolvedItems.length} item${resolvedItems.length > 1 ? 's' : ''} is being prepared.`,
      type: 'ORDER'
    });

    res.status(201).json({ success: true, message: 'Order created successfully', data: order });
  } catch (error) {
    next(error);
  }
};

// Orders the current user placed as a customer.
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customerId: req.user._id })
      .populate('sellerId', 'name location latitude longitude')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: 'Orders fetched successfully', data: orders });
  } catch (error) {
    next(error);
  }
};

// Orders received by the current user as a seller.
const getSellerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ sellerId: req.user._id })
      .populate('customerId', 'name location')
      .populate('sellerId', 'name location')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: 'Orders fetched successfully', data: orders });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, sellerId: req.user._id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or you do not own it.' });
    }

    const { status } = req.body;
    const allowedStatuses = ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'PAID', 'READY', 'COMPLETED', 'REJECTED', 'CANCELLED'];
    if (status && allowedStatuses.includes(status)) {
      order.status = status;
      await order.save();
    }

    res.status(200).json({ success: true, message: 'Order updated successfully', data: order });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, getMyOrders, getSellerOrders, updateOrderStatus };
