import React, { useEffect, useState } from 'react';
import API from '../../../api/axios';
import { Search, ChefHat, Utensils, Loader2 } from 'lucide-react';
import ChefCard from '../../../components/customer/ChefCard';
import DishCard from '../../../components/customer/DishCard';

const SearchResultsSection = ({ query, favoriteChefIds, favoriteDishIds, onToggleFavorite, onBookChef, onOpenDish }) => {
  const [chefs, setChefs] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await API.get(`/search?q=${encodeURIComponent(query)}`);
        setChefs(res.data.data?.chefs || []);
        setDishes(res.data.data?.dishes || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to run the search.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [query]);

  const total = chefs.length + dishes.length;

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex items-center gap-3 rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] px-5 py-4 shadow-sm">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FDE7EF] text-[#C45B7C]">
          <Search className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-display text-base font-semibold text-[#381E39]">
            Results for “{query}”
          </h3>
          <p className="text-xs text-[#76534A]">
            {loading ? 'Searching…' : `${total} match${total === 1 ? '' : 'es'} across chefs and meals`}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-16 text-[#76534A]">
          <Loader2 className="animate-spin text-[#E25C80]" size={26} />
          <p className="text-sm font-medium">Searching…</p>
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#EAD3DC] bg-[#FFF9F5] px-6 py-14 text-center">
          <Search className="h-8 w-8 text-[#C45B7C]" />
          <p className="font-display text-base font-semibold text-[#381E39]">Nothing found</p>
          <p className="max-w-sm text-sm text-[#76534A]">
            No chefs or dishes matched “{query}”. Try a different dish, cuisine, chef name, or location.
          </p>
        </div>
      ) : (
        <>
          {chefs.length > 0 && (
            <section className="space-y-4">
              <h4 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-[#76534A]">
                <ChefHat className="h-4 w-4 text-[#C45B7C]" /> Chefs ({chefs.length})
              </h4>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {chefs.map((chef) => (
                  <ChefCard
                    key={chef._id}
                    chef={chef}
                    favorited={favoriteChefIds.has(chef._id)}
                    onToggleFavorite={(c) => onToggleFavorite('CHEF', c._id)}
                    onBook={onBookChef}
                  />
                ))}
              </div>
            </section>
          )}

          {dishes.length > 0 && (
            <section className="space-y-4">
              <h4 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-[#76534A]">
                <Utensils className="h-4 w-4 text-[#C45B7C]" /> Meals ({dishes.length})
              </h4>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {dishes.map((dish) => (
                  <DishCard
                    key={dish._id}
                    dish={dish}
                    favorited={favoriteDishIds.has(dish._id)}
                    onToggleFavorite={(d) => onToggleFavorite('DISH', d._id)}
                    onOpen={onOpenDish}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default SearchResultsSection;
