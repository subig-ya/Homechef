import React, { useEffect, useState } from 'react';
import API from '../api/axios';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async (token) => {
    const response = await API.get('/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } });
    setStats(response.data.data || null);
  };

  useEffect(() => {
    const token = localStorage.getItem('homechef_token');
    if (!token) {
      setLoading(false);
      return;
    }

    fetchStats(token)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const statLabels = {
    users: 'Users',
    sellers: 'HomeChefs',
    listings: 'Listings',
    bookings: 'Bookings',
    orders: 'Orders',
    payments: 'Payments',
    pendingApplications: 'Pending applications'
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Admin dashboard</h2>
          <p className="mt-2 text-sm text-slate-600">Platform stats and HomeChef application reviews.</p>

          {loading ? (
            <p className="mt-6 text-slate-600">Loading dashboard...</p>
          ) : !stats ? (
            <p className="mt-6 text-slate-600">No data available.</p>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(stats).map(([key, value]) => (
                <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm uppercase text-slate-500">{statLabels[key] || key}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900">HomeChef access</h3>
          <p className="mt-2 text-sm text-slate-600">
            New HomeChef accounts are enabled immediately when a user submits the form, so there is no manual approval step.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
