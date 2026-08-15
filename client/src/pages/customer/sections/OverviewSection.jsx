import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, ArrowRight, Utensils, Heart, ChefHat, MapPin, Sparkles } from 'lucide-react';
import ChefCard from '../../../components/customer/ChefCard';
import DishCard from '../../../components/customer/DishCard';

const CATEGORY_IMAGES = {
  Nepali: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600',
  Newari: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600',
  Momo: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600',
  Bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600',
  Italian: 'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=600',
  Chinese: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600'
};

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const OverviewSection = ({
  user,
  chefs,
  nearbyChefs,
  dishes,
  popularDishes,
  categories,
  bookings,
  orders,
  favoriteChefIds,
  favoriteDishIds,
  onToggleFavorite,
  onBookChef,
  onOpenDish,
  onSearch
}) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  // Dish count per category derived from the fetched dishes (populated with
  // categoryId) so the category cards are always backed by real data.
  const categoryCounts = {};
  dishes.forEach((dish) => {
    const id = dish.categoryId?._id || dish.categoryId;
    if (id) categoryCounts[id] = (categoryCounts[id] || 0) + 1;
  });

  return (
    <div className="space-y-10 animate-fade-up">
      {/* Welcome hero */}
      <div className="relative overflow-hidden rounded-3xl border border-[#F0DCE4] bg-[#FFFDFC] p-6 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#FDE7EF]/70 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-[#F6E7DC]/60 blur-2xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-3">
            <p className="font-cursive text-3xl text-[#381E39]">
              {greeting()}, {user?.name?.split(' ')[0] || 'foodie'}!
            </p>
            <h2 className="font-display text-xl font-bold leading-snug text-[#381E39] sm:text-2xl">
              Craving something special?{' '}
              <span className="text-[#C45B7C]">A neighbourhood chef is one tap away.</span>
            </h2>
            <p className="text-sm leading-relaxed text-[#76534A]">
              Browse recommended home chefs, discover homemade meals, and book a private dining experience cooked in
              your own kitchen.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="relative mt-2 max-w-md">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-[#A98990]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chefs, dishes, cuisines, locations…"
                className="w-full rounded-full border border-[#EAD3DC] bg-white py-3 pl-11 pr-4 text-sm text-[#381E39] shadow-sm outline-none focus:border-[#E25C80] focus:ring-2 focus:ring-[#E25C80]/20"
              />
            </form>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onSearch(query.trim() || '')}
                className="rounded-full bg-[#E25C80] px-6 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#C54567]"
              >
                Search
              </button>
              <Link
                to="/food"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E5C8D1] bg-white px-6 py-2.5 text-xs font-bold text-[#76534A] transition-colors hover:border-[#D96F91] hover:bg-[#FFF0F5]"
              >
                Browse food <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            {[
              { label: 'Meals ordered', value: orders.length, icon: Utensils },
              { label: 'Chef bookings', value: bookings.length, icon: ChefHat },
              { label: 'Saved favorites', value: favoriteChefIds.size + favoriteDishIds.size, icon: Heart }
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex items-center gap-3 rounded-2xl border border-[#F3E3E8] bg-white/80 px-4 py-3 shadow-sm"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FDE7EF] text-[#C45B7C]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-lg font-bold leading-none text-[#381E39]">{stat.value}</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-[#A98990]">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recommended chefs */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#C45B7C]">
              <Sparkles className="h-3.5 w-3.5" /> Top rated
            </p>
            <h3 className="mt-1 font-display text-lg font-bold text-[#381E39]">Recommended chefs</h3>
          </div>
          <button type="button" onClick={() => onSearch('')} className="text-xs font-bold text-[#4B254B] hover:underline">
            Find more chefs →
          </button>
        </div>

        {chefs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#EAD3DC] bg-[#FFF9F5] px-4 py-8 text-center text-sm text-[#76534A]">
            No chefs are listing meals yet.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {chefs.slice(0, 4).map((chef) => (
              <ChefCard
                key={chef._id}
                chef={chef}
                favorited={favoriteChefIds.has(chef._id)}
                onToggleFavorite={(c) => onToggleFavorite('CHEF', c._id)}
                onBook={onBookChef}
              />
            ))}
          </div>
        )}
      </section>

      {/* Cuisine categories */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#C45B7C]">
              <Utensils className="h-3.5 w-3.5" /> Explore by taste
            </p>
            <h3 className="mt-1 font-display text-lg font-bold text-[#381E39]">Cuisine categories</h3>
          </div>
          <Link to="/categories" className="text-xs font-bold text-[#4B254B] hover:underline">
            All categories →
          </Link>
        </div>

        {categories.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#EAD3DC] bg-[#FFF9F5] px-4 py-8 text-center text-sm text-[#76534A]">
            No categories configured yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.slice(0, 6).map((category) => (
              <Link
                key={category._id}
                to={`/food?category=${encodeURIComponent(category.name)}`}
                className="group overflow-hidden rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative h-20 overflow-hidden">
                  <img
                    src={category.image || CATEGORY_IMAGES[category.name] || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600'}
                    alt={category.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#381E39]/55 to-transparent" />
                  <span className="absolute bottom-1.5 left-2 text-[10px] font-bold text-white drop-shadow">
                    {category.name}
                  </span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-2">
                  <span className="text-[10px] font-semibold text-[#76534A]">
                    {categoryCounts[category._id] || 0} dishes
                  </span>
                  <ArrowRight className="h-3 w-3 text-[#C45B7C] transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Take a Bite — food discovery */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#C45B7C]">
              <Utensils className="h-3.5 w-3.5" /> Fresh from the kitchen
            </p>
            <h3 className="mt-1 font-display text-lg font-bold text-[#381E39]">Take a bite</h3>
          </div>
          <Link to="/food" className="text-xs font-bold text-[#4B254B] hover:underline">
            Full marketplace →
          </Link>
        </div>

        {dishes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#EAD3DC] bg-[#FFF9F5] px-4 py-8 text-center text-sm text-[#76534A]">
            No homemade meals are listed right now.
          </p>
        ) : (
          <div className="flex snap-x gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {dishes.slice(0, 8).map((dish) => (
              <div key={dish._id} className="w-52 shrink-0 snap-start">
                <DishCard
                  dish={dish}
                  compact
                  favorited={favoriteDishIds.has(dish._id)}
                  onToggleFavorite={(d) => onToggleFavorite('DISH', d._id)}
                  onOpen={onOpenDish}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Nearby chefs */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#C45B7C]">
              <MapPin className="h-3.5 w-3.5" /> Closest first
            </p>
            <h3 className="mt-1 font-display text-lg font-bold text-[#381E39]">Chefs near you</h3>
          </div>
          <button type="button" onClick={() => onSearch('')} className="text-xs font-bold text-[#4B254B] hover:underline">
            Find chefs →
          </button>
        </div>

        {nearbyChefs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#EAD3DC] bg-[#FFF9F5] px-4 py-8 text-center text-sm text-[#76534A]">
            <MapPin className="mx-auto mb-2 h-5 w-5 text-[#C45B7C]" />
            Set your location in Profile to see chefs near you.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {nearbyChefs.slice(0, 4).map((chef) => (
              <ChefCard
                key={chef._id}
                chef={chef}
                favorited={favoriteChefIds.has(chef._id)}
                onToggleFavorite={(c) => onToggleFavorite('CHEF', c._id)}
                onBook={onBookChef}
              />
            ))}
          </div>
        )}
      </section>

      {/* Popular right now */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#C45B7C]">
              <Star className="h-3.5 w-3.5" /> Most ordered
            </p>
            <h3 className="mt-1 font-display text-lg font-bold text-[#381E39]">Popular right now</h3>
          </div>
          <Link to="/food?sort=popular" className="text-xs font-bold text-[#4B254B] hover:underline">
            See all →
          </Link>
        </div>

        {popularDishes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#EAD3DC] bg-[#FFF9F5] px-4 py-8 text-center text-sm text-[#76534A]">
            No popular meals to show yet.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {popularDishes.slice(0, 4).map((dish) => (
              <DishCard
                key={dish._id}
                dish={dish}
                favorited={favoriteDishIds.has(dish._id)}
                onToggleFavorite={(d) => onToggleFavorite('DISH', d._id)}
                onOpen={onOpenDish}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default OverviewSection;
