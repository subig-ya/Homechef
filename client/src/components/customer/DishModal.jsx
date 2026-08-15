import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { X, Star, CheckCircle, Clock } from 'lucide-react';

const FALLBACK_DISH_IMAGE = 'https://images.unsplash.com/photo-1621996346565-e3def616404c?w=800';

const DishModal = ({ dish, onClose, onOrdered }) => {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState('1');
  const [deliveryType, setDeliveryType] = useState('PICKUP');
  const [requestedTime, setRequestedTime] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleOrder = async () => {
    setError('');
    const token = localStorage.getItem('homechef_token');
    if (!token) {
      navigate('/login', { state: { from: '/dashboard' } });
      return;
    }

    setOrdering(true);
    try {
      const qty = Math.max(1, Number(quantity) || 1);
      const response = await API.post(
        '/orders',
        {
          items: [{ dishId: dish._id, quantity: qty }],
          deliveryType,
          requestedTime: requestedTime ? new Date(requestedTime).toISOString() : undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const created = response.data.data;
      const respondsBy = created?.expiresAt
        ? new Date(created.expiresAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
        : '';
      setSuccess(
        `Order request sent!${respondsBy ? ` The chef has until ${respondsBy} to respond.` : ''} Track it from My Orders.`
      );
      if (onOrdered) onOrdered('Order request sent to the chef!');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to place your order. Please try again.');
    } finally {
      setOrdering(false);
    }
  };

  const total = Math.max(1, Number(quantity) || 1) * Number(dish.price || 0);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#381E39]/50 p-4 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[#FFFDFC] shadow-2xl">
        {/* Header image */}
        <div className="relative h-52 bg-[#FAF4F7]">
          <img src={dish.image || FALLBACK_DISH_IMAGE} alt={dish.name} className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#76534A] shadow-sm transition-colors hover:text-[#C45B7C]"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-[#381E39] shadow-sm">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>{Number(dish.rating || 0).toFixed(1)}</span>
            <span className="font-normal text-[#A98990]">({dish.reviewCount || 0})</span>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-bold text-[#381E39]">{dish.name}</h3>
              <p className="mt-0.5 text-xs text-[#76534A]">
                By {dish.sellerId?.name || 'Local kitchen'}
                {dish.cuisine ? ` · ${dish.cuisine}` : ''}
              </p>
            </div>
            <span className="shrink-0 text-xl font-extrabold text-[#4B254B]">Rs. {dish.price}</span>
          </div>

          {dish.description && <p className="text-sm leading-relaxed text-[#76534A]">{dish.description}</p>}

          {dish.dietary?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {dish.dietary.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-emerald-200/70 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {success ? (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          ) : (
            <div className="space-y-3 border-t border-[#F0DCE4] pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#76534A]">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#EAD3DC] bg-white px-3 py-2 text-sm text-[#381E39] outline-none focus:border-[#E25C80] focus:ring-2 focus:ring-[#E25C80]/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#76534A]">Get it</label>
                  <div className="mt-1 grid grid-cols-2 gap-1.5">
                    {['PICKUP', 'DELIVERY'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setDeliveryType(mode)}
                        className={`rounded-lg border px-2 py-1.5 text-xs font-bold transition-colors ${
                          deliveryType === mode
                            ? 'border-[#4B254B] bg-[#4B254B] text-white'
                            : 'border-[#EAD3DC] bg-white text-[#76534A] hover:border-[#D8B5C0]'
                        }`}
                      >
                        {mode === 'PICKUP' ? 'Pickup' : 'Delivery'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#76534A]">
                  Requested time (optional)
                </label>
                <input
                  type="datetime-local"
                  value={requestedTime}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setRequestedTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#EAD3DC] bg-white px-3 py-2 text-sm text-[#381E39] outline-none focus:border-[#E25C80] focus:ring-2 focus:ring-[#E25C80]/20"
                />
                <p className="mt-1 flex items-center gap-1 text-[10px] text-[#A98990]">
                  <Clock className="h-3 w-3" /> Leave empty for "as soon as possible".
                </p>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleOrder}
                disabled={ordering}
                className="w-full rounded-xl bg-[#4B254B] py-3 text-sm font-bold text-white transition-colors hover:bg-[#391B39] disabled:opacity-60"
              >
                {ordering ? 'Sending request…' : `Order now · Rs. ${total.toLocaleString()}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DishModal;
