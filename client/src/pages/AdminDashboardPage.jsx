import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import { Check, X, ChefHat, ChevronDown, ChevronUp, UtensilsCrossed } from 'lucide-react';

const KITCHEN_TYPE_LABELS = {
  HOME_KITCHEN: 'Home kitchen',
  RENTED_KITCHEN: 'Rented/communal kitchen',
  COMMUNITY_KITCHEN: 'Community kitchen',
  COMMERCIAL_KITCHEN: 'Commercial kitchen',
  OTHER: 'Other'
};

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [actionMsg, setActionMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [note, setNote] = useState('');
  const [expandedMenuId, setExpandedMenuId] = useState(null);

  const fetchStats = async (token) => {
    const response = await API.get('/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } });
    setStats(response.data.data || null);
  };

  const fetchApplications = async (token, statusFilter) => {
    const params = statusFilter ? `?status=${statusFilter}` : '';
    const response = await API.get(`/homechef/admin/applications${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setApplications(response.data.data || []);
  };

  useEffect(() => {
    const token = localStorage.getItem('homechef_token');
    if (!token) {
      setLoading(false);
      setAppsLoading(false);
      return;
    }

    Promise.allSettled([fetchStats(token), fetchApplications(token, filter)])
      .finally(() => {
        setLoading(false);
        setAppsLoading(false);
      });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('homechef_token');
    if (token) {
      fetchApplications(token, filter).catch(() => {});
    }
  }, [filter]);

  const reviewApplication = async (id, action) => {
    setActionMsg('');
    setErrorMsg('');
    try {
      const token = localStorage.getItem('homechef_token');
      const endpoint = `/homechef/admin/applications/${id}/${action}`;
      const response = await API.put(endpoint, { adminNote: note }, { headers: { Authorization: `Bearer ${token}` } });
      setActionMsg(response.data.message || `Application ${action}d.`);
      setNote('');
      await Promise.all([fetchStats(token), fetchApplications(token, filter)]);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || `Unable to ${action} the application.`);
    }
  };

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">HomeChef applications</h3>
              <p className="mt-1 text-sm text-slate-600">Review and decide on chef applications.</p>
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 gap-1">
              {[
                { key: 'PENDING', label: 'Pending' },
                { key: 'APPROVED', label: 'Approved' },
                { key: 'REJECTED', label: 'Rejected' }
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3.5 py-1.5 rounded-lg transition-all ${
                    filter === f.key ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {actionMsg && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
              {actionMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {errorMsg}
            </div>
          )}

          {filter === 'PENDING' && (
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note for the applicant..."
              className="mt-4 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B254B]"
            />
          )}

          <div className="mt-4 space-y-3">
            {appsLoading ? (
              <p className="text-slate-600">Loading applications...</p>
            ) : applications.length === 0 ? (
              <p className="text-slate-500">No {filter.toLowerCase()} applications.</p>
            ) : (
              applications.map((app) => (
                <div key={app._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="p-2 rounded-xl bg-[#4B254B]/10 text-[#4B254B]">
                        <ChefHat className="w-5 h-5" />
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">{app.fullName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {app.user?.email} · {app.phone} · {app.location}
                        </p>
                        {app.about && <p className="text-xs text-slate-600 mt-1.5">{app.about}</p>}
                        {app.specialties?.length > 0 && (
                          <p className="text-xs text-slate-500 mt-1">
                            <span className="font-semibold text-slate-700">Specialties:</span>{' '}
                            {app.specialties.join(', ')}
                          </p>
                        )}
                        {(app.yearsOfExperience > 0 || app.kitchenType || app.serviceArea) && (
                          <p className="text-xs text-slate-500 mt-1">
                            {app.yearsOfExperience > 0 && (
                              <span className="mr-2">
                                <span className="font-semibold text-slate-700">{app.yearsOfExperience}</span> yrs experience
                              </span>
                            )}
                            {app.kitchenType && (
                              <span className="mr-2">
                                <span className="font-semibold text-slate-700">{KITCHEN_TYPE_LABELS[app.kitchenType] || app.kitchenType}</span>
                              </span>
                            )}
                            {app.serviceArea && (
                              <span>
                                Serves <span className="font-semibold text-slate-700">{app.serviceArea}</span>
                              </span>
                            )}
                          </p>
                        )}

                        {/* Menu in detail */}
                        {app.menuItems?.length > 0 && (
                          <div className="mt-3">
                            <button
                              onClick={() => setExpandedMenuId(expandedMenuId === app._id ? null : app._id)}
                              className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-[#4B254B]/40 hover:text-[#4B254B] transition-colors"
                            >
                              <UtensilsCrossed className="w-3.5 h-3.5" />
                              View menu ({app.menuItems.length} item{app.menuItems.length !== 1 ? 's' : ''})
                              {expandedMenuId === app._id ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {expandedMenuId === app._id && (
                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                {app.menuItems.map((item, i) => (
                                  <div key={i} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3">
                                    <img
                                      src={item.image || 'https://images.unsplash.com/photo-1621996346565-e3def616404c?w=300'}
                                      alt={item.name}
                                      className="h-20 w-20 shrink-0 rounded-lg border border-slate-200 object-cover"
                                    />
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold text-slate-900 truncate">
                                        {item.name}{' '}
                                        {item.price > 0 && (
                                          <span className="font-bold text-[#4B254B]">Rs. {item.price}</span>
                                        )}
                                      </p>
                                      {item.cuisine && <p className="text-[11px] text-slate-500 mt-0.5">{item.cuisine}</p>}
                                      {item.dietary?.length > 0 && (
                                        <p className="text-[11px] text-slate-500">{item.dietary.join(', ')}</p>
                                      )}
                                      {item.description && (
                                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        <p className="text-[11px] text-slate-400 mt-1">
                          Submitted {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                        {app.status !== 'PENDING' && app.reviewedBy && (
                          <p className="text-[11px] text-slate-500 mt-1">
                            Reviewed by {app.reviewedBy.name} on {new Date(app.reviewedAt).toLocaleDateString()}
                            {app.adminNote ? ` — ${app.adminNote}` : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    {app.status === 'PENDING' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => reviewApplication(app._id, 'approve')}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => reviewApplication(app._id, 'reject')}
                          className="flex items-center gap-1.5 rounded-xl bg-red-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-600"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
