import React from 'react';
import API from '../../../api/axios';
import { EmptyState } from '../../../components/chef/FeedbackStates';
import { Bell, ShoppingBag, CalendarDays, Star, CreditCard, CheckCheck } from 'lucide-react';
import { timeAgo } from '../utils';

const TYPE_ICONS = {
  ORDER: { icon: ShoppingBag, cls: 'bg-amber-50 text-amber-600' },
  BOOKING: { icon: CalendarDays, cls: 'bg-violet-50 text-violet-600' },
  REVIEW: { icon: Star, cls: 'bg-amber-50 text-amber-500' },
  PAYMENT: { icon: CreditCard, cls: 'bg-emerald-50 text-emerald-600' },
  GENERAL: { icon: Bell, cls: 'bg-[#FDE7EF] text-[#C45B7C]' }
};

const getToken = () => ({ Authorization: `Bearer ${localStorage.getItem('homechef_token')}` });

const NotificationsSection = ({ notifications, refresh }) => {
  const markRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`, {}, { headers: getToken() });
      refresh();
    } catch {
      // ignore
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    await Promise.allSettled(unread.map((n) => API.put(`/notifications/${n._id}/read`, {}, { headers: getToken() })));
    refresh();
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#76534A]">{unread} unread notification{unread === 1 ? '' : 's'}</p>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 rounded-full border border-[#F0DCE4] bg-white px-3.5 py-2 text-xs font-semibold text-[#76534A] transition-colors hover:bg-[#FCECEF] hover:text-[#C45B7C]"
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="No notifications yet" hint="Order, booking, review, and payment updates will land here." icon={Bell} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] shadow-sm">
          <ul className="divide-y divide-[#F6E9EE]">
            {notifications.map((notification) => {
              const meta = TYPE_ICONS[notification.type] || TYPE_ICONS.GENERAL;
              const Icon = meta.icon;
              return (
                <li key={notification._id}>
                  <button
                    onClick={() => !notification.isRead && markRead(notification._id)}
                    className={`flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-[#FFF7F9] ${notification.isRead ? 'opacity-55' : ''}`}
                  >
                    <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.cls}`}>
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#381E39]">{notification.title}</span>
                        {!notification.isRead && <span className="h-2 w-2 rounded-full bg-[#E25C80]" />}
                      </span>
                      <span className="mt-0.5 block text-sm text-[#76534A]">{notification.message}</span>
                      <span className="mt-1 block text-[11px] font-medium text-[#A98990]">{timeAgo(notification.createdAt)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationsSection;
