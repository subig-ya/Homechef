import React from 'react';
import { Loader2, Inbox, AlertCircle } from 'lucide-react';

export const LoadingState = ({ label = 'Loading…' }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#76534A]">
    <Loader2 className="animate-spin text-[#E25C80]" size={28} />
    <p className="text-sm font-medium">{label}</p>
  </div>
);

export const EmptyState = ({ title = 'Nothing here yet', hint, icon: Icon = Inbox }) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#EAD3DC] bg-[#FFF9F5] px-6 py-14 text-center">
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FDE7EF] text-[#C45B7C]">
      <Icon size={22} />
    </span>
    <p className="font-display text-base font-semibold text-[#381E39]">{title}</p>
    {hint && <p className="max-w-sm text-sm text-[#76534A]">{hint}</p>}
  </div>
);

export const ErrorState = ({ message = 'Something went wrong. Please try again.' }) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50/60 px-6 py-12 text-center">
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500">
      <AlertCircle size={22} />
    </span>
    <p className="text-sm font-semibold text-red-700">{message}</p>
  </div>
);
