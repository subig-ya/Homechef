import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Heart, ChevronRight, UtensilsCrossed } from 'lucide-react';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=900';
const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200';

const ChefCard = ({ chef, favorited = false, onToggleFavorite, onBook }) => {
  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl border border-[#F0DCE4] bg-[#FFFDFC] shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      {/* Cover */}
      <div className="relative h-40 overflow-hidden bg-[#FAF4F7]">
        <img
          src={chef.coverImage || FALLBACK_COVER}
          alt={`${chef.name}'s kitchen`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#381E39]/45 via-transparent to-transparent" />

        {/* Avatar */}
        <div className="absolute -bottom-6 left-5">
          <img
            src={chef.profileImage || FALLBACK_AVATAR}
            alt={chef.name}
            className="h-16 w-16 rounded-2xl border-4 border-white object-cover shadow-md"
          />
        </div>

        {/* Rating pill */}
        <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#381E39] shadow-sm">
          {chef.reviewCount > 0 ? (
            <>
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{Number(chef.averageRating).toFixed(1)}</span>
              <span className="font-normal text-[#A98990]">({chef.reviewCount})</span>
            </>
          ) : (
            <span className="font-semibold text-[#4B254B]">New</span>
          )}
        </div>

        {/* Favorite heart */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite(chef);
            }}
            aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#C45B7C] shadow-sm transition-colors hover:bg-white"
          >
            <Heart className={`h-4 w-4 ${favorited ? 'fill-[#E25C80] text-[#E25C80]' : 'text-[#C45B7C]'}`} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-5 pb-5 pt-8">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-bold text-[#381E39]">{chef.name}</h3>
            {chef.tagline && <p className="mt-0.5 truncate text-xs text-[#76534A]">{chef.tagline}</p>}
          </div>
          <span className="shrink-0 rounded-full border border-[#F0DCE4] bg-[#FDE7EF] px-2 py-0.5 text-[10px] font-bold text-[#C45B7C]">
            {chef.listingCount} dish{chef.listingCount === 1 ? '' : 'es'}
          </span>
        </div>

        <p className="mt-2 flex items-center gap-1 text-[11px] text-[#76534A]">
          <MapPin className="h-3 w-3 shrink-0 text-[#C45B7C]" />
          <span className="truncate">{chef.location || 'Home kitchen'}</span>
          {chef.distance !== null && chef.distance !== undefined && (
            <span className="shrink-0 text-[#A98990]"> · {Number(chef.distance).toFixed(1)} km away</span>
          )}
        </p>

        {chef.specialties?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {chef.specialties.slice(0, 3).map((spec) => (
              <span
                key={spec}
                className="rounded-md border border-[#F3E3E8] bg-[#FFF9F5] px-2 py-0.5 text-[10px] font-semibold text-[#76534A]"
              >
                {spec}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 pt-4">
          <Link
            to={`/chefs/${chef._id}`}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-[#EAD3DC] bg-white px-3 py-2 text-[11px] font-bold text-[#76534A] transition-colors hover:border-[#D8B5C0] hover:text-[#C45B7C]"
          >
            View profile <ChevronRight className="h-3 w-3" />
          </Link>
          {onBook && (
            <button
              type="button"
              onClick={() => onBook(chef)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#4B254B] px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-[#391B39]"
            >
              <UtensilsCrossed className="h-3 w-3" /> Book
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChefCard;
