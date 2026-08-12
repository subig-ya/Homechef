import React, { useEffect, useState } from 'react';
import API from '../api/axios';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ chefId: '', items: [{ name: '', quantity: '1', price: '0' }], totalAmount: '0' });

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
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (index, key, value) => {
    const updatedItems = [...form.items];
    updatedItems[index][key] = value;
    setForm({ ...form, items: updatedItems });
  };

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { name: '', quantity: '1', price: '0' }] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    const token = localStorage.getItem('homechef_token');
    try {
      const payload = {
        chefId: form.chefId,
        items: form.items.map((item) => ({ ...item, quantity: Number(item.quantity), price: Number(item.price) })),
        totalAmount: Number(form.totalAmount)
      };
      const response = await API.post('/orders', payload, { headers: { Authorization: `Bearer ${token}` } });
      setMessage(response.data.message || 'Order created successfully');
      setForm({ chefId: '', items: [{ name: '', quantity: '1', price: '0' }], totalAmount: '0' });
      await fetchOrders();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to create order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">My orders</h2>
        <p className="mt-2 text-sm text-slate-600">Place and track homemade food orders.</p>
        {message && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{message}</div>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Chef ID</label>
            <input value={form.chefId} onChange={(e) => setForm({ ...form, chefId: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Chef profile id" required />
          </div>
          {form.items.map((item, index) => (
            <div key={index} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
              <input value={item.name} onChange={(e) => updateItem(index, 'name', e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Dish name" required />
              <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Quantity" required />
              <input type="number" min="0" value={item.price} onChange={(e) => updateItem(index, 'price', e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Price" required />
            </div>
          ))}
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={addItem} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Add item</button>
            <div className="flex-1 min-w-[220px]">
              <label className="mb-1 block text-sm font-semibold text-slate-700">Total amount</label>
              <input type="number" min="0" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
            </div>
            <button type="submit" disabled={submitting} className="rounded-xl bg-amber-600 px-4 py-2.5 font-semibold text-white hover:bg-amber-700 disabled:opacity-60">{submitting ? 'Placing...' : 'Place order'}</button>
          </div>
        </form>

        {loading ? <p className="mt-6 text-slate-600">Loading orders...</p> : orders.length === 0 ? <p className="mt-6 text-slate-600">No orders yet.</p> : <div className="mt-6 space-y-3">{orders.map((order) => <div key={order._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-slate-900">Status: {order.status}</p><p className="text-sm text-slate-600">Items: {order.items?.length || 0} • Total: Rs. {order.totalAmount}</p></div></div></div>)}</div>}
      </div>
    </div>
  );
};

export default OrdersPage;
