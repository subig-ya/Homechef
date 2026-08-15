import React, { useState } from 'react';
import API from '../../../api/axios';
import Modal from '../../../components/chef/Modal';
import MealCard from '../../../components/chef/MealCard';
import { EmptyState, ErrorState } from '../../../components/chef/FeedbackStates';
import useImageUpload from '../useImageUpload';
import { Plus, Utensils, Loader2, UploadCloud } from 'lucide-react';

const getToken = () => ({ Authorization: `Bearer ${localStorage.getItem('homechef_token')}` });

const EMPTY_FORM = {
  name: '',
  cuisine: '',
  categoryId: '',
  price: '',
  description: '',
  availableQuantity: '10',
  availabilityStatus: 'AVAILABLE',
  image: ''
};

const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Nut-Free', 'Dairy-Free'];

const MealsSection = ({ dishes, categories, refresh }) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [dietary, setDietary] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [stockId, setStockId] = useState(null);
  const [stockForm, setStockForm] = useState({ availableQuantity: '0', availabilityStatus: 'AVAILABLE' });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { upload, uploading } = useImageUpload();

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDietary([]);
    setError('');
    setFormOpen(true);
  };

  const openEdit = (dish) => {
    setEditingId(dish._id);
    setForm({
      name: dish.name || '',
      cuisine: dish.cuisine || '',
      categoryId: dish.categoryId?._id || dish.categoryId || '',
      price: dish.price ?? '',
      description: dish.description || '',
      availableQuantity: dish.availableQuantity ?? '10',
      availabilityStatus: dish.availabilityStatus || 'AVAILABLE',
      image: dish.image || ''
    });
    setDietary(dish.dietary || []);
    setError('');
    setFormOpen(true);
  };

  const openStock = (dish) => {
    setStockId(dish._id);
    setStockForm({
      availableQuantity: String(dish.availableQuantity ?? 0),
      availabilityStatus: dish.availabilityStatus || 'AVAILABLE'
    });
  };

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file);
    if (url) setForm((prev) => ({ ...prev, image: url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.categoryId || !form.name || !form.cuisine || !form.price) {
      setError('Category, name, cuisine, and price are required.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      price: Number(form.price),
      availableQuantity: Number(form.availableQuantity) || 0,
      dietary
    };
    try {
      if (editingId) {
        await API.put(`/dishes/${editingId}`, payload, { headers: getToken() });
      } else {
        await API.post('/dishes', payload, { headers: getToken() });
      }
      setFormOpen(false);
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save the meal.');
    } finally {
      setSaving(false);
    }
  };

  const handleStock = async () => {
    if (!stockId) return;
    setSaving(true);
    setError('');
    try {
      await API.put(`/dishes/${stockId}`, stockForm, { headers: getToken() });
      setStockId(null);
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update stock.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    setError('');
    try {
      await API.delete(`/dishes/${confirmDelete}`, { headers: getToken() });
      setConfirmDelete(null);
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete the meal.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-[#EAD3DC] bg-white px-3.5 py-2.5 text-sm text-[#381E39] outline-none focus:border-[#E25C80] focus:ring-2 focus:ring-[#E25C80]/20';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[#76534A]">
          These are your orderable meals — the listings customers buy from the food marketplace. Your portfolio photos stay separate.
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-full bg-[#4B254B] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#391B39]"
        >
          <Plus size={14} /> Add meal
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</div>}

      {dishes.length === 0 ? (
        <EmptyState title="Your menu is empty" hint="Add your first meal so customers can order it from the marketplace." icon={Utensils} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dishes.map((dish) => (
            <MealCard key={dish._id} dish={dish} onEdit={openEdit} onDelete={(d) => setConfirmDelete(d._id)} onStock={openStock} />
          ))}
        </div>
      )}

      {/* Create / edit modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Edit meal' : 'Add a meal'}
        maxWidth="max-w-xl"
        footer={
          <>
            <button onClick={() => setFormOpen(false)} className="rounded-full border border-[#E5D1D6] px-4 py-2 text-xs font-semibold text-[#76534A] hover:bg-[#FCECEF]">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || uploading}
              className="flex items-center gap-1.5 rounded-full bg-[#4B254B] px-5 py-2 text-xs font-semibold text-white hover:bg-[#391B39] disabled:opacity-60"
            >
              {saving && <Loader2 size={12} className="animate-spin" />}
              {editingId ? 'Save changes' : 'Add meal'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#76534A]">Name</label>
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Butter chicken" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#76534A]">Cuisine</label>
              <input className={inputCls} value={form.cuisine} onChange={(e) => setForm({ ...form, cuisine: e.target.value })} placeholder="Indian" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#76534A]">Category</label>
              <select className={inputCls} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#76534A]">Price (Rs.)</label>
              <input type="number" min="0" className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="350" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#76534A]">Available quantity</label>
              <input type="number" min="0" className={inputCls} value={form.availableQuantity} onChange={(e) => setForm({ ...form, availableQuantity: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#76534A]">Availability</label>
              <select className={inputCls} value={form.availabilityStatus} onChange={(e) => setForm({ ...form, availabilityStatus: e.target.value })}>
                {['AVAILABLE', 'LIMITED', 'SOLD_OUT', 'UNAVAILABLE'].map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#76534A]">Description</label>
            <textarea className={inputCls} rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tell customers what makes this dish special…" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#76534A]">Dietary tags</label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setDietary((prev) => (prev.includes(opt) ? prev.filter((d) => d !== opt) : [...prev, opt]))}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    dietary.includes(opt) ? 'border-[#E25C80] bg-[#FDE7EF] text-[#C54567]' : 'border-[#EAD3DC] bg-white text-[#76534A]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#76534A]">Photo</label>
            {form.image && (
              <div className="mb-2 flex items-center gap-3 rounded-xl bg-[#FFF7F9] p-2">
                <img src={form.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
                <button type="button" onClick={() => setForm({ ...form, image: '' })} className="text-xs font-semibold text-red-600 hover:underline">
                  Remove photo
                </button>
              </div>
            )}
            <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#EAD3DC] bg-[#FFF9F5] px-4 py-6 text-xs font-semibold text-[#76534A] transition-colors hover:border-[#E25C80] hover:text-[#C54567]`}>
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
              {uploading ? 'Uploading…' : 'Upload a photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageFile} disabled={uploading} />
            </label>
          </div>
        </form>
      </Modal>

      {/* Stock quick-update modal */}
      <Modal open={!!stockId} onClose={() => setStockId(null)} title="Update stock">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#76534A]">Quantity</label>
              <input type="number" min="0" className={inputCls} value={stockForm.availableQuantity} onChange={(e) => setStockForm({ ...stockForm, availableQuantity: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#76534A]">Availability</label>
              <select className={inputCls} value={stockForm.availabilityStatus} onChange={(e) => setStockForm({ ...stockForm, availabilityStatus: e.target.value })}>
                {['AVAILABLE', 'LIMITED', 'SOLD_OUT', 'UNAVAILABLE'].map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</div>}
          <div className="flex justify-end gap-2">
            <button onClick={() => setStockId(null)} className="rounded-full border border-[#E5D1D6] px-4 py-2 text-xs font-semibold text-[#76534A]">Cancel</button>
            <button onClick={handleStock} disabled={saving} className="rounded-full bg-[#4B254B] px-5 py-2 text-xs font-semibold text-white hover:bg-[#391B39] disabled:opacity-60">
              Save stock
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Remove this meal?">
        <p className="text-sm text-[#76534A]">
          This removes the meal from your menu and from the marketplace. This cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setConfirmDelete(null)} className="rounded-full border border-[#E5D1D6] px-4 py-2 text-xs font-semibold text-[#76534A]">Cancel</button>
          <button onClick={handleDelete} disabled={saving} className="rounded-full bg-red-600 px-5 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60">
            {saving ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default MealsSection;
