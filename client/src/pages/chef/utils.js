export const formatRs = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;

export const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatDateTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export const timeAgo = (iso) => {
  if (!iso) return '';
  const seconds = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
};

export const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const formatDistance = (km) => {
  if (km === null || km === undefined) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${Number(km).toFixed(1)} km`;
};

// Chef-side order flow: what action is available from each status.
export const ORDER_FLOW = {
  PENDING: [{ to: 'ACCEPTED', label: 'Accept' }, { to: 'REJECTED', label: 'Decline', secondary: true }],
  ACCEPTED: [{ to: 'PREPARING', label: 'Start preparing' }],
  PREPARING: [{ to: 'READY', label: 'Mark ready' }],
  READY: [{ to: 'COMPLETED', label: 'Mark completed' }]
};

export const ACTIVE_ORDER_STATUSES = ['PENDING', 'ACCEPTED', 'PREPARING', 'PAYMENT_PENDING', 'PAID', 'READY'];

export const BOOKING_FLOW = {
  PENDING: [{ to: 'ACCEPTED', label: 'Accept' }, { to: 'REJECTED', label: 'Decline', secondary: true }],
  ACCEPTED: [{ to: 'COMPLETED', label: 'Mark completed' }],
  CONFIRMED: [{ to: 'COMPLETED', label: 'Mark completed' }]
};

export const ACTIVE_BOOKING_STATUSES = ['PENDING', 'ACCEPTED', 'CONFIRMED'];

export const SLOT_TYPE_LABEL = {
  MORNING: 'Morning',
  AFTERNOON: 'Afternoon',
  EVENING: 'Evening'
};
