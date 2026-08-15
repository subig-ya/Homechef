import { useCallback, useEffect, useMemo, useState } from 'react';
import API from '../../api/axios';

// Single source of truth for every dataset the customer dashboard renders.
// All requests run in parallel; a failure in one area never blanks the whole
// dashboard (allSettled + per-slice state).
const useCustomerDashboardData = () => {
  const [user, setUser] = useState(null);
  const [chefs, setChefs] = useState([]);
  const [nearbyChefs, setNearbyChefs] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [popularDishes, setPopularDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    const token = localStorage.getItem('homechef_token');
    if (!token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    setLoading(true);

    Promise.allSettled([
      API.get('/auth/me', { headers }),
      API.get('/favorites', { headers }),
      API.get('/bookings/my', { headers }),
      API.get('/orders/my', { headers }),
      API.get('/notifications', { headers }),
      API.get('/categories')
    ]).then(async ([u, f, b, o, n, c]) => {
      const currentUser = u.status === 'fulfilled' ? u.value.data.data : null;

      if (u.status === 'fulfilled') setUser(currentUser);
      if (f.status === 'fulfilled') setFavorites(f.value.data.data || []);
      if (b.status === 'fulfilled') setBookings(b.value.data.data || []);
      if (o.status === 'fulfilled') setOrders(o.value.data.data || []);
      if (n.status === 'fulfilled') setNotifications(n.value.data.data || []);
      if (c.status === 'fulfilled') setCategories(c.value.data.data || []);
      if (u.status === 'rejected') {
        setError(u.reason?.response?.data?.message || 'Unable to load your profile.');
      }

      // Discovery feeds depend on the user's saved coordinates for distance
      // ranking; fall back to Kathmandu when none are stored yet.
      const lat = Number(currentUser?.location?.latitude ?? currentUser?.latitude ?? 0);
      const lon = Number(currentUser?.location?.longitude ?? currentUser?.longitude ?? 0);
      const coords = lat && lon ? `&userLat=${lat}&userLon=${lon}` : '';

      const [d, p, ch, nh] = await Promise.allSettled([
        API.get('/dishes?sort=recommended'),
        API.get('/dishes?sort=popular'),
        API.get('/chefs'),
        API.get(`/chefs?sort=nearby${coords}`)
      ]);

      if (d.status === 'fulfilled') setDishes(d.value.data.data || []);
      if (p.status === 'fulfilled') setPopularDishes(p.value.data.data || []);
      if (ch.status === 'fulfilled') setChefs(ch.value.data.data || []);
      if (nh.status === 'fulfilled') setNearbyChefs(nh.value.data.data || []);

      setLoading(false);
    });
  }, [version]);

  // Derived sets for instant heart state on cards.
  const favoriteChefIds = useMemo(() => new Set(
    favorites.filter((f) => f.targetType === 'CHEF').map((f) => f.targetId)
  ), [favorites]);
  const favoriteDishIds = useMemo(() => new Set(
    favorites.filter((f) => f.targetType === 'DISH').map((f) => f.targetId)
  ), [favorites]);

  // Toggle a favorite on the server, then sync local state. Returns the new
  // favorited state so the caller can optimistically reflect it.
  const toggleFavorite = useCallback(async (targetType, targetId) => {
    const token = localStorage.getItem('homechef_token');
    if (!token) throw new Error('not-authenticated');

    const res = await API.post(
      '/favorites/toggle',
      { targetType, targetId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const favorited = res.data.favorited;

    setFavorites((prev) => {
      if (favorited) {
        return [{ _id: `pending-${targetId}`, targetType, targetId, createdAt: new Date().toISOString(), target: null }, ...prev];
      }
      return prev.filter((f) => !(f.targetType === targetType && f.targetId === targetId));
    });

    return favorited;
  }, []);

  return {
    user,
    chefs,
    nearbyChefs,
    dishes,
    popularDishes,
    categories,
    bookings,
    orders,
    notifications,
    favorites,
    favoriteChefIds,
    favoriteDishIds,
    loading,
    error,
    refresh,
    toggleFavorite
  };
};

export default useCustomerDashboardData;
