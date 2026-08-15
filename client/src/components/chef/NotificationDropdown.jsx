import React, { useEffect, useRef, useState } from 'react';
import API from '../../api/axios';
import { Bell, ShoppingBag, CalendarDays, Star, CreditCard, Loader2 } from 'lucide-react';

const TYPE_ICONS = {
  ORDER: ShoppingBag,
  BOOKING: CalendarDays,
  REVIEW: Star,
  PAYMENT: CreditCard,
  GENERAL: Bell
};

const timeAgo = (iso) => {
  if (!iso) return '';
  const seconds = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const NotificationDropdown = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const wrapRef = useRef(null);

  const unread = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = async () => {
    const token = localStorage.getItem('homechef_token');
    if (!token) return;
    try {
      const response = await API.get('/notifications', { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(response.data.data || []);
    } catch {
      // silent — badge just stays stale
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const markRead = async (id) => {
    const token = localStorage.getItem('homechef_token');
    if (!token) return;
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    try {
      await API.put(`/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch {
      // revert on failure
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: false } : n)));
    }
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#EEDDE2] bg-white text-[#76534A] transition-colors hover:border-[#D8B5C0] hover:text-[#C45B7C]"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E25C80] px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 animate-fade-up overflow-hidden rounded-2xl border border-[#F0DCE4] bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-[#F3E3E8] bg-[#FFF9F5] px-4 py-3">
            <p className="text-sm font-semibold text-[#381E39]">Notifications</p>
            <span className="text-[11px] font-medium text-[#76534A]">{unread} unread</span>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-[#76534A]">
                <Loader2 className="animate-spin text-[#E25C80]" size={16} /> Loading…
              </div>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-[#76534A]">No notifications yet.</p>
            ) : (
              notifications.slice(0, 12).map((notification) => {
                const Icon = TYPE_ICONS[notification.type] || Bell;
                return (
                  <button
                    key={notification._id}
                    onClick={() => !notification.isRead && markRead(notification._id)}
                    className={`flex w-full items-start gap-3 border-b border-[#FAF0F3] px-4 py-3 text-left transition-colors hover:bg-[#FFF7F9] ${
                      notification.isRead ? 'opacity-60' : ''
                    }`}
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FDE7EF] text-[#C45B7C]">
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-[#381E39]">{notification.title}</span>
                      <span className="mt-0.5 block text-xs text-[#76534A]">{notification.message}</span>
                      <span className="mt-1 block text-[10px] font-medium text-[#A98990]">
                        {timeAgo(notification.createdAt)}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
