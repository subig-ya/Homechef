import React from 'react';

const STATUS_STYLES = {
  PENDING: { label: 'Pending', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  ACCEPTED: { label: 'Accepted', cls: 'text-[#C54567] bg-[#E25C80]/10 border-[#E25C80]/25' },
  PREPARING: { label: 'Preparing', cls: 'text-violet-700 bg-violet-50 border-violet-200' },
  PAYMENT_PENDING: { label: 'Payment pending', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  PAID: { label: 'Paid', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  READY: { label: 'Ready', cls: 'text-sky-700 bg-sky-50 border-sky-200' },
  CONFIRMED: { label: 'Confirmed', cls: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  COMPLETED: { label: 'Completed', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  REJECTED: { label: 'Rejected', cls: 'text-red-700 bg-red-50 border-red-200' },
  CANCELLED: { label: 'Cancelled', cls: 'text-slate-500 bg-slate-100 border-slate-200' },
  UNPAID: { label: 'Unpaid', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  FAILED: { label: 'Failed', cls: 'text-red-700 bg-red-50 border-red-200' },
  AVAILABLE: { label: 'Available', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  FULL: { label: 'Full', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  UNAVAILABLE: { label: 'Unavailable', cls: 'text-slate-500 bg-slate-100 border-slate-200' },
  SOLD_OUT: { label: 'Sold out', cls: 'text-slate-500 bg-slate-100 border-slate-200' },
  LIMITED: { label: 'Limited', cls: 'text-orange-700 bg-orange-50 border-orange-200' }
};

const StatusBadge = ({ status, paymentStatus, className = '' }) => {
  const style = STATUS_STYLES[status] || { label: status || '—', cls: 'text-slate-500 bg-slate-100 border-slate-200' };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style.cls} ${className}`}>
      {style.label}
      {paymentStatus && paymentStatus !== 'UNPAID' && paymentStatus !== status && (
        <span className="ml-1 text-[10px] font-medium opacity-70">• {paymentStatus}</span>
      )}
    </span>
  );
};

export default StatusBadge;
