import React, { useState } from 'react';
import API from '../../../api/axios';
import Modal from '../../../components/chef/Modal';
import { EmptyState } from '../../../components/chef/FeedbackStates';
import useImageUpload from '../useImageUpload';
import { Plus, Camera, Loader2, Trash2, UploadCloud } from 'lucide-react';

const getToken = () => ({ Authorization: `Bearer ${localStorage.getItem('homechef_token')}` });

const PortfolioSection = ({ user, refresh }) => {
  const portfolio = user?.portfolio || [];
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ image: '', title: '', caption: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const { upload, uploading } = useImageUpload();

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file);
    if (url) setForm((prev) => ({ ...prev, image: url }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.image) {
      setError('Please add a photo first.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await API.post('/chefs/me/portfolio', form, { headers: getToken() });
      setFormOpen(false);
      setForm({ image: '', title: '', caption: '' });
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to add the photo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId) => {
    setDeletingId(itemId);
    setError('');
    try {
      await API.delete(`/chefs/me/portfolio/${itemId}`, { headers: getToken() });
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to remove the photo.');
    } finally {
      setDeletingId(null);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-[#EAD3DC] bg-white px-3.5 py-2.5 text-sm text-[#381E39] outline-none focus:border-[#E25C80] focus:ring-2 focus:ring-[#E25C80]/20';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[#76534A]">
          Show customers your best work — plated dishes, dinner tables, and cooking moments. These do not become orderable meals.
        </p>
        <button
          onClick={() => { setFormOpen(true); setError(''); }}
          className="flex items-center gap-1.5 rounded-full bg-[#4B254B] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#391B39]"
        >
          <Plus size={14} /> Add photo
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</div>}

      {portfolio.length === 0 ? (
        <EmptyState title="No portfolio photos yet" hint="Add a photo of a dish or a table you cooked for." icon={Camera} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {portfolio.map((item, idx) => (
            <div key={item._id || idx} className="group overflow-hidden rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] shadow-sm">
              <div className="relative h-44 overflow-hidden bg-[#FDE7EF]">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="font-cursive text-2xl text-[#C45B7C]/50">HomeChef</span>
                  </div>
                )}
                <button
                  onClick={() => handleDelete(item._id)}
                  disabled={deletingId === item._id}
                  aria-label="Remove photo"
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-sm transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === item._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
              <div className="p-4">
                <h4 className="truncate font-display text-sm font-semibold text-[#381E39]">{item.title || 'Untitled'}</h4>
                {item.caption && <p className="mt-1 line-clamp-2 text-xs text-[#76534A]">{item.caption}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Add a portfolio photo">
        <form onSubmit={handleAdd} className="space-y-4">
          {form.image ? (
            <div className="overflow-hidden rounded-xl border border-[#F0DCE4]">
              <img src={form.image} alt="" className="h-48 w-full object-cover" />
              <button type="button" onClick={() => setForm({ ...form, image: '' })} className="w-full bg-[#FFF7F9] py-2 text-xs font-semibold text-red-600 hover:underline">
                Choose a different photo
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#EAD3DC] bg-[#FFF9F5] px-4 py-10 text-xs font-semibold text-[#76534A] transition-colors hover:border-[#E25C80] hover:text-[#C54567]">
              {uploading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={22} />}
              {uploading ? 'Uploading…' : 'Click to upload a photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageFile} disabled={uploading} />
            </label>
          )}

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#76534A]">Title</label>
            <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Signature biryani" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#76534A]">Caption</label>
            <textarea className={inputCls} rows="2" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} placeholder="A little story about this dish…" />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-full border border-[#E5D1D6] px-4 py-2 text-xs font-semibold text-[#76534A] hover:bg-[#FCECEF]">
              Cancel
            </button>
            <button type="submit" disabled={saving || uploading} className="flex items-center gap-1.5 rounded-full bg-[#4B254B] px-5 py-2 text-xs font-semibold text-white hover:bg-[#391B39] disabled:opacity-60">
              {saving && <Loader2 size={12} className="animate-spin" />}
              Add photo
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PortfolioSection;
