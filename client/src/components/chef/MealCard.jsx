import React, { useState } from 'react';
import { Pencil, Plus, Star } from 'lucide-react';
import { Trash2 } from 'lucide-react';

const formatRs = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;

const MealCard = ({ dish, onEdit, onDelete }) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="group overflow-hidden rounded-2xl border border-[#F0DCE4] bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative h-36 overflow-hidden bg-[#FDE7EF]">
        {dish.image && !imageFailed ? (
          <img
            src={dish.image}
            alt={dish.name}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-cursive text-2xl text-[#C45B7C]/60">HomeChef</span>
          </div>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
            dish.availabilityStatus === 'SOLD_OUT' || dish.availabilityStatus === 'UNAVAILABLE'
              ? 'border-red-200 bg-red-50 text-red-700'
              : dish.availabilityStatus === 'LIMITED'
                ? 'border-orange-200 bg-orange-50 text-orange-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {dish.availabilityStatus || 'AVAILABLE'}
        </span>
        {dish.rating ? (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-[#F0DCE4] bg-white/95 px-2 py-1 text-[10px] font-bold text-[#563124]">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            {Number(dish.rating).toFixed(1)}
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="truncate font-display text-sm font-semibold text-[#381E39]">{dish.name}</h4>
            <p className="text-[11px] text-[#76534A]">{dish.cuisine}</p>
          </div>
          <p className="shrink-0 text-sm font-bold text-[#C54567]">{formatRs(dish.price)}</p>
        </div>

        <p className="mt-2 line-clamp-2 text-xs text-[#76534A]">{dish.description}</p>

        <div className="mt-3 flex items-center justify-between border-t border-[#F6E9EE] pt-3">
          <span className="text-[11px] text-[#A98990]">Qty {dish.availableQuantity ?? 0} available</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit && onEdit(dish)}
              aria-label="Edit meal"
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#76534A] transition-colors hover:bg-[#FCECEF] hover:text-[#C45B7C]"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete && onDelete(dish)}
              aria-label="Delete meal"
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#76534A] transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
            {onEdit && (
              <button
                onClick={() => onEdit(dish)}
                aria-label="Update availability"
                className="flex h-7 items-center gap-1 rounded-full bg-[#FDE7EF] px-2.5 text-[11px] font-semibold text-[#C45B7C] transition-colors hover:bg-[#F4D8E1]"
              >
                <Plus size={12} /> Stock
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealCard;
