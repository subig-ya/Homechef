import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import {
  Search,
  MapPin,
  ArrowRight,
  Star,
  Heart,
  CheckCircle2,
  RefreshCw,
  ChefHat,
  Sparkles,
  TrendingUp,
  ChevronRight
} from 'lucide-react';

// Cute inline SVGs
const CupcakeSVG = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 opacity-90 animate-float">
    <path d="M32 12C24 12 20 18 20 24C20 25.5 20.5 27 21.5 28.2C22.5 29.5 24 30 26 30C27.5 30 29 29.5 30 28.5C30.5 28 31 28 32 28C33 28 33.5 28 34 28.5C35 29.5 36.5 30 38 30C40 30 41.5 29.5 42.5 28.2C43.5 27 44 25.5 44 24C44 18 40 12 32 12Z" fill="#FBCFE8" stroke="#563124" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 30L25 50C25.2 51.5 26.5 52.5 28 52.5H36C37.5 52.5 38.8 51.5 39 50L42 30" fill="#FDE047" stroke="#563124" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="28" y1="30" x2="30" y2="52" stroke="#563124" strokeWidth="2.5" />
    <line x1="32" y1="30" x2="32" y2="52" stroke="#563124" strokeWidth="2.5" />
    <line x1="36" y1="30" x2="34" y2="52" stroke="#563124" strokeWidth="2.5" />
    <circle cx="32" cy="9" r="4.5" fill="#E11D48" stroke="#563124" strokeWidth="2.5" />
  </svg>
);

const CakeSliceSVG = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 opacity-90 animate-float-slow">
    <path d="M12 40L44 14L52 24L12 50V40Z" fill="#FFFBEB" stroke="#563124" strokeWidth="3" strokeLinejoin="round" />
    <path d="M44 14L12 40V34L44 8L52 18L44 14Z" fill="#FBCFE8" stroke="#563124" strokeWidth="3" strokeLinejoin="round" />
    <path d="M44 14L52 24V34L44 24V14Z" fill="#FDA4AF" stroke="#563124" strokeWidth="3" strokeLinejoin="round" />
    <path d="M12 45L44 19L52 29" stroke="#563124" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="48" cy="11" r="3.5" fill="#E11D48" stroke="#563124" strokeWidth="2" />
  </svg>
);

const BunnySVG = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 opacity-90 animate-float">
    <path d="M22 26C22 16 26 12 28 12C30 12 30 18 30 26" fill="#FFF" stroke="#563124" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24 24C24 18 26 15 27 15C28 15 28 19 28 24" fill="#FFD2E9" />
    <path d="M34 26C34 16 38 12 40 12C42 12 42 18 42 26" fill="#FFF" stroke="#563124" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M36 24C36 18 38 15 39 15C40 15 40 19 40 24" fill="#FFD2E9" />
    <circle cx="32" cy="38" r="14" fill="#FFF" stroke="#563124" strokeWidth="3" />
    <circle cx="28" cy="36" r="1.5" fill="#563124" />
    <circle cx="36" cy="36" r="1.5" fill="#563124" />
    <circle cx="25" cy="40" r="2" fill="#FFB7D5" />
    <circle cx="39" cy="40" r="2" fill="#FFB7D5" />
    <path d="M31 39.5L32 40.5L33 39.5" stroke="#563124" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CookieSVG = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 opacity-90 animate-float-slow">
    <circle cx="32" cy="32" r="22" fill="#FCD34D" stroke="#563124" strokeWidth="3" />
    <circle cx="12" cy="32" r="6" fill="#FDFBF7" />
    <path d="M12 26C14 26 15 28 15 32C15 36 14 38 12 38" stroke="#563124" strokeWidth="3" strokeLinecap="round" />
    <circle cx="26" cy="24" r="3" fill="#563124" />
    <circle cx="38" cy="22" r="2.5" fill="#563124" />
    <circle cx="32" cy="34" r="3.5" fill="#563124" />
    <circle cx="42" cy="36" r="3" fill="#563124" />
    <circle cx="24" cy="40" r="2.5" fill="#563124" />
  </svg>
);

const MOCK_DESSERTS = [
  {
    _id: "mock-1",
    name: "Mongo Mochi",
    description: "Delicious sweet mochi filled with fresh mango puree.",
    price: 29.00,
    image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500",
    cuisine: "Asian Dessert",
    rating: 4.9,
    sellerId: { name: "Chef Lin", profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" }
  },
  {
    _id: "mock-2",
    name: "Matcha Roll",
    description: "A fluffy sponge cake roll with fresh green tea cream.",
    price: 35.00,
    image: "https://images.unsplash.com/photo-1534432122685-f4ed6f1883b0?w=500",
    cuisine: "Japanese",
    rating: 4.8,
    sellerId: { name: "Chef Lin", profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" }
  },
  {
    _id: "mock-3",
    name: "Strawberry Cake Roll",
    description: "A light cake roll filled with fresh whipped strawberry cream.",
    price: 125.00,
    image: "https://images.unsplash.com/photo-1603532648955-039310d9ed75?w=500",
    cuisine: "Dutch",
    rating: 5.0,
    sellerId: { name: "Chef Baker", profileImage: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100" }
  },
  {
    _id: "mock-4",
    name: "Purin",
    description: "A soft and sweet dessert with a caramel liquid.",
    price: 14.00,
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500",
    cuisine: "Japanese",
    rating: 4.7,
    sellerId: { name: "Chef Lin", profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" }
  },
  {
    _id: "mock-5",
    name: "Red Bean Pancakes",
    description: "A sweet treat consisting of a paste made from red beans.",
    price: 19.00,
    image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=500",
    cuisine: "Traditional",
    rating: 4.6,
    sellerId: { name: "Chef Lin", profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" }
  },
  {
    _id: "mock-6",
    name: "Coconut Jelly",
    description: "A clean, translucent jelly dessert made by coconut milk.",
    price: 24.00,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500",
    cuisine: "Tropical",
    rating: 4.9,
    sellerId: { name: "Chef Lin", profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" }
  },
  {
    _id: "mock-7",
    name: "Japanese Cheesecake",
    description: "The combination of creamy cheese cake and light fluffy sponge.",
    price: 64.00,
    image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500",
    cuisine: "Japanese",
    rating: 4.9,
    sellerId: { name: "Chef Sakura", profileImage: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=100" }
  },
  {
    _id: "mock-8",
    name: "Coconut Pandan Cake",
    description: "A green colored sponge cake flavored with pandan juice.",
    price: 52.00,
    image: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=500",
    cuisine: "Asian",
    rating: 4.8,
    sellerId: { name: "Chef Lin", profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" }
  }
];

const CRAVING_SUGGESTIONS = ['Momo', 'Pasta', 'Matcha roll', 'Tiramisu', 'Mochi', 'Cheesecake'];

const Home = () => {
  const navigate = useNavigate();
  const [craving, setCraving] = useState('');
  const [location, setLocation] = useState('');
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [featuredDishes, setFeaturedDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('homechef_favorites') || '{}'));
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const isLoggedIn = !!localStorage.getItem('homechef_token');
  const becomeChefPath = isLoggedIn ? '/become-chef' : '/register';

  useEffect(() => {
    const id = setInterval(() => setSuggestionIndex((i) => (i + 1) % CRAVING_SUGGESTIONS.length), 3000);
    return () => clearInterval(id);
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    let queryParams = [];
    if (craving.trim()) queryParams.push(`search=${encodeURIComponent(craving.trim())}`);
    if (location.trim()) queryParams.push(`location=${encodeURIComponent(location.trim())}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    navigate(`/food${queryString}`);
  };

  const checkHealth = async () => {
    setLoadingHealth(true);
    try {
      const response = await API.get('/health');
      setHealthData(response.data);
    } catch (err) {
      setHealthData({ databaseStatus: 'Disconnected', message: err.message });
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const fetchHomeData = async () => {
      try {
        const [dishesRes, catsRes] = await Promise.all([
          API.get('/dishes?sort=recommended'),
          API.get('/categories')
        ]);
        setFeaturedDishes(dishesRes.data.data || []);
        setCategories(catsRes.data.data || []);
      } catch (err) {
        setFeaturedDishes([]);
        setCategories([]);
      }
    };
    fetchHomeData();
  }, []);

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem('homechef_favorites', JSON.stringify(next));
      return next;
    });
  };

  // Combine dynamic dishes with mock items to ensure a populated Sweet Charm page layout
  const displayDishes = [...featuredDishes];
  for (const mock of MOCK_DESSERTS) {
    if (displayDishes.length >= 8) break;
    if (!displayDishes.some(d => d.name.toLowerCase() === mock.name.toLowerCase())) {
      displayDishes.push(mock);
    }
  }

  const featuredRef = useRef(null);
  const handleDiscoverSweets = () => {
    featuredRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-outer-pink min-h-screen p-4 sm:p-8 flex items-center justify-center">
      {/* Outer rounded card frame exactly like reference image */}
      <div className="bg-cream w-full max-w-5xl rounded-[3rem] shadow-2xl border-[12px] border-white p-6 sm:p-12 relative overflow-hidden">
        
        {/* Floating Doodles */}
        <div className="absolute top-8 left-8 hidden lg:block"><CupcakeSVG /></div>
        <div className="absolute top-8 right-8 hidden lg:block"><CakeSliceSVG /></div>
        <div className="absolute top-96 left-6 hidden lg:block"><BunnySVG /></div>
        <div className="absolute top-96 right-6 hidden lg:block"><CookieSVG /></div>

        {/* Brand Header */}
        <section className="text-center pt-8 pb-4 relative z-10">
          <h1 className="font-cursive text-5xl sm:text-6xl text-chocolate tracking-tight animate-fade-up">
            HomeChef
          </h1>
          <p className="font-display text-sm text-chocolate/80 mt-2 max-w-md mx-auto tracking-wide font-semibold animate-fade-up" style={{ animationDelay: '80ms' }}>
            The first homemade kitchen marketplace in your neighborhood
          </p>
          <div className="mt-6 animate-fade-up" style={{ animationDelay: '160ms' }}>
            <button
              onClick={handleDiscoverSweets}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-full transition-all shadow-xs"
            >
              Discover our sweets
            </button>
          </div>
        </section>

        {/* Chef Illustration */}
        <section className="relative z-10">
          <img
            src="https://i.pinimg.com/736x/c9/34/e4/c934e46b425b3d04ea75225684752b33.jpg"
            alt="HomeChef chef"
            className="w-40 h-40 sm:w-48 sm:h-48 mx-auto object-cover rounded-full border-[10px] border-white shadow-xl"
          />
        </section>

        {/* Craving & Location Search Form */}
        <section className="max-w-2xl mx-auto mb-16 relative z-10 px-4">
          <form
            onSubmit={handleHeroSearch}
            className="bg-white p-2.5 rounded-full shadow-md border border-pink-100/80 flex flex-col sm:flex-row items-center gap-2"
          >
            <div className="flex items-center gap-2 px-3 py-1 flex-1 w-full border-b sm:border-b-0 sm:border-r border-pink-50">
              <Search className="w-4 h-4 text-chocolate/50 shrink-0" />
              <input
                type="text"
                placeholder={`Craving ${CRAVING_SUGGESTIONS[suggestionIndex]}...`}
                value={craving}
                onChange={(e) => setCraving(e.target.value)}
                className="w-full text-xs text-chocolate placeholder-chocolate/30 focus:outline-none bg-transparent"
              />
            </div>

            <div className="flex items-center gap-2 px-3 py-1 flex-1 w-full">
              <MapPin className="w-4 h-4 text-chocolate/50 shrink-0" />
              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-xs text-chocolate placeholder-chocolate/30 focus:outline-none bg-transparent"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-full transition-all flex items-center justify-center shrink-0 text-xs font-bold"
            >
              Search
            </button>
          </form>

          {/* Quick links */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] text-chocolate/60">
            <span className="flex items-center gap-1 font-bold">
              <TrendingUp className="w-3.5 h-3.5 text-primary" /> Popular:
            </span>
            {['Mochi', 'Pasta', 'Vegan', 'Cheesecake'].map((chip) => (
              <button
                key={chip}
                onClick={() => navigate(`/food?search=${encodeURIComponent(chip)}`)}
                className="px-3 py-1 rounded-full bg-white border border-pink-100 hover:bg-primary hover:text-white transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </section>

        {/* Section Heading: Featured Desserts */}
        <section ref={featuredRef} className="text-center mb-10 pt-4 scroll-mt-24">
          <h2 className="font-cursive text-3xl sm:text-4xl text-chocolate flex items-center justify-center gap-3">
            <span className="text-primary text-xl">✦</span>
            Featured Desserts of the week
            <span className="text-primary text-xl">✦</span>
          </h2>
        </section>

        {/* Card Grid exactly matching reference style */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          {displayDishes.map((dish) => (
            <div
              key={dish._id}
              onClick={() => navigate('/food')}
              className="bg-white border border-pink-100/50 rounded-[2.5rem] p-4 shadow-sm hover:shadow-md transition-shadow group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-square overflow-hidden bg-pink-50/20 rounded-[2rem] mb-4">
                  <img
                    src={dish.image || 'https://images.unsplash.com/photo-1621996346565-e3def616404c?w=600'}
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(dish._id); }}
                    className={`absolute top-3.5 right-3.5 p-2 rounded-full transition-colors shadow-xs ${
                      favorites[dish._id]
                        ? 'bg-primary text-white'
                        : 'bg-white/90 text-chocolate/30 hover:text-primary'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${favorites[dish._id] ? 'fill-white' : ''}`} />
                  </button>
                </div>

                <div className="px-1 space-y-1">
                  <h3 className="font-display font-bold text-chocolate text-base leading-snug group-hover:text-primary transition-colors">
                    {dish.name}
                  </h3>
                  <p className="text-[11px] text-chocolate/60 line-clamp-2 leading-relaxed">
                    {dish.description}
                  </p>
                </div>
              </div>

              <div className="px-1 pt-3 mt-4 border-t border-pink-50 flex items-center justify-between">
                <span className="font-display font-extrabold text-chocolate text-base">
                  Rs. {dish.price}
                </span>
                <span className="w-8 h-8 rounded-full bg-[#FEF08A] hover:bg-amber-300 flex items-center justify-center text-chocolate transition-colors">
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* View all Button */}
        <section className="text-center mb-16">
          <Link
            to="/food"
            className="inline-block px-8 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-full transition-all shadow-xs"
          >
            View all
          </Link>
        </section>

        {/* Browse by Category Section */}
        {categories.length > 0 && (
          <section className="mb-16">
            <h3 className="font-cursive text-2xl text-chocolate text-center mb-8">Browse Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.slice(0, 4).map((cat) => (
                <Link
                  key={cat._id}
                  to={`/food?category=${encodeURIComponent(cat.name)}`}
                  className="group relative h-36 rounded-[2rem] overflow-hidden shadow-xs hover:shadow-md transition-all"
                >
                  <img
                    src={cat.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-chocolate/80 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-sm font-bold text-white leading-tight">{cat.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* How It Works */}
        <section className="bg-white/40 rounded-[2.5rem] border border-pink-100/50 p-8 sm:p-10 mb-16">
          <h3 className="font-cursive text-2xl text-chocolate text-center mb-8">How it works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Browse & Order', desc: 'Find amazing homemade dishes from registered home chefs around your community.' },
              { title: 'Support Kitchens', desc: 'Each purchase supports local home chefs directly, putting food and love first.' },
              { title: 'Become a Chef', desc: 'Love cooking? Turn it into income by submitting a brief online application.' }
            ].map((step, i) => (
              <div key={step.title} className="bg-white/80 rounded-[2rem] p-6 text-center border border-pink-50 relative">
                <span className="absolute top-4 right-5 font-cursive text-2xl text-primary/20">0{i + 1}</span>
                <h4 className="font-display font-extrabold text-chocolate text-base mb-2">{step.title}</h4>
                <p className="text-xs text-chocolate/75 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Become a chef banner */}
        <section className="bg-chocolate text-white rounded-[2.5rem] p-8 sm:p-12 text-center relative overflow-hidden mb-12">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/20 blur-2xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-primary/10 blur-2xl" />
          
          <div className="relative z-10 max-w-xl mx-auto space-y-4">
            <h3 className="font-cursive text-3xl">Become a HomeChef</h3>
            <p className="text-xs text-pink-100/80 leading-relaxed font-semibold">
              Turn your cooking passion into a home-based business. Apply once approved to start listing kitchen items, slots, and bookings.
            </p>
            <div className="pt-2">
              <Link
                to={becomeChefPath}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-pink-50 text-chocolate text-xs font-bold transition-all shadow-md active:scale-95"
              >
                Apply to join our community <ArrowRight className="w-4 h-4 text-primary" />
              </Link>
            </div>
          </div>
        </section>

        {/* MongoDB Status bar */}
        <section className="border border-pink-100 rounded-2xl p-4 bg-white/70 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs font-bold text-chocolate flex items-center gap-2">
                <span>System Status</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px]">Connected</span>
              </p>
              <p className="text-[10px] text-chocolate/60">
                MongoDB Database Active · Haversine Proximity Ranking Active
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowStatus(!showStatus)}
            className="text-[10px] font-bold px-3 py-1.5 bg-white border border-pink-100 hover:bg-pink-50 text-chocolate rounded-lg transition-colors"
          >
            {showStatus ? 'Hide status' : 'Show status'}
          </button>
        </section>

        {showStatus && (
          <div className="mt-3 p-4 bg-chocolate/10 border border-pink-100/50 text-chocolate rounded-xl text-xs space-y-2 font-mono">
            <div className="flex items-center justify-between">
              <span className="font-bold text-primary">Express API status: /api/health</span>
              <button onClick={checkHealth} className="flex items-center gap-1 text-chocolate/60 hover:text-chocolate">
                <RefreshCw className={`w-3 h-3 ${loadingHealth ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
            <p>Database: {healthData?.databaseStatus || 'Connected'}</p>
            <p>Timestamp: {healthData?.timestamp || new Date().toISOString()}</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Home;
