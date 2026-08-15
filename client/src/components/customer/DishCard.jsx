import React from 'react';
import { Star, Heart, MapPin } from 'lucide-react';

const FALLBACK_DISH_IMAGE = 'https://images.unsplash.com/photo-1621996346565-e3def616404c?w=800';

const DishCard = ({ dish, favorited = false, onToggleFavorite, onOpen, compact = false }) => {
  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl border border-[#F0DCE4] bg-[#FFFDFC] shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      {/* Image */}
      <div className={`relative overflow-hidden bg-[#FAF4F7] ${compact ? 'h-36' : 'h-44'}`}>
        <img
          src={dish.image || FALLBACK_DISH_IMAGE}
          alt={dish.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {dish.cuisine && (
          <span className="absolute bottom-2.5 left-2.5 rounded-md bg-white/95 px-2 py-0.5 text-[10px] font-bold text-[#76534A] shadow-sm">
            {dish.cuisine}
          </span>
        )}

        {/* Rating badge */}
        <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-[#381E39] shadow-sm">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span>{Number(dish.rating || 0).toFixed(1)}</span>
          <span className="font-normal text-[#A98990]">({dish.reviewCount || 0})</span>
        </div>

        {/* Favorite heart */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite(dish);
            }}
            aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#C45B7C] shadow-sm transition-colors hover:bg-white"
          >
            <Heart className={`h-4 w-4 ${favorited ? 'fill-[#E25C80] text-[#E25C80]' : 'text-[#C45B7C]'}`} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate font-display text-sm font-bold text-[#381E39]">{dish.name}</h3>
          <span className="shrink-0 text-sm font-extrabold text-[#4B254B]">Rs. {dish.price}</span>
        </div>

        {dish.dietary?.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {dish.dietary.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-emerald-200/70 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {!compact && dish.description && (
          <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-[#76534A]">{dish.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="flex min-w-0 items-center gap-1 text-[10px] text-[#A98990]">
            <MapPin className="h-3 w-3 shrink-0 text-[#C45B7C]" />
            <span className="truncate">{dish.sellerId?.name || 'Local kitchen'}</span>
          </span>
          {onOpen && (
            <button
              type="button"
              onClick={() => onOpen(dish)}
              className="shrink-0 rounded-full bg-[#E25C80] px-3.5 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-[#C54567]"
            >
              Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DishCard;
