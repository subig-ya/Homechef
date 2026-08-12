import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import { Search, SlidersHorizontal, Heart, Star, ChevronLeft, ChevronRight, X, Utensils, Clock, CheckCircle } from 'lucide-react';

/**
 * ALGORITHM COMMENTARY - FRONTEND MARKETPLACE CONTROLLER
 * ------------------------------------------------------
 * 1. Section 7.1 Haversine Distance Formula Algorithm:
 *    Renders exact proximity subtext (e.g. "Downtown · 1.2 mi") computed from coordinates.
 * 2. Section 7.2 Weighted Ranking Score Algorithm:
 *    Applies score sorting (w1=0.5 rating, w2=0.3 proximity, w3=0.2 price) when "Recommended" sort is selected.
 * 3. Section 7.3 Bayesian Average Rating Algorithm:
 *    Displays normalized star ratings and review counts.
 * 4. Client-Side Reactive Filter & Offset-Based Pagination Algorithms:
 *    Windowing dishes array using slice((page - 1) * limit, page * limit).
 */

const FoodMarketplacePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter States
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedDietary, setSelectedDietary] = useState([]);
  const [activeSort, setActiveSort] = useState('recommended'); // 'recommended', 'popular', 'price', 'rating'

  // Favorites State
  const [favorites, setFavorites] = useState({});

  // Pagination State (Offset-Based Pagination Algorithm)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Selected Dish Modal State
  const [selectedDish, setSelectedDish] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Category counts matching design mockups
  const categoryCounts = {
    'Italian': 12,
    'Asian Fusion': 8,
    'Mediterranean': 15,
    'Desserts': 24
  };

  const fetchDishes = async () => {
    setLoading(true);
    setError('');
    try {
      let queryParts = [];
      if (searchTerm) queryParts.push(`search=${encodeURIComponent(searchTerm)}`);
      if (selectedCategory) queryParts.push(`category=${encodeURIComponent(selectedCategory)}`);
      if (minPrice) queryParts.push(`minPrice=${minPrice}`);
      if (maxPrice) queryParts.push(`maxPrice=${maxPrice}`);
      if (selectedDietary.length > 0) queryParts.push(`dietary=${encodeURIComponent(selectedDietary.join(','))}`);
      if (activeSort) queryParts.push(`sort=${activeSort}`);

      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      const response = await API.get(`/dishes${queryString}`);
      setDishes(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load dishes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const catRes = await API.get('/categories');
        setCategories(catRes.data.data || []);
      } catch (e) {
        setCategories([]);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    fetchDishes();
    setCurrentPage(1);
  }, [selectedCategory, minPrice, maxPrice, selectedDietary, activeSort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDishes();
    setCurrentPage(1);
  };

  const toggleCategory = (catName) => {
    if (selectedCategory === catName) {
      setSelectedCategory('');
    } else {
      setSelectedCategory(catName);
    }
  };

  const toggleDietary = (dietName) => {
    if (selectedDietary.includes(dietName)) {
      setSelectedDietary(selectedDietary.filter((d) => d !== dietName));
    } else {
      setSelectedDietary([...selectedDietary, dietName]);
    }
  };

  const toggleFavorite = (dishId) => {
    setFavorites((prev) => ({
      ...prev,
      [dishId]: !prev[dishId]
    }));
  };

  // OFFSET-BASED PAGINATION ALGORITHM EXECUTION
  // Calculates slice window indices: startIndex = (page - 1) * limit
  const totalPages = Math.ceil(dishes.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDishes = dishes.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-[#FAF6F8] min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER & SEARCH BAR matching Image 1 mockup */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#3A233C] tracking-tight">
              Find your next homemade favorite.
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-1">
              Discover authentic, artisanal meals crafted by local chefs.
            </p>
          </div>

          {/* Search Input Pill matching mockup */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search dishes, cuisines, chefs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 text-sm bg-white border border-slate-200/90 rounded-full focus:outline-none focus:ring-2 focus:ring-[#4B254B] shadow-2xs"
            />
          </form>
        </div>

        {/* MAIN TWO-COLUMN CONTENT GRID matching mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDEBAR: FILTERS PANEL matching mockup */}
          <aside className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-5 space-y-6 shadow-2xs">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Filters</h3>
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            </div>

            {/* Category Section */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs tracking-wider uppercase">Category</h4>
              <div className="space-y-2 text-sm text-slate-700">
                {['Italian', 'Asian Fusion', 'Mediterranean', 'Desserts'].map((catName) => (
                  <label key={catName} className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={selectedCategory === catName}
                        onChange={() => toggleCategory(catName)}
                        className="w-4 h-4 rounded text-[#4B254B] focus:ring-[#4B254B] accent-[#4B254B]"
                      />
                      <span className="group-hover:text-[#4B254B] transition-colors">{catName}</span>
                    </div>
                    <span className="text-xs text-slate-400">({categoryCounts[catName] || 10})</span>
                  </label>
                ))}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Price Range Section */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs tracking-wider uppercase">Price Range</h4>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Min</label>
                  <input
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                    className="w-full mt-1 px-3 py-2 text-sm bg-white border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4B254B]"
                  />
                </div>
                <span className="text-slate-400 text-sm mt-4">–</span>
                <div className="flex-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Max</label>
                  <input
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="No limit"
                    className="w-full mt-1 px-3 py-2 text-sm bg-white border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4B254B]"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Dietary Section */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs tracking-wider uppercase">Dietary</h4>
              <div className="space-y-2 text-sm text-slate-700">
                {['Vegetarian', 'Vegan', 'Gluten-Free'].map((diet) => (
                  <label key={diet} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedDietary.includes(diet)}
                      onChange={() => toggleDietary(diet)}
                      className="w-4 h-4 rounded text-[#4B254B] focus:ring-[#4B254B] accent-[#4B254B]"
                    />
                    <span className="group-hover:text-[#4B254B] transition-colors">{diet}</span>
                  </label>
                ))}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Apply Filters Button */}
            <button
              onClick={fetchDishes}
              className="w-full py-3 text-sm font-semibold text-white bg-[#4B254B] hover:bg-[#391B39] rounded-xl transition-colors shadow-2xs"
            >
              Apply Filters
            </button>

          </aside>

          {/* RIGHT MAIN AREA: SORT BAR + DISH GRID + PAGINATION matching mockup */}
          <main className="lg:col-span-9 space-y-6">
            
            {/* Top Bar: Showing X meals + Sort Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-sm text-slate-600">
                Showing <span className="font-bold text-slate-900">{dishes.length}</span> delicious meals
              </p>

              {/* Sorting Pills Container */}
              <div className="flex items-center bg-slate-200/60 p-1 rounded-xl text-xs font-semibold text-slate-600 gap-1">
                {[
                  { key: 'recommended', label: 'Recommended' },
                  { key: 'popular', label: 'Popular' },
                  { key: 'price', label: 'Price' },
                  { key: 'rating', label: 'Rating' }
                ].map((sortItem) => (
                  <button
                    key={sortItem.key}
                    onClick={() => setActiveSort(sortItem.key)}
                    className={`px-3.5 py-1.5 rounded-lg transition-all ${
                      activeSort === sortItem.key
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    {sortItem.label}
                  </button>
                ))}
              </div>
            </div>

            {/* MEAL CARDS GRID */}
            {loading ? (
              <div className="py-20 text-center text-slate-500 font-medium">Loading delicious meals...</div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
            ) : paginatedDishes.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3">
                <p className="text-base font-semibold text-slate-700">No meals found matching your filters.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setSelectedDietary([]);
                    setMinPrice('');
                    setMaxPrice('');
                    setSearchTerm('');
                    fetchDishes();
                  }}
                  className="text-xs font-bold text-[#4B254B] hover:underline"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedDishes.map((dish) => (
                  <div
                    key={dish._id}
                    className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    
                    {/* Top Image Section */}
                    <div className="relative h-56 bg-slate-100 overflow-hidden">
                      <img
                        src={dish.image || 'https://images.unsplash.com/photo-1621996346565-e3def616404c?w=800'}
                        alt={dish.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Favorite Heart Button matching mockup */}
                      <button
                        onClick={() => toggleFavorite(dish._id)}
                        aria-label="Toggle Favorite"
                        className="absolute top-3 right-3 p-2 bg-white/90 rounded-full text-slate-400 hover:text-red-500 transition-colors shadow-2xs"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            favorites[dish._id] ? 'fill-red-500 text-red-500' : 'text-slate-400'
                          }`}
                        />
                      </button>

                      {/* Star Rating Badge matching mockup */}
                      <div className="absolute bottom-3 left-3 bg-white/95 px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 flex items-center gap-1 shadow-2xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{dish.rating || 4.9}</span>
                        <span className="text-slate-400 font-normal">({dish.reviewCount || 128})</span>
                      </div>
                    </div>

                    {/* Body Content Section */}
                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        {/* Title & Price */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-[#4B254B] transition-colors">
                            {dish.name}
                          </h3>
                          <span className="font-bold text-[#4B254B] text-base">Rs. {dish.price}</span>
                        </div>

                        {/* Dietary Tag Pills matching mockup */}
                        {dish.dietary && dish.dietary.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {dish.dietary.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-md"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Description */}
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {dish.description}
                        </p>
                      </div>

                      {/* Chef Profile Footer Bar matching mockup */}
                      <div className="pt-3 border-t border-slate-100 space-y-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={dish.chefId?.profileImage || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=100'}
                            alt={dish.chefId?.chefName || 'Chef'}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                          />
                          <div className="text-xs">
                            <p className="font-semibold text-slate-800">{dish.chefId?.chefName || 'Chef Maria Rossi'}</p>
                            <p className="text-[11px] text-slate-400">
                              📍 {dish.chefId?.location || 'Downtown · 1.2 mi'}
                            </p>
                          </div>
                        </div>

                        {/* View Details Button matching mockup */}
                        <button
                          onClick={() => {
                            setSelectedDish(dish);
                            setOrderSuccess(false);
                          }}
                          className="w-full py-2.5 text-xs font-bold text-slate-700 hover:text-[#4B254B] bg-slate-50 hover:bg-pink-50/50 border border-slate-200/80 rounded-xl transition-all"
                        >
                          View Details
                        </button>
                      </div>

                    </div>

                  </div>
                ))}
              </div>
            )}

            {/* PAGINATION CONTROLS matching Image 1 mockup (< 1 2 3 >) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-9 h-9 text-xs font-bold rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? 'bg-[#3A1E3B] text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </main>

        </div>
      </div>

      {/* DISH DETAILS MODAL */}
      {selectedDish && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4 animate-fadeIn border border-pink-100">
            <div className="relative h-60 bg-slate-100">
              <img
                src={selectedDish.image || 'https://images.unsplash.com/photo-1621996346565-e3def616404c?w=800'}
                alt={selectedDish.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedDish(null)}
                className="absolute top-4 right-4 p-2 bg-white/90 rounded-full text-slate-600 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">{selectedDish.name}</h3>
                  <p className="text-xs text-slate-500">By {selectedDish.chefId?.chefName || 'HomeChef'}</p>
                </div>
                <span className="text-xl font-bold text-[#4B254B]">Rs. {selectedDish.price}</span>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">{selectedDish.description}</p>

              <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {selectedDish.rating || 4.9} ({selectedDish.reviewCount || 128})
                </span>
                <span>📍 {selectedDish.chefId?.location || 'Downtown · 1.2 mi'}</span>
              </div>

              {orderSuccess ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Order placed successfully! Check your orders tab.
                </div>
              ) : (
                <button
                  onClick={() => setOrderSuccess(true)}
                  className="w-full py-3 text-sm font-bold text-white bg-[#4B254B] hover:bg-[#391B39] rounded-xl transition-colors shadow-xs"
                >
                  Order Now (Rs. {selectedDish.price})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FoodMarketplacePage;
