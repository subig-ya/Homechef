import React from 'react';
import { Star, Quote } from 'lucide-react';
import { EmptyState } from '../../../components/chef/FeedbackStates';
import { formatDateTime } from '../utils';

const ReviewsSection = ({ reviews }) => {
  const list = reviews?.reviews || [];
  const breakdown = reviews?.ratingBreakdown || {};
  const bayesian = reviews?.bayesianRating || 0;
  const average = reviews?.averageRating || 0;
  const count = reviews?.reviewCount || 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#A98990]">Bayesian rating</p>
          <p className="mt-1 font-display text-3xl font-bold text-[#381E39]">{bayesian ? bayesian.toFixed(2) : '—'}</p>
          <p className="mt-1 text-xs text-[#76534A]">Smoothed against the platform average so a few 5-star reviews can't inflate it.</p>
        </div>
        <div className="rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#A98990]">Average</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="font-display text-3xl font-bold text-[#381E39]">{average ? average.toFixed(1) : '—'}</p>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={16} className={star <= Math.round(average) ? 'fill-amber-400 text-amber-400' : 'text-[#EAD3DC]'} />
              ))}
            </div>
          </div>
          <p className="mt-1 text-xs text-[#76534A]">{count} review{count === 1 ? '' : 's'} in total</p>
        </div>
        <div className="rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#A98990]">Distribution</p>
          <div className="mt-2 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const c = breakdown[star] || 0;
              const pct = count ? Math.round((c / count) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-[11px] text-[#76534A]">
                  <span className="w-6 font-semibold">{star}★</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F6E9EE]">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-right">{c}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState title="No reviews yet" hint="Reviews appear here after customers rate your meals or home cooking." icon={Quote} />
      ) : (
        <div className="space-y-3">
          {list.map((review) => (
            <div key={review._id} className="rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  {review.customerId?.profileImage ? (
                    <img src={review.customerId.profileImage} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FDE7EF] text-xs font-bold text-[#C45B7C]">
                      {review.customerId?.name?.charAt(0) || 'C'}
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-[#381E39]">{review.customerId?.name || 'Customer'}</p>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={12} className={star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-[#EAD3DC]'} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {review.dishId?.name && <p className="text-xs font-semibold text-[#C45B7C]">{review.dishId.name}</p>}
                  <p className="text-[11px] text-[#A98990]">{formatDateTime(review.createdAt)}</p>
                </div>
              </div>
              {review.comment && <p className="mt-3 text-sm leading-relaxed text-[#563124]">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsSection;
