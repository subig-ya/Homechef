import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

const ORDER_STATUS = {
  PENDING: { label: 'Pending', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  ACCEPTED: { label: 'Accepted', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  PREPARING: { label: 'Preparing', cls: 'text-sky-700 bg-sky-50 border-sky-200' },
  PAYMENT_PENDING: { label: 'Payment Pending', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  PAID: { label: 'Paid', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  READY: { label: 'Ready', cls: 'text-sky-700 bg-sky-50 border-sky-200' },
  COMPLETED: { label: 'Completed', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  REJECTED: { label: 'Rejected', cls: 'text-red-700 bg-red-50 border-red-200' },
  CANCELLED: { label: 'Cancelled', cls: 'text-slate-500 bg-slate-100 border-slate-200' },
  EXPIRED: { label: 'Expired', cls: 'text-slate-500 bg-slate-100 border-slate-200' }
};

const formatDateTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const token = localStorage.getItem('homechef_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await API.get('/orders/my', { headers: { Authorization: `Bearer ${token}` } });
      setOrders(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (order) => {
    const refundHint =
      order.status === 'PENDING'
        ? 'You will receive a full refund.'
        : order.status === 'ACCEPTED' || order.status === 'PREPARING'
          ? 'A partial refund applies.'
          : 'Contact the chef about this cancellation.';
    if (!window.confirm(`Cancel this order? ${refundHint}`)) return;
    setMessage('');
    setError('');
    const token = localStorage.getItem('homechef_token');
    try {
      const response = await API.post(
        `/orders/${order._id}/cancel`,
        { reason: 'Cancelled by customer' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(response.data.message || 'Order cancelled');
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to cancel this order');
    }
  };

  const cancellable = (status) => ['PENDING', 'ACCEPTED', 'PREPARING'].includes(status);

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">My orders</h2>
        <p className="mt-2 text-sm text-slate-600">
          Track your meal requests. Order a dish from the marketplace, then follow it here.
        </p>
        {message && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>}
        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <p className="mt-6 text-slate-600">Loading orders...</p>
        ) : !localStorage.getItem('homechef_token') ? (
          <p className="mt-6 text-sm text-slate-600">
            <Link to="/login" className="font-bold text-[#4B254B] hover:underline">Log in</Link> to see your orders.
          </p>
        ) : orders.length === 0 ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-10 text-center">
            <p className="text-sm font-semibold text-slate-700">No orders yet.</p>
            <Link to="/food" className="mt-2 inline-block text-sm font-bold text-[#4B254B] hover:underline">
              Browse the marketplace
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {orders.map((order) => {
              const status = ORDER_STATUS[order.status] || { label: order.status, cls: 'text-slate-600 bg-slate-50' };
              const requestLine = [
                order.deliveryType === 'DELIVERY' ? 'Delivery' : 'Pickup',
                order.requestedTime ? `for ${formatDateTime(order.requestedTime)}` : 'ASAP'
              ].filter(Boolean).join(' · ');
              return (
                <div key={order._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">#{order._id?.slice(-6)}</p>
                        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${status.cls}`}>{status.label}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {order.items?.map((i) => `${i.name} × ${i.quantity}`).join(', ')} — Rs. {order.totalAmount}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {order.sellerId?.name || 'Local Kitchen'} · {requestLine} · {formatDateTime(order.createdAt)}
                      </p>
                      {order.expiresAt && order.status === 'PENDING' && (
                        <p className="mt-1 text-xs font-semibold text-amber-700">
                          Chef must respond by {formatDateTime(order.expiresAt)}
                        </p>
                      )}
                      {order.cancellation?.refundType && order.cancellation.refundType !== 'NONE' && (
                        <p className="mt-1 text-xs font-semibold text-emerald-700">
                          Refund released: {order.cancellation.refundType} — Rs. {order.cancellation.refundAmount}
                        </p>
                      )}
                    </div>
                    {cancellable(order.status) && (
                      <button
                        onClick={() => handleCancel(order)}
                        className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                      >
                        Cancel order
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
