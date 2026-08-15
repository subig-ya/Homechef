const Order = require('../models/Order');
const Dish = require('../models/Dish');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const { calculateHaversineDistance } = require('./dishController');
const { computeExpiry } = require('../utils/responseWindow');

// Hard ceiling on unanswered requests a chef may carry at once. Beyond this the
// chef is clearly not coping with volume, so new requests are turned away until
// the queue drains — a blunt, self-cleaning version of a chronic no-response cap.
const MAX_ACTIVE_REQUESTS_PER_CHEF = 10;

/**
 * POST /api/orders
 * A connection always starts as a structured request: the dish(es), quantity,
 * requested time, and delivery-or-pickup are recorded as the single source of
 * truth. Prices come from the live listings, never from the client. The chef
 * then has a response window to accept or decline before the request expires.
 */
const createOrder = async (req, res, next) => {
  try {
    const { items, requestedTime, deliveryType } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required.' });
    }

    const deliveryMode = deliveryType === 'DELIVERY' ? 'DELIVERY' : 'PICKUP';

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

    // Don't pile more work onto a chef who already has a backlog of
    // unanswered requests.
    const activeRequestCount = await Order.countDocuments({
      sellerId,
      status: { $in: ['PENDING', 'ACCEPTED', 'PREPARING'] }
    });
    if (activeRequestCount >= MAX_ACTIVE_REQUESTS_PER_CHEF) {
      return res.status(409).json({
        success: false,
        message: 'This chef has too many active requests right now. Please try again later or choose another chef.'
      });
    }

    const parsedRequestedTime = requestedTime ? new Date(requestedTime) : null;
    const order = await Order.create({
      customerId: req.user._id,
      sellerId,
      items: resolvedItems,
      totalAmount,
      requestedTime: parsedRequestedTime && !Number.isNaN(parsedRequestedTime.getTime()) ? parsedRequestedTime : null,
      deliveryType: deliveryMode,
      expiresAt: computeExpiry(parsedRequestedTime),
      status: 'PENDING',
      paymentStatus: 'UNPAID'
    });

    // Feed the chef's reliability counters so the no-response rate is real.
    await User.findByIdAndUpdate(sellerId, { $inc: { totalRequestsReceived: 1 } });

    await Notification.create({
      userId: req.user._id,
      title: 'Request sent',
      message: `Your request for ${resolvedItems.length} item${resolvedItems.length > 1 ? 's' : ''} (${deliveryMode.toLowerCase()}) was sent. The chef has until ${order.expiresAt.toLocaleTimeString()} to respond.`,
      type: 'ORDER'
    });

    await Notification.create({
      recipient: sellerId,
      title: 'New meal request',
      message: `New ${deliveryMode.toLowerCase()} request from ${req.user.name} for ${resolvedItems.length} item${resolvedItems.length > 1 ? 's' : ''} — respond before it expires.`,
      type: 'ORDER'
    });

    res.status(201).json({ success: true, message: 'Order request created successfully', data: order });
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

// Chef answers a request: accept / reject / set it into the cooking flow.
const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, sellerId: req.user._id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or you do not own it.' });
    }

    const { status } = req.body;
    const allowedStatuses = ['ACCEPTED', 'PREPARING', 'PAYMENT_PENDING', 'PAID', 'READY', 'COMPLETED', 'REJECTED', 'CANCELLED'];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowedStatuses.join(', ')}` });
    }

    if (order.status === 'EXPIRED') {
      return res.status(409).json({ success: false, message: 'This request already expired and can no longer be answered.' });
    }

    // A decision resets the response window — the chef answered in time.
    order.status = status;
    if (status === 'ACCEPTED' || status === 'REJECTED') {
      order.expiresAt = null;
    }
    await order.save();

    const notifyCustomerStatuses = ['ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'REJECTED', 'CANCELLED'];
    if (notifyCustomerStatuses.includes(status)) {
      const label = {
        ACCEPTED: 'accepted — they will start prepping',
        PREPARING: 'being prepared',
        READY: 'ready',
        COMPLETED: 'completed',
        REJECTED: 'declined',
        CANCELLED: 'cancelled'
      }[status];
      await Notification.create({
        recipient: order.customerId,
        title: 'Order status update',
        message: `Your request of ${order.items.length} item${order.items.length > 1 ? 's' : ''} was ${label}.`,
        type: 'ORDER'
      });
    }

    res.status(200).json({ success: true, message: 'Order updated successfully', data: order });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/:id/cancel
 * Asymmetric cancellation + refund rules:
 *   - Customer cancels before the chef accepts  → FULL refund (nothing lost).
 *   - Customer cancels after the chef accepted/prepping → PARTIAL refund
 *     (chef already committed time/ingredients).
 *   - Customer cancels once the food is READY/COMPLETED → not allowed directly.
 *   - Chef cancels → FULL refund and a ding to their reliability score.
 * Any live (PENDING/PAID) payment records for the order are cancelled/released.
 */
const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const isCustomer = order.customerId.toString() === req.user._id.toString();
    const isChef = order.sellerId.toString() === req.user._id.toString();

    if (!isCustomer && !isChef) {
      return res.status(403).json({ success: false, message: 'You cannot cancel this order.' });
    }

    const terminal = ['COMPLETED', 'CANCELLED', 'EXPIRED'];
    if (terminal.includes(order.status)) {
      return res.status(400).json({ success: false, message: `This order is already ${order.status.toLowerCase()} and cannot be cancelled.` });
    }

    // Decide the refund based on who cancels and how far the order progressed.
    let refundType = 'NONE';
    let refundAmount = 0;
    let cancelledBy;

    if (isChef) {
      cancelledBy = 'CHEF';
      refundType = 'FULL';
      refundAmount = order.totalAmount;
      await User.findByIdAndUpdate(order.sellerId, { $inc: { chefCancellations: 1 } });
    } else {
      cancelledBy = 'CUSTOMER';
      if (['ACCEPTED', 'PREPARING'].includes(order.status)) {
        // Chef has already committed — the customer keeps a small part.
        refundType = 'PARTIAL';
        refundAmount = Number((order.totalAmount * 0.7).toFixed(2));
      } else {
        refundType = 'FULL';
        refundAmount = order.totalAmount;
      }
      if (['READY', 'PAID'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'The chef has already prepared this order. Please contact the chef directly about cancellations.'
        });
      }
    }

    order.status = 'CANCELLED';
    order.paymentStatus = 'CANCELLED';
    order.expiresAt = null;
    order.cancellation = {
      reason: String(reason || '').slice(0, 300),
      cancelledBy,
      refundType,
      refundAmount,
      cancelledAt: new Date()
    };
    await order.save();

    // Release any live payment record so nothing is (or stays) captured.
    await Payment.updateMany(
      { orderId: order._id, status: { $in: ['PENDING', 'PAID'] } },
      {
        $set: {
          status: 'CANCELLED',
          paymentResponse: {
            released: true,
            refundType,
            refundAmount,
            message: `Payment released after ${cancelledBy === 'CHEF' ? 'chef' : 'customer'} cancellation.`
          }
        }
      }
    );

    const refundLabel =
      refundType === 'FULL'
        ? 'A full refund has been released.'
        : refundType === 'PARTIAL'
          ? `A partial refund of ${refundAmount} has been released.`
          : 'No refund applies.';

    await Notification.create({
      recipient: isCustomer ? order.sellerId : order.customerId,
      title: 'Order cancelled',
      message: `${req.user.name} cancelled ${isCustomer ? 'their' : 'your'} order. ${refundLabel}`,
      type: 'ORDER'
    });

    res.status(200).json({
      success: true,
      message: 'Order cancelled.',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sweeper: mark PENDING requests whose response window lapsed as EXPIRED.
 * Called on an interval by the server. Also notifies the customer (with a nudge
 * toward similar chefs) and the chef, and records the miss on the chef's
 * no-response counter.
 */
const expireStaleOrders = async () => {
  const now = new Date();
  const stale = await Order.find({ status: 'PENDING', expiresAt: { $lte: now } });

  for (const order of stale) {
    order.status = 'EXPIRED';
    order.paymentStatus = 'UNPAID';
    await order.save();

    await User.findByIdAndUpdate(order.sellerId, { $inc: { expiredRequests: 1 } });

    await Notification.create({
      recipient: order.customerId,
      title: 'Request expired — no response',
      message: `The chef did not respond to your request before it expired. Try requesting again, or browse similar chefs nearby.`,
      type: 'ORDER'
    });

    await Notification.create({
      recipient: order.sellerId,
      title: 'Request expired',
      message: `A request from a customer expired because you did not respond in time. Responding faster improves your ranking.`,
      type: 'ORDER'
    });
  }

  return stale.length;
};

module.exports = {
  createOrder,
  getMyOrders,
  getSellerOrders,
  updateOrderStatus,
  cancelOrder,
  expireStaleOrders
};
