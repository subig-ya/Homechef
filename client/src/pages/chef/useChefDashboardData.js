import { useCallback, useEffect, useState } from 'react';
import API from '../../api/axios';

// Single source of truth for every dataset the chef dashboard renders.
// All requests run in parallel; a failure in one area never blanks the whole
// dashboard (allSettled + per-slice state).
const useChefDashboardData = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [slots, setSlots] = useState([]);
  const [reviews, setReviews] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [categories, setCategories] = useState([]);
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
      API.get('/orders/seller', { headers }),
      API.get('/bookings/seller', { headers }),
      API.get('/dishes/my', { headers }),
      API.get('/slots/chef', { headers }),
      API.get('/chefs/me/reviews', { headers }),
      API.get('/notifications', { headers }),
      API.get('/categories', { headers })
    ]).then(([u, o, b, d, s, r, n, c]) => {
      if (u.status === 'fulfilled') setUser(u.value.data.data);
      if (o.status === 'fulfilled') setOrders(o.value.data.data || []);
      if (b.status === 'fulfilled') setBookings(b.value.data.data || []);
      if (d.status === 'fulfilled') setDishes(d.value.data.data || []);
      if (s.status === 'fulfilled') setSlots(s.value.data.data || []);
      if (r.status === 'fulfilled') setReviews(r.value.data.data);
      if (n.status === 'fulfilled') setNotifications(n.value.data.data || []);
      if (c.status === 'fulfilled') setCategories(c.value.data.data || []);
      if (u.status === 'rejected') {
        setError(u.reason?.response?.data?.message || 'Unable to load your profile.');
      }
      setLoading(false);
    });
  }, [version]);

  return {
    user,
    orders,
    bookings,
    dishes,
    slots,
    reviews,
    notifications,
    categories,
    loading,
    error,
    refresh
  };
};

export default useChefDashboardData;
