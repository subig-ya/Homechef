const Order = require('../models/Order');
const Dish = require('../models/Dish');
const Notification = require('../models/Notification');
const { calculateHaversineDistance } = require('./dishController');

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

    // Tell the seller a new order just landed in their kitchen.
    await Notification.create({
      recipient: sellerId,
      title: 'New meal order',
      message: `New order from ${req.user.name} for ${resolvedItems.length} item${resolvedItems.length > 1 ? 's' : ''}.`,
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

    const chefLat = Number(req.user.location?.latitude ?? req.user.latitude ?? 0);
    const chefLon = Number(req.user.location?.longitude ?? req.user.longitude ?? 0);

    // Attach a backend-computed delivery distance and strip the customer's
    // exact coordinates from the payload before it reaches the chef UI.
    const data = orders.map((order) => {
      const plain = order.toObject();
      const customer = plain.customerId;
      let distanceKm = null;

      if (customer?.location) {
        const cLat = Number(customer.location.latitude) || 0;
        const cLon = Number(customer.location.longitude) || 0;
        if (cLat && cLon && (chefLat || chefLon)) {
          distanceKm = calculateHaversineDistance(chefLat, chefLon, cLat, cLon);
        }
        customer.location = { address: customer.location.address || '' };
      }

      plain.distanceKm = distanceKm;
      return plain;
    });

    res.status(200).json({ success: true, message: 'Orders fetched successfully', data });
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
    const allowedStatuses = ['PENDING', 'ACCEPTED', 'PREPARING', 'PAYMENT_PENDING', 'PAID', 'READY', 'COMPLETED', 'REJECTED', 'CANCELLED'];
    if (status && allowedStatuses.includes(status)) {
      order.status = status;
      await order.save();

      // Keep the customer in the loop on the meaningful transitions.
      const notifyCustomerStatuses = ['ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'REJECTED', 'CANCELLED'];
      if (notifyCustomerStatuses.includes(status)) {
        const label = {
          ACCEPTED: 'accepted',
          PREPARING: 'being prepared',
          READY: 'ready',
          COMPLETED: 'completed',
          REJECTED: 'rejected',
          CANCELLED: 'cancelled'
        }[status];
        await Notification.create({
          recipient: order.customerId,
          title: 'Order status update',
          message: `Your order of ${order.items.length} item${order.items.length > 1 ? 's' : ''} is now ${label}.`,
          type: 'ORDER'
        });
      }
    }

    res.status(200).json({ success: true, message: 'Order updated successfully', data: order });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, getMyOrders, getSellerOrders, updateOrderStatus };
