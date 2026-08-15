import React, { useState } from 'react';
import API from '../../../api/axios';
import { ShoppingBag, XCircle, Loader2, Clock } from 'lucide-react';

const STATUS_STYLES = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  ACCEPTED: 'border-[#E25C80]/20 bg-[#E25C80]/5 text-[#C54567]',
  PREPARING: 'border-sky-200 bg-sky-50 text-sky-700',
  PAYMENT_PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  PAID: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  READY: 'border-sky-200 bg-sky-50 text-sky-700',
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  REJECTED: 'border-red-200 bg-red-50 text-red-700',
  CANCELLED: 'border-slate-200 bg-slate-100 text-slate-500',
  EXPIRED: 'border-slate-200 bg-slate-100 text-slate-500'
};

const formatDateTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const OrdersSection = ({ orders, refresh }) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

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
    setCancellingId(order._id);
    const token = localStorage.getItem('homechef_token');
    try {
      const res = await API.post(
        `/orders/${order._id}/cancel`,
        { reason: 'Cancelled by customer' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message || 'Order cancelled.');
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to cancel this order.');
    } finally {
      setCancellingId(null);
    }
  };

  const cancellable = (status) => ['PENDING', 'ACCEPTED', 'PREPARING'].includes(status);

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-start gap-3 rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] px-5 py-4 shadow-sm">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FDE7EF] text-[#C45B7C]">
          <ShoppingBag className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-display text-base font-semibold text-[#381E39]">My meal orders</h3>
          <p className="mt-0.5 text-sm text-[#76534A]">Track every homemade meal you have ordered.</p>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</div>
      )}

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#EAD3DC] bg-[#FFF9F5] px-6 py-14 text-center">
          <ShoppingBag className="h-8 w-8 text-[#C45B7C]" />
          <p className="font-display text-base font-semibold text-[#381E39]">No orders yet</p>
          <p className="max-w-sm text-sm text-[#76534A]">
            Order a homemade dish from the marketplace and follow it here, from request to delivery.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const status = STATUS_STYLES[order.status] || 'border-slate-200 bg-slate-100 text-slate-600';
            const requestLine = [
              order.deliveryType === 'DELIVERY' ? 'Delivery' : 'Pickup',
              order.requestedTime ? `for ${formatDateTime(order.requestedTime)}` : 'ASAP'
            ].filter(Boolean).join(' · ');
            return (
              <div key={order._id} className="rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-xs font-bold text-[#76534A]">#{order._id?.slice(-6)}</p>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${status}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-[#381E39]">
                      {order.items?.map((i) => `${i.name} × ${i.quantity}`).join(', ')}
                      <span className="font-normal text-[#76534A]"> — Rs. {order.totalAmount}</span>
                    </p>
                    <p className="mt-1 text-xs text-[#76534A]">
                      {order.sellerId?.name || 'Local kitchen'} · {requestLine} · {formatDateTime(order.createdAt)}
                    </p>
                    {order.status === 'PENDING' && order.expiresAt ? (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                        <Clock className="h-3 w-3" /> Chef must respond by {formatDateTime(order.expiresAt)}
                      </p>
                    ) : null}
                    {order.cancellation?.refundType && order.cancellation.refundType !== 'NONE' ? (
                      <p className="mt-1.5 text-[11px] font-semibold text-emerald-700">
                        Refund released: {order.cancellation.refundType} — Rs. {order.cancellation.refundAmount}
                      </p>
                    ) : null}
                  </div>

                  {cancellable(order.status) && (
                    <button
                      type="button"
                      onClick={() => handleCancel(order)}
                      disabled={cancellingId === order._id}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                    >
                      {cancellingId === order._id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersSection;
