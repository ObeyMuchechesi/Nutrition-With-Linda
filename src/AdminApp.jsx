import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CalendarHeart,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Leaf,
  LockKeyhole,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import './admin.css';

const PAGE_SIZE = 25;
const BOOKING_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

async function readJson(response) {
  return response.json().catch(() => ({}));
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeZone: 'Africa/Harare' }).format(new Date(value));
}

function statusLabel(value) {
  return (value || 'pending').replace(/^./, (letter) => letter.toUpperCase());
}

export default function AdminApp() {
  const [authState, setAuthState] = useState('checking');
  const [adminConfigured, setAdminConfigured] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [overview, setOverview] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [pageError, setPageError] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingBookingId, setSavingBookingId] = useState('');

  async function loadDashboard({ nextPage = page, nextStatus = statusFilter, nextSearch = activeSearch } = {}) {
    setLoading(true);
    setPageError('');
    const params = new URLSearchParams({ page: String(nextPage), limit: String(PAGE_SIZE), status: nextStatus, search: nextSearch });

    try {
      const [overviewResponse, bookingsResponse] = await Promise.all([
        fetch('/api/admin/overview', { cache: 'no-store' }),
        fetch(`/api/admin/bookings?${params.toString()}`, { cache: 'no-store' }),
      ]);
      const [overviewData, bookingsData] = await Promise.all([readJson(overviewResponse), readJson(bookingsResponse)]);

      if (overviewResponse.status === 401 || bookingsResponse.status === 401) {
        setAuthState('login');
        return false;
      }
      if (!overviewResponse.ok || !bookingsResponse.ok) {
        throw new Error(overviewData.message || bookingsData.message || 'The dashboard could not be loaded.');
      }

      setOverview(overviewData);
      setBookings(bookingsData.bookings || []);
      setPage(bookingsData.page || nextPage);
      setTotalPages(bookingsData.totalPages || 1);
      setTotalBookings(bookingsData.total || 0);
      setStatusFilter(nextStatus);
      setActiveSearch(nextSearch);
      setAuthState('dashboard');
      return true;
    } catch (error) {
      setPageError(error.message || 'The dashboard could not be loaded.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isCurrent = true;
    async function checkAdminSession() {
      try {
        const response = await fetch('/api/admin/status', { cache: 'no-store' });
        const data = await readJson(response);
        if (!isCurrent) return;
        setAdminConfigured(Boolean(data.configured));
        if (!data.configured) {
          setAuthState('setup');
          setLoading(false);
          return;
        }
        if (!data.authenticated) {
          setAuthState('login');
          setLoading(false);
          return;
        }
        await loadDashboard({ nextPage: 1, nextStatus: 'all', nextSearch: '' });
      } catch {
        if (!isCurrent) return;
        setAuthState('error');
        setPageError('The admin service could not be reached. Please try again later.');
        setLoading(false);
      }
    }
    checkAdminSession();
    return () => { isCurrent = false; };
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await readJson(response);
      if (!response.ok) {
        if (response.status === 503) setAdminConfigured(false);
        throw new Error(data.message || 'Sign-in failed. Please check your details.');
      }
      setLoginForm((previous) => ({ ...previous, password: '' }));
      const loaded = await loadDashboard({ nextPage: 1, nextStatus: 'all', nextSearch: '' });
      if (!loaded) setLoginError('Your session could not be started. Please sign in again.');
    } catch (error) {
      setLoginError(error.message || 'Sign-in failed. Please try again.');
      setAuthState(adminConfigured ? 'login' : 'setup');
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
    setOverview(null);
    setBookings([]);
    setLoginForm({ email: '', password: '' });
    setLoginError('');
    setAuthState('login');
  }

  async function updateBookingStatus(bookingId, status) {
    setSavingBookingId(bookingId);
    setPageError('');
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.message || 'The booking status could not be changed.');
      await loadDashboard({ nextPage: page, nextStatus: statusFilter, nextSearch: activeSearch });
    } catch (error) {
      setPageError(error.message || 'The booking status could not be changed.');
    } finally {
      setSavingBookingId('');
    }
  }

  function submitSearch(event) {
    event.preventDefault();
    loadDashboard({ nextPage: 1, nextStatus: statusFilter, nextSearch: searchInput.trim() });
  }

  function changeStatusFilter(event) {
    const nextStatus = event.target.value;
    setStatusFilter(nextStatus);
    loadDashboard({ nextPage: 1, nextStatus, nextSearch: activeSearch });
  }

  if (authState === 'checking' || (loading && authState !== 'dashboard' && authState !== 'login' && authState !== 'setup' && authState !== 'error')) {
    return <AdminShell><div className="admin-loading"><span className="admin-spinner" /> Checking admin access…</div></AdminShell>;
  }

  if (authState === 'setup' || !adminConfigured) {
    return (
      <AdminShell>
        <div className="admin-login-card admin-setup-card">
          <span className="admin-login-icon"><ShieldCheck size={23} /></span>
          <p className="admin-eyebrow">Secure dashboard</p>
          <h1>Admin access needs setup</h1>
          <p className="admin-login-copy">Add the admin sign-in settings to the Vercel project’s Production environment to enable this dashboard.</p>
          <div className="admin-setup-list">
            <span><code>ADMIN_EMAIL</code> — the admin sign-in email</span>
            <span><code>ADMIN_PASSWORD</code> — a unique password with at least 12 characters</span>
            <span><code>ADMIN_SESSION_SECRET</code> — a random secret with at least 32 characters</span>
          </div>
          <p className="admin-setup-footnote">Mark all three as sensitive environment variables, then redeploy.</p>
          <a className="admin-back-link" href="/"><ArrowLeft size={15} /> Back to the website</a>
        </div>
      </AdminShell>
    );
  }

  if (authState === 'error') {
    return (
      <AdminShell>
        <div className="admin-login-card">
          <span className="admin-login-icon"><Activity size={23} /></span>
          <p className="admin-eyebrow">Admin dashboard</p>
          <h1>We couldn’t connect</h1>
          <p className="admin-login-copy">{pageError}</p>
          <button className="admin-primary-button" onClick={() => window.location.reload()}><RefreshCw size={16} /> Try again</button>
        </div>
      </AdminShell>
    );
  }

  if (authState === 'login') {
    return (
      <AdminShell>
        <div className="admin-login-card">
          <span className="admin-login-icon"><LockKeyhole size={22} /></span>
          <p className="admin-eyebrow">Nutrition with Linda</p>
          <h1>Admin sign in</h1>
          <p className="admin-login-copy">Sign in to view consultation requests and dashboard insights.</p>
          <form className="admin-login-form" onSubmit={handleLogin}>
            <label htmlFor="admin-email">Email address</label>
            <input id="admin-email" type="email" autoComplete="username" required value={loginForm.email} onChange={(event) => setLoginForm((previous) => ({ ...previous, email: event.target.value }))} />
            <label htmlFor="admin-password">Password</label>
            <input id="admin-password" type="password" autoComplete="current-password" required value={loginForm.password} onChange={(event) => setLoginForm((previous) => ({ ...previous, password: event.target.value }))} />
            {loginError && <p className="admin-form-error" role="alert">{loginError}</p>}
            <button className="admin-primary-button admin-login-submit" disabled={loading} type="submit">{loading ? 'Signing in…' : 'Sign in'} <ArrowLeft className="admin-submit-arrow" size={16} /></button>
          </form>
          <a className="admin-back-link" href="/"><ArrowLeft size={15} /> Back to the website</a>
        </div>
      </AdminShell>
    );
  }

  const trend = overview?.monthlyTrend || [];
  const maxTrend = Math.max(1, ...trend.map((entry) => entry.count));

  return (
    <AdminShell>
      <header className="admin-header">
        <a className="admin-brand" href="/" aria-label="Nutrition with Linda home">
          <span className="admin-brand-icon"><Leaf size={18} /></span>
          <span><strong>Nutrition</strong><small>with Linda</small></span>
        </a>
        <div className="admin-header-actions">
          <span className="admin-secure-label"><ShieldCheck size={15} /> Private admin area</span>
          <button className="admin-logout-button" onClick={handleLogout}><LogOut size={16} /> <span>Sign out</span></button>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-page-heading">
          <div>
            <p className="admin-eyebrow">Your practice at a glance</p>
            <h1>Bookings dashboard</h1>
            <p className="admin-page-intro">Review consultation requests and keep track of what’s coming up.</p>
          </div>
          <button className="admin-refresh-button" disabled={loading} onClick={() => loadDashboard()}><RefreshCw size={15} className={loading ? 'admin-rotating' : ''} /> Refresh</button>
        </div>

        {pageError && <div className="admin-alert" role="alert">{pageError}</div>}

        <section className="admin-kpi-grid" aria-label="Booking key performance indicators">
          <KpiCard icon={UsersRound} label="Total requests" value={overview?.totalRequests ?? '—'} detail="All consultation requests" />
          <KpiCard icon={Clock3} label="Awaiting a response" value={overview?.pendingRequests ?? '—'} detail="Requests marked pending" />
          <KpiCard icon={CalendarHeart} label="Upcoming consultations" value={overview?.upcomingConsultations ?? '—'} detail="Pending or confirmed dates" />
          <KpiCard icon={CalendarDays} label="This month" value={overview?.thisMonthRequests ?? '—'} detail="Requests received this month" />
        </section>

        <section className="admin-overview-grid">
          <div className="admin-panel admin-trend-panel">
            <div className="admin-panel-heading">
              <div><p className="admin-eyebrow">Recent activity</p><h2>Request trend</h2></div>
              <span className="admin-panel-icon"><Activity size={18} /></span>
            </div>
            <div className="admin-chart" role="img" aria-label="Booking requests received in the past six months">
              {trend.map((entry) => (
                <div className="admin-chart-column" key={entry.month}>
                  <span className="admin-chart-value">{entry.count}</span>
                  <div className="admin-chart-track"><span style={{ height: `${Math.max(5, (entry.count / maxTrend) * 100)}%` }} /></div>
                  <span className="admin-chart-label">{entry.month}</span>
                </div>
              ))}
            </div>
            <p className="admin-chart-caption">New requests by month</p>
          </div>

          <div className="admin-panel admin-note-panel">
            <span className="admin-note-icon"><Check size={18} /></span>
            <p className="admin-eyebrow">A simple workflow</p>
            <h2>Keep every request moving</h2>
            <p>Update each request as you follow up. The status helps you see which people still need a reply and which appointments are confirmed.</p>
            <div className="admin-status-key"><span className="status-dot status-dot-pending" /> Pending <span className="status-dot status-dot-confirmed" /> Confirmed</div>
          </div>
        </section>

        <section className="admin-panel admin-bookings-panel">
          <div className="admin-panel-heading admin-bookings-heading">
            <div><p className="admin-eyebrow">Client enquiries</p><h2>Consultation requests <span className="admin-count-pill">{totalBookings}</span></h2></div>
            <form className="admin-search-form" onSubmit={submitSearch}>
              <label className="admin-search-box"><Search size={16} /><input aria-label="Search bookings" placeholder="Search name, email or phone" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} /></label>
              <button className="admin-search-button" type="submit">Search</button>
            </form>
          </div>

          <div className="admin-booking-toolbar">
            <span>{activeSearch ? `Results for “${activeSearch}”` : 'Latest requests first'}</span>
            <label className="admin-filter-label">Status
              <select value={statusFilter} onChange={changeStatusFilter}>
                <option value="all">All requests</option>
                {BOOKING_STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
              </select>
            </label>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-bookings-table">
              <thead><tr><th>Client</th><th>Preferred date</th><th>Received</th><th>Status</th><th><span className="sr-only">Update status</span></th></tr></thead>
              <tbody>
                {bookings.map((booking) => {
                  const status = booking.status || 'pending';
                  return (
                    <tr key={booking._id}>
                      <td><strong className="admin-client-name">{booking.name}</strong><a className="admin-client-contact" href={`mailto:${booking.email}`}>{booking.email}</a><a className="admin-client-contact" href={`tel:${booking.phone}`}>{booking.phone}</a></td>
                      <td>{formatDate(booking.date)}</td>
                      <td>{formatDate(booking.createdAt)}</td>
                      <td><span className={`admin-status-badge admin-status-${status}`}>{statusLabel(status)}</span></td>
                      <td><select className="admin-status-select" aria-label={`Update status for ${booking.name}`} disabled={savingBookingId === booking._id} value={status} onChange={(event) => updateBookingStatus(booking._id, event.target.value)}>{BOOKING_STATUSES.map((option) => <option key={option} value={option}>{statusLabel(option)}</option>)}</select></td>
                    </tr>
                  );
                })}
                {!bookings.length && <tr><td className="admin-empty-state" colSpan="5">{loading ? 'Loading requests…' : 'No requests match these filters.'}</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="admin-pagination">
            <span>Showing {bookings.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, totalBookings)} of {totalBookings}</span>
            <div>
              <button aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => loadDashboard({ nextPage: page - 1 })}><ChevronLeft size={17} /> Previous</button>
              <span>Page {page} of {totalPages}</span>
              <button aria-label="Next page" disabled={page >= totalPages || loading} onClick={() => loadDashboard({ nextPage: page + 1 })}>Next <ChevronRight size={17} /></button>
            </div>
          </div>
        </section>
        <footer className="admin-footer"><span>Nutrition with Linda</span><span>Bookings are private to your admin account.</span></footer>
      </main>
    </AdminShell>
  );
}

function KpiCard({ icon: Icon, label, value, detail }) {
  return (
    <article className="admin-kpi-card">
      <span className="admin-kpi-icon"><Icon size={19} strokeWidth={1.8} /></span>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function AdminShell({ children }) {
  return (
    <div className="admin-shell">
      {children}
      <span className="admin-background-leaf" aria-hidden="true"><Leaf size={140} strokeWidth={0.65} /></span>
    </div>
  );
}
