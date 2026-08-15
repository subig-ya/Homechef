import React, { useState } from 'react';
import { Heart, ChefHat, Utensils, Trash2 } from 'lucide-react';
import ChefCard from '../../../components/customer/ChefCard';
import DishCard from '../../../components/customer/DishCard';

const FavoritesSection = ({ favorites, favoriteChefIds, favoriteDishIds, onToggleFavorite, onBookChef, onOpenDish, onNavigate }) => {
  const [tab, setTab] = useState('all'); // 'all' | 'chefs' | 'dishes'

  const chefFavorites = favorites.filter((f) => f.targetType === 'CHEF' && f.target);
  const dishFavorites = favorites.filter((f) => f.targetType === 'DISH' && f.target);

  const visibleChefs = tab === 'dishes' ? [] : chefFavorites;
  const visibleDishes = tab === 'chefs' ? [] : dishFavorites;
  const total = chefFavorites.length + dishFavorites.length;

  const tabs = [
    { key: 'all', label: `All (${total})` },
    { key: 'chefs', label: `Chefs (${chefFavorites.length})` },
    { key: 'dishes', label: `Meals (${dishFavorites.length})` }
  ];

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-start gap-3 rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] px-5 py-4 shadow-sm">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FDE7EF] text-[#C45B7C]">
          <Heart className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-display text-base font-semibold text-[#381E39]">My favorites</h3>
          <p className="mt-0.5 text-sm text-[#76534A]">
            Chefs and meals you saved. Tap the heart anywhere to add or remove them.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-colors ${
              tab === item.key
                ? 'border-[#4B254B] bg-[#4B254B] text-white'
                : 'border-[#EAD3DC] bg-white text-[#76534A] hover:border-[#D8B5C0]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#EAD3DC] bg-[#FFF9F5] px-6 py-14 text-center">
          <Heart className="h-8 w-8 text-[#C45B7C]" />
          <p className="font-display text-base font-semibold text-[#381E39]">Nothing saved yet</p>
          <p className="max-w-sm text-sm text-[#76534A]">
            Tap the heart on any chef or meal to save it here for quick access.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('find')}
            className="mt-1 rounded-full bg-[#E25C80] px-6 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#C54567]"
          >
            Find a chef
          </button>
        </div>
      ) : (
        <>
          {visibleChefs.length > 0 && (
            <section className="space-y-4">
              <h4 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-[#76534A]">
                <ChefHat className="h-4 w-4 text-[#C45B7C]" /> Chefs
              </h4>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visibleChefs.map((favorite) => (
                  <div key={favorite._id} className="relative">
                    <ChefCard
                      chef={favorite.target}
                      favorited={favoriteChefIds.has(favorite.targetId)}
                      onToggleFavorite={(c) => onToggleFavorite('CHEF', c._id)}
                      onBook={onBookChef}
                    />
                    <button
                      type="button"
                      onClick={() => onToggleFavorite('CHEF', favorite.targetId)}
                      aria-label="Remove favorite"
                      className="absolute -top-2 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-red-500 shadow-md ring-1 ring-red-200 transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {visibleDishes.length > 0 && (
            <section className="space-y-4">
              <h4 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-[#76534A]">
                <Utensils className="h-4 w-4 text-[#C45B7C]" /> Meals
              </h4>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visibleDishes.map((favorite) => (
                  <div key={favorite._id} className="relative">
                    <DishCard
                      dish={favorite.target}
                      favorited={favoriteDishIds.has(favorite.targetId)}
                      onToggleFavorite={(d) => onToggleFavorite('DISH', d._id)}
                      onOpen={onOpenDish}
                    />
                    <button
                      type="button"
                      onClick={() => onToggleFavorite('DISH', favorite.targetId)}
                      aria-label="Remove favorite"
                      className="absolute -top-2 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-red-500 shadow-md ring-1 ring-red-200 transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default FavoritesSection;
