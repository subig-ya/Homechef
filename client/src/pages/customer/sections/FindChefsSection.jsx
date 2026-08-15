import React, { useEffect, useState } from 'react';
import API from '../../../api/axios';
import { Search, MapPin, ChefHat, Loader2, SlidersHorizontal } from 'lucide-react';
import ChefCard from '../../../components/customer/ChefCard';

const FindChefsSection = ({ chefs, favoriteChefIds, onToggleFavorite, onBookChef }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(chefs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('top'); // 'top' | 'nearby'

  useEffect(() => {
    setResults(chefs);
  }, [chefs]);

  // Backend-connected search: /chefs?search=... ranks with the same Bayesian +
  // reliability logic the directory uses. Debounced so every keystroke queries.
  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults(chefs);
      setError('');
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const res = await API.get(`/chefs?search=${encodeURIComponent(term)}&sort=${sort}`);
        setResults(res.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to search chefs.');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, sort, chefs]);

  const handleSortChange = (next) => {
    setSort(next);
  };

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header + search */}
      <div className="rounded-3xl border border-[#F0DCE4] bg-[#FFFDFC] p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FDE7EF] text-[#C45B7C]">
            <ChefHat className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-[#381E39]">Find your home chef</h3>
            <p className="mt-0.5 text-sm text-[#76534A]">
              Search by name, cuisine, specialty or area. Every result is ranked by real reviews and distance.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-[#A98990]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Kenji, Italian, momo, Kathmandu…"
              className="w-full rounded-full border border-[#EAD3DC] bg-white py-3 pl-11 pr-4 text-sm text-[#381E39] shadow-sm outline-none focus:border-[#E25C80] focus:ring-2 focus:ring-[#E25C80]/20"
            />
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-[#EAD3DC] bg-white p-1 text-xs font-semibold text-[#76534A]">
            <SlidersHorizontal className="ml-2 h-3.5 w-3.5 text-[#C45B7C]" />
            {[
              { key: 'top', label: 'Top rated' },
              { key: 'nearby', label: 'Nearby' }
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => handleSortChange(option.key)}
                className={`rounded-full px-3.5 py-1.5 transition-colors ${
                  sort === option.key ? 'bg-[#4B254B] text-white' : 'hover:bg-[#FCECEF]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-16 text-[#76534A]">
          <Loader2 className="animate-spin text-[#E25C80]" size={26} />
          <p className="text-sm font-medium">Searching chefs…</p>
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#EAD3DC] bg-[#FFF9F5] px-6 py-14 text-center">
          <MapPin className="h-8 w-8 text-[#C45B7C]" />
          <p className="font-display text-base font-semibold text-[#381E39]">No chefs match</p>
          <p className="max-w-sm text-sm text-[#76534A]">
            {query.trim()
              ? `Nothing found for "${query.trim()}". Try a different name, cuisine or area.`
              : 'No home chefs are listing meals right now.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((chef) => (
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
    </div>
  );
};

export default FindChefsSection;
