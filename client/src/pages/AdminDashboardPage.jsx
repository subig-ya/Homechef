import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import {
  LayoutDashboard,
  Users,
  ChefHat,
  Flag,
  Search,
  Ban,
  Undo2,
  Trash2,
  Eye,
  X,
  ShieldCheck,
  Loader2,
  Star,
  LifeBuoy,
  Send
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'chefs', label: 'Chefs', icon: ChefHat },
  { id: 'reports', label: 'Reports', icon: Flag },
  { id: 'support', label: 'Support', icon: LifeBuoy }
];

const getToken = () => localStorage.getItem('homechef_token');
const authHeaders = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

const statusStyles = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DISMISSED: 'bg-slate-50 text-slate-500 border-slate-200'
};

const roleStyles = {
  USER: 'bg-sky-50 text-sky-700 border-sky-200',
  HOMECHEF: 'bg-amber-50 text-amber-700 border-amber-200',
  ADMIN: 'bg-violet-50 text-violet-700 border-violet-200'
};

const roleLabels = { USER: 'Customer', HOMECHEF: 'Chef', ADMIN: 'Admin' };

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const ticketStatusStyles = {
  OPEN: 'bg-amber-50 text-amber-700 border-amber-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-slate-50 text-slate-500 border-slate-200'
};

const AdminDashboardPage = () => {
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [reports, setReports] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketFilter, setTicketFilter] = useState('OPEN');
  const [ticketNotes, setTicketNotes] = useState({});

  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('ALL');
  const [userStatus, setUserStatus] = useState('ALL');

  const [chefSearch, setChefSearch] = useState('');
  const [reportFilter, setReportFilter] = useState('PENDING');

  const [selectedChef, setSelectedChef] = useState(null);
  const [chefDetail, setChefDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [banTarget, setBanTarget] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const showNotice = (msg) => {
    setNotice(msg);
    setError('');
    setTimeout(() => setNotice(''), 4000);
  };

  const fetchOverview = async () => {
    const response = await API.get('/admin/dashboard', authHeaders());
    setStats(response.data.data || {});
  };

  const fetchUsers = async () => {
    const params = {};
    if (userSearch.trim()) params.search = userSearch.trim();
    if (userRole !== 'ALL') params.role = userRole;
    if (userStatus !== 'ALL') params.status = userStatus;
    const response = await API.get('/admin/users', { ...authHeaders(), params });
    setUsers(response.data.data || []);
  };

  const fetchChefs = async () => {
    const response = await API.get('/admin/chefs', authHeaders());
    setChefs(response.data.data || []);
  };

  const fetchReports = async () => {
    const response = await API.get('/admin/reports', { ...authHeaders(), params: { status: reportFilter } });
    setReports(response.data.data || []);
  };

  const fetchTickets = async () => {
    const response = await API.get('/admin/support', { ...authHeaders(), params: { status: ticketFilter } });
    setTickets(response.data.data || []);
  };

  const refreshAll = async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([fetchOverview(), fetchUsers(), fetchChefs(), fetchReports(), fetchTickets()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (tab === 'reports') fetchReports();
    if (tab === 'chefs') fetchChefs();
    if (tab === 'support') fetchTickets();
  }, [tab, reportFilter, ticketFilter]);

  useEffect(() => {
    if (tab !== 'users') return;
    const timer = setTimeout(() => fetchUsers(), 250);
    return () => clearTimeout(timer);
  }, [tab, userSearch, userRole, userStatus]);

  // ---- Chef actions ----

  const openDetail = async (chef) => {
    setSelectedChef(chef);
    setDetailLoading(true);
    setChefDetail(null);
    try {
      const response = await API.get(`/admin/chefs/${chef._id}`, authHeaders());
      setChefDetail(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load chef activity.');
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmBan = async () => {
    if (!banTarget) return;
    setBusy(true);
    try {
      const url = banTarget.type === 'user' ? `/admin/users/${banTarget._id}/ban` : `/admin/chefs/${banTarget._id}/ban`;
      await API.put(url, { reason: banReason }, authHeaders());
      showNotice(`${banTarget.name} has been banned.`);
      setBanTarget(null);
      setBanReason('');
      await Promise.all([fetchChefs(), fetchReports(), fetchUsers(), fetchOverview()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to ban account.');
    } finally {
      setBusy(false);
    }
  };

  const toggleUserStatus = async (user) => {
    setBusy(true);
    try {
      if (!user.isBanned) {
        setBanTarget({ _id: user._id, name: user.name, role: user.role, type: 'user' });
        setBusy(false);
        return;
      }
      await API.put(`/admin/users/${user._id}/unban`, {}, authHeaders());
      showNotice(`${user.name} is no longer banned.`);
      await Promise.all([fetchUsers(), fetchOverview(), fetchChefs()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update account status.');
    } finally {
      setBusy(false);
    }
  };

  const toggleBan = async (chef) => {
    setBusy(true);
    try {
      const action = chef.isBanned ? 'unban' : 'ban';
      if (action === 'ban') {
        setBanTarget(chef);
        setBusy(false);
        return;
      }
      await API.put(`/admin/chefs/${chef._id}/unban`, {}, authHeaders());
      showNotice(`${chef.name} is no longer banned.`);
      await fetchChefs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update chef status.');
    } finally {
      setBusy(false);
    }
  };

  const removeChef = async (chef) => {
    if (!window.confirm(`Permanently remove ${chef.name} and all of their data? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await API.delete(`/admin/chefs/${chef._id}`, authHeaders());
      showNotice(`${chef.name} has been removed.`);
      await Promise.all([fetchChefs(), fetchReports()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove chef.');
    } finally {
      setBusy(false);
    }
  };

  // ---- Report actions ----

  const setReportStatus = async (report, status) => {
    setBusy(true);
    try {
      await API.put(`/admin/reports/${report._id}`, { status }, authHeaders());
      showNotice(`Report marked ${status.toLowerCase()}.`);
      await Promise.all([fetchReports(), fetchChefs()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update report.');
    } finally {
      setBusy(false);
    }
  };

  const reportBanChef = (report) => {
    if (report.targetType === 'CHEF' && report.targetSummary) {
      setBanTarget({
        _id: report.targetSummary._id,
        name: report.targetSummary.name,
        isBanned: report.targetSummary.isBanned,
        type: 'chef'
      });
    }
  };

  // ---- Support ticket actions ----

  const updateTicket = async (ticket, status) => {
    setBusy(true);
    try {
      await API.put(`/admin/support/${ticket._id}`, { status, adminNote: ticketNotes[ticket._id] || '' }, authHeaders());
      showNotice(`Ticket marked ${status.replace('_', ' ').toLowerCase()}.`);
      setTicketNotes((prev) => ({ ...prev, [ticket._id]: '' }));
      await fetchTickets();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update ticket.');
    } finally {
      setBusy(false);
    }
  };

  const filteredChefs = chefs.filter((chef) =>
    `${chef.name} ${chef.email}`.toLowerCase().includes(chefSearch.toLowerCase())
  );

  const statLabels = {
    users: 'Total Users',
    chefs: 'Total Chefs',
    listings: 'Total Food Items',
    bookings: 'Total Bookings',
    orders: 'Total Orders',
    payments: 'Payments',
    pendingApplications: 'Pending applications',
    pendingReports: 'Pending reports',
    pendingSupport: 'Open support tickets'
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin panel</h1>
            <p className="mt-1 text-sm text-slate-500">Platform moderation, chef activity, and reports.</p>
          </div>
          <button
            onClick={refreshAll}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
          </button>
        </div>

        <div className="mx-auto flex max-w-7xl gap-1 px-4 pb-3 sm:px-8">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  tab === t.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        {notice && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            {notice}
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {tab === 'overview' && (
          <section>
            {stats ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Object.entries(stats).map(([key, value]) => (
                  <div key={key} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {statLabels[key] || key}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No data yet.</p>
            )}
          </section>
        )}

        {tab === 'users' && (
          <section className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative lg:w-96">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
                  {['ALL', 'USER', 'HOMECHEF', 'ADMIN'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setUserRole(r)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                        userRole === r ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {r === 'ALL' ? 'All roles' : roleLabels[r]}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
                  {['ALL', 'active', 'banned'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setUserStatus(s)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                        userStatus === s ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {s === 'ALL' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Registered</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.profileImage || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=80'}
                            alt={user.name}
                            className="h-9 w-9 rounded-full border border-slate-200 object-cover"
                          />
                          <div>
                            <p className="font-semibold text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${roleStyles[user.role]}`}>
                          {roleLabels[user.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(user.joinedAt)}</td>
                      <td className="px-4 py-3">
                        {user.isBanned ? (
                          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">Banned</span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.role !== 'ADMIN' && (
                          <button
                            onClick={() => toggleUserStatus(user)}
                            title={user.isBanned ? 'Unban' : 'Ban'}
                            disabled={busy}
                            className={`rounded-lg p-2 ${user.isBanned ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-600 hover:bg-red-50'}`}
                          >
                            {user.isBanned ? <Undo2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-10 text-center text-sm text-slate-400">
                        No users match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'chefs' && (
          <section className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={chefSearch}
                onChange={(e) => setChefSearch(e.target.value)}
                placeholder="Search chefs by name or email..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Chef</th>
                    <th className="px-4 py-3 font-semibold">Listings</th>
                    <th className="px-4 py-3 font-semibold">Bookings</th>
                    <th className="px-4 py-3 font-semibold">Orders</th>
                    <th className="px-4 py-3 font-semibold">Revenue</th>
                    <th className="px-4 py-3 font-semibold">Rating</th>
                    <th className="px-4 py-3 font-semibold">Reports</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredChefs.map((chef) => (
                    <tr key={chef._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={chef.profileImage || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=80'}
                            alt={chef.name}
                            className="h-9 w-9 rounded-full border border-slate-200 object-cover"
                          />
                          <div>
                            <p className="font-semibold text-slate-900">{chef.name}</p>
                            <p className="text-xs text-slate-400">{chef.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{chef.listingCount}</td>
                      <td className="px-4 py-3 text-slate-600">{chef.bookingCount}</td>
                      <td className="px-4 py-3 text-slate-600">{chef.orderCount}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">Rs. {chef.revenue.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="font-semibold text-slate-900">{chef.bayesianRating.toFixed(2)}</span>
                          <span className="text-xs text-slate-400">({chef.reviewCount})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {chef.pendingReports > 0 ? (
                          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                            {chef.pendingReports}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {chef.isBanned ? (
                          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">Banned</span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openDetail(chef)}
                            title="View activity"
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleBan(chef)}
                            title={chef.isBanned ? 'Unban' : 'Ban'}
                            disabled={busy}
                            className={`rounded-lg p-2 ${chef.isBanned ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-600 hover:bg-red-50'}`}
                          >
                            {chef.isBanned ? <Undo2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => removeChef(chef)}
                            title="Remove permanently"
                            disabled={busy}
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredChefs.length === 0 && (
                    <tr>
                      <td colSpan="9" className="px-4 py-10 text-center text-sm text-slate-400">
                        No chefs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'reports' && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {['PENDING', 'RESOLVED', 'DISMISSED'].map((s) => (
                <button
                  key={s}
                  onClick={() => setReportFilter(s)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                    reportFilter === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                          {report.targetType}
                        </span>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[report.status]}`}>
                          {report.status}
                        </span>
                        <span className="text-xs text-slate-400">
                          Reported by {report.reporterId?.name || 'a user'} ·{' '}
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {report.targetType === 'CHEF' && report.targetSummary
                          ? report.targetSummary.name
                          : report.targetType === 'DISH' && report.targetSummary
                            ? report.targetSummary.name
                            : report.targetType === 'REVIEW' && report.targetSummary
                              ? `Review (${report.targetSummary.rating}★)`
                              : 'Target removed'}
                      </p>

                      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">{report.reason}</p>

                      {report.targetType === 'CHEF' && report.targetSummary && (
                        <p className="mt-2 text-xs text-slate-400">
                          Email: {report.targetSummary.email} ·{' '}
                          {report.targetSummary.isBanned ? 'Currently banned' : 'Active'}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {report.status === 'PENDING' && report.targetType === 'CHEF' && report.targetSummary && (
                        <button
                          onClick={() => reportBanChef(report)}
                          disabled={report.targetSummary.isBanned || busy}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          <Ban className="h-3.5 w-3.5" /> Ban chef
                        </button>
                      )}
                      {report.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => setReportStatus(report, 'RESOLVED')}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" /> Resolve
                          </button>
                          <button
                            onClick={() => setReportStatus(report, 'DISMISSED')}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {reports.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
                  No {reportFilter.toLowerCase()} reports.
                </p>
              )}
            </div>
          </section>
        )}

        {tab === 'support' && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => (
                <button
                  key={s}
                  onClick={() => setTicketFilter(s)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                    ticketFilter === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                          {ticket.category?.replace('_', ' ')}
                        </span>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${ticketStatusStyles[ticket.status]}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400">
                          {ticket.chefId?.name || 'Unknown chef'} · {ticket.chefId?.email || ''} ·{' '}
                          {new Date(ticket.createdAt).toLocaleDateString()} ·{' '}
                          {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{ticket.subject}</p>
                      <p className="mt-1 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{ticket.message}</p>
                      {ticket.adminNote && (
                        <p className="mt-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                          <span className="font-bold text-slate-700">Your response: </span>
                          {ticket.adminNote}
                        </p>
                      )}
                    </div>

                    <div className="w-full shrink-0 sm:w-72">
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Response / note to chef
                      </label>
                      <textarea
                        rows="2"
                        value={ticketNotes[ticket._id] ?? ''}
                        onChange={(e) => setTicketNotes((prev) => ({ ...prev, [ticket._id]: e.target.value }))}
                        placeholder="Leave a note for the chef..."
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900"
                      />
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          onClick={() => updateTicket(ticket, 'IN_PROGRESS')}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
                        >
                          <Send className="h-3.5 w-3.5" /> In progress
                        </button>
                        <button
                          onClick={() => updateTicket(ticket, 'RESOLVED')}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" /> Resolve
                        </button>
                        <button
                          onClick={() => updateTicket(ticket, 'CLOSED')}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {tickets.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
                  No {ticketFilter.toLowerCase().replace('_', ' ')} support tickets.
                </p>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Chef activity modal */}
      {selectedChef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{selectedChef.name} — activity</h3>
              <button onClick={() => setSelectedChef(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {detailLoading ? (
              <p className="py-10 text-center text-sm text-slate-500">Loading activity...</p>
            ) : chefDetail ? (
              <div className="mt-4 space-y-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Listings', value: chefDetail.listingCount },
                    { label: 'Bookings', value: chefDetail.bookingCount },
                    { label: 'Orders', value: chefDetail.orderCount },
                    { label: 'Revenue', value: `Rs. ${chefDetail.revenue.toLocaleString()}` }
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-slate-50 p-4 text-center">
                      <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{item.label}</p>
                    </div>
                  ))}
                </div>

                {chefDetail.slots?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Recent slots</h4>
                    <div className="mt-2 space-y-1">
                      {chefDetail.slots.slice(0, 8).map((slot) => (
                        <p key={slot._id} className="text-xs text-slate-600">
                          {slot.date} · {slot.slotType} · {slot.status}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {chefDetail.bookings?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Recent bookings</h4>
                    <div className="mt-2 space-y-1">
                      {chefDetail.bookings.slice(0, 8).map((booking) => (
                        <p key={booking._id} className="text-xs text-slate-600">
                          {booking.date} · {booking.status} · {booking.paymentStatus} · Rs. {booking.totalAmount}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {chefDetail.orders?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Recent orders</h4>
                    <div className="mt-2 space-y-1">
                      {chefDetail.orders.slice(0, 8).map((order) => (
                        <p key={order._id} className="text-xs text-slate-600">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''} · {order.status} ·{' '}
                          {order.paymentStatus} · Rs. {order.totalAmount}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {chefDetail.reports?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Reports against this chef</h4>
                    <div className="mt-2 space-y-2">
                      {chefDetail.reports.map((report) => (
                        <div key={report._id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                          <span className={`font-bold ${statusStyles[report.status]}`}>{report.status}</span> — {report.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Ban confirmation modal */}
      {banTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              {banTarget.isBanned ? 'Ban again' : 'Ban'} {banTarget.name}?
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Banned accounts cannot log in or use the platform. You can unban them later.
            </p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              rows="3"
              placeholder="Reason (shown to admin & stored in the audit trail)..."
              className="mt-4 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setBanTarget(null);
                  setBanReason('');
                }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmBan}
                disabled={busy}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {busy ? 'Banning...' : 'Ban account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
