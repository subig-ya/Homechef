import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { Star, MapPin, ArrowRight, Camera, ChefHat } from 'lucide-react';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=900';
const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200';

const ChefsDirectoryPage = () => {
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChefs = async () => {
      try {
        const response = await API.get('/chefs');
        setChefs(response.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load home chefs');
        setChefs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChefs();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF4F7] px-4 py-14">
      <div className="mx-auto max-w-6xl">
        <header className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4B254B]/70">Home chefs</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight text-[#381E39] sm:text-4xl">
            Cooks who come to your home
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Browse personal chefs near you, see their menus and past work, and book them to cook in your own kitchen.
          </p>
        </header>

        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="mt-10 text-sm font-medium text-slate-500">Loading home chefs...</p>
        ) : chefs.length === 0 ? (
          <p className="mt-10 text-sm text-slate-500">No home chefs available right now.</p>
        ) : (
          <div className="mt-10 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {chefs.map((chef) => (
              <Link
                key={chef._id}
                to={`/chefs/${chef._id}`}
                className="group flex flex-col overflow-hidden rounded-3xl border border-pink-100/80 bg-white transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Cover */}
                <div className="relative h-44 overflow-hidden bg-[#FAF4F7]">
                  <img
                    src={chef.coverImage || FALLBACK_COVER}
                    alt={`${chef.name}'s kitchen`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#381E39]/50 via-transparent to-transparent" />

                  {/* Avatar */}
                  <div className="absolute -bottom-6 left-6">
                    <img
                      src={chef.profileImage || FALLBACK_AVATAR}
                      alt={chef.name}
                      className="h-20 w-20 rounded-2xl border-4 border-white object-cover shadow-md"
                    />
                  </div>

                  {/* Rating pill */}
                  <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm">
                    {chef.reviewCount > 0 ? (
                      <>
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>{chef.averageRating.toFixed(1)}</span>
                        <span className="font-normal text-slate-400">({chef.reviewCount})</span>
                      </>
                    ) : (
                      <>
                        <ChefHat className="h-3.5 w-3.5 text-[#4B254B]" />
                        <span className="font-semibold text-[#4B254B]">New</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col px-6 pb-6 pt-9">
                  <h2 className="text-lg font-extrabold text-[#381E39]">{chef.name}</h2>
                  {chef.tagline && <p className="mt-0.5 text-sm text-slate-600">{chef.tagline}</p>}

                  <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {chef.location || 'Home kitchen'}
                    {chef.yearsOfExperience > 0 && (
                      <span className="text-slate-400">
                        · {chef.yearsOfExperience} yr{chef.yearsOfExperience !== 1 ? 's' : ''} experience
                      </span>
                    )}
                    {chef.distance !== null && chef.distance !== undefined && (
                      <span className="text-slate-400"> · {chef.distance.toFixed(1)} km away</span>
                    )}
                  </p>

                  {chef.specialties?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {chef.specialties.slice(0, 4).map((spec) => (
                        <span
                          key={spec}
                          className="rounded-md border border-pink-100 bg-pink-50/60 px-2 py-0.5 text-[11px] font-semibold text-[#4B254B]"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Portfolio preview */}
                  {chef.portfolio?.length > 0 && (
                    <div className="mt-5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <Camera className="h-3 w-3" /> Their work
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {chef.portfolio.slice(0, 3).map((item, i) => (
                          <img
                            key={i}
                            src={item.image}
                            alt={item.title || 'Chef work sample'}
                            className="h-16 w-full rounded-lg border border-pink-100 object-cover"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-5">
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#4B254B]">
                      View profile
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChefsDirectoryPage;
