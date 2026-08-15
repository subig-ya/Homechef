import React, { useState } from 'react';
import API from '../../../api/axios';
import StatusBadge from '../../../components/chef/StatusBadge';
import { LoadingState, EmptyState, ErrorState } from '../../../components/chef/FeedbackStates';
import { ShoppingBag, MapPin, Loader2 } from 'lucide-react';
import { formatRs, formatDateTime, formatDistance, ORDER_FLOW, ACTIVE_ORDER_STATUSES } from '../utils';

const getToken = () => ({ Authorization: `Bearer ${localStorage.getItem('homechef_token')}` });

const OrdersSection = ({ orders, refresh }) => {
  const [tab, setTab] = useState('active');
  const [expandedId, setExpandedId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const filtered = orders.filter((o) => {
    if (tab === 'active') return ACTIVE_ORDER_STATUSES.includes(o.status);
    if (tab === 'past') return ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(o.status);
    return true;
  });

  const updateStatus = async (order, to) => {
    setBusyId(`${order._id}:${to}`);
    setError('');
    try {
      await API.put(`/orders/${order._id}/status`, { status: to }, { headers: getToken() });
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update order.');
    } finally {
      setBusyId(null);
    }
  };

  const tabs = [
    { id: 'active', label: 'Active' },
    { id: 'past', label: 'Completed / Cancelled' },
    { id: 'all', label: 'All' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              tab === t.id ? 'bg-[#4B254B] text-white' : 'bg-white text-[#76534A] border border-[#F0DCE4] hover:bg-[#FCECEF]'
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-[#A98990]">{filtered.length} order{filtered.length === 1 ? '' : 's'}</span>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</div>}

      {filtered.length === 0 ? (
        <EmptyState title="No orders here" hint="New meal orders from customers will show up in this list." icon={ShoppingBag} />
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const isOpen = expandedId === order._id;
            const flow = ORDER_FLOW[order.status] || [];
            return (
              <div key={order._id} className="overflow-hidden rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] shadow-sm">
                <div
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 cursor-pointer hover:bg-[#FFF7F9]"
                  onClick={() => setExpandedId(isOpen ? null : order._id)}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FDE7EF] text-[#C45B7C]">
                      <ShoppingBag size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#381E39]">
                        {order.customerId?.name || 'Customer'}
                        <span className="ml-2 text-xs font-normal text-[#A98990]">{formatDateTime(order.createdAt)}</span>
                      </p>
                      <p className="truncate text-xs text-[#76534A]">
                        {order.items?.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-bold text-[#563124]">{formatRs(order.totalAmount)}</span>
                    <StatusBadge status={order.status} paymentStatus={order.paymentStatus} />
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-[#F3E3E8] bg-[#FFF9F5] px-4 py-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-[#A98990]">Delivery to</p>
                        <p className="mt-1 text-sm text-[#381E39]">
                          {order.customerId?.name}
                          {order.customerId?.location?.address ? ` — ${order.customerId.location.address}` : ''}
                        </p>
                        {order.distanceKm != null && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-[#76534A]">
                            <MapPin size={12} className="text-[#C45B7C]" /> {formatDistance(order.distanceKm)} away
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-[#A98990]">Items</p>
                        <ul className="mt-1 space-y-1">
                          {order.items?.map((item, idx) => (
                            <li key={idx} className="flex justify-between text-sm text-[#381E39]">
                              <span>{item.name} × {item.quantity}</span>
                              <span className="font-semibold">{formatRs(item.price * item.quantity)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-[#A98990]">Total</p>
                        <p className="mt-1 font-display text-lg font-bold text-[#381E39]">{formatRs(order.totalAmount)}</p>
                        <p className="text-xs text-[#76534A]">Payment: {order.paymentStatus}</p>
                      </div>
                    </div>

                    {flow.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-[#F3E3E8] pt-3">
                        {flow.map((action) => (
                          <button
                            key={action.to}
                            disabled={busyId === `${order._id}:${action.to}`}
                            onClick={() => updateStatus(order, action.to)}
                            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
                              action.secondary
                                ? 'border border-[#E5D1D6] bg-white text-[#76534A] hover:bg-red-50 hover:text-red-600'
                                : 'bg-[#4B254B] text-white hover:bg-[#391B39]'
                            }`}
                          >
                            {busyId === `${order._id}:${action.to}` && <Loader2 size={12} className="animate-spin" />}
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersSection;
