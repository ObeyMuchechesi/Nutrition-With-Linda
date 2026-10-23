'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
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
  Plus,
  RefreshCw,
  Ruler,
  Save,
  Search,
  Scale,
  ShieldCheck,
  Trash2,
  UserRoundPlus,
  UsersRound,
} from 'lucide-react';
const PAGE_SIZE = 25;
const BOOKING_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
const MEASUREMENT_METRICS = [
  { key: 'weightKg', label: 'Weight', unit: 'kg', digits: 1, min: 1, max: 500, step: 0.1 },
  { key: 'bmi', label: 'BMI', unit: '', digits: 1, min: 5, max: 100, step: 0.1 },
  { key: 'bodyFatPercentage', label: 'Body fat', unit: '%', digits: 1, min: 0, max: 80, step: 0.1 },
  { key: 'visceralFat', label: 'Visceral fat', unit: 'level', digits: 1, min: 0, max: 100, step: 0.1 },
  { key: 'waistCircumferenceCm', label: 'Waist', unit: 'cm', digits: 1, min: 20, max: 250, step: 0.1 },
];

function todayInPracticeTime() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Africa/Harare' }).format(new Date());
}

function emptyMeasurementForm() {
  return { date: todayInPracticeTime(), weightKg: '', bmi: '', bodyFatPercentage: '', visceralFat: '', waistCircumferenceCm: '', notes: '' };
}

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
  const [activeView, setActiveView] = useState('dashboard');
  const [contentDraft, setContentDraft] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentSaving, setContentSaving] = useState(false);
  const [contentMessage, setContentMessage] = useState('');
  const [contentError, setContentError] = useState('');
  const [patients, setPatients] = useState([]);
  const [patientPage, setPatientPage] = useState(1);
  const [patientTotalPages, setPatientTotalPages] = useState(1);
  const [patientTotal, setPatientTotal] = useState(0);
  const [patientSearchInput, setPatientSearchInput] = useState('');
  const [activePatientSearch, setActivePatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [selectedPatientLoading, setSelectedPatientLoading] = useState(false);
  const [patientError, setPatientError] = useState('');
  const [patientMessage, setPatientMessage] = useState('');
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [patientForm, setPatientForm] = useState({ name: '', email: '', phone: '' });
  const [patientSaving, setPatientSaving] = useState(false);
  const [patientDeleting, setPatientDeleting] = useState(false);
  const [showMeasurementForm, setShowMeasurementForm] = useState(false);
  const [measurementForm, setMeasurementForm] = useState(emptyMeasurementForm);
  const [measurementSaving, setMeasurementSaving] = useState(false);
  const [measurementMetric, setMeasurementMetric] = useState('weightKg');

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

  async function loadSiteContent() {
    setContentLoading(true);
    setContentError('');
    setContentMessage('');
    try {
      const response = await fetch('/api/admin/site-content', { cache: 'no-store' });
      const data = await readJson(response);
      if (response.status === 401) {
        setAuthState('login');
        return false;
      }
      if (!response.ok) throw new Error(data.message || 'Website content could not be loaded.');
      setContentDraft(data.content);
      return true;
    } catch (error) {
      setContentError(error.message || 'Website content could not be loaded.');
      return false;
    } finally {
      setContentLoading(false);
    }
  }

  async function loadPatient(patientId) {
    if (!patientId) {
      setSelectedPatientId('');
      setSelectedPatient(null);
      return false;
    }

    setSelectedPatientId(patientId);
    setSelectedPatient(null);
    setSelectedPatientLoading(true);
    setPatientError('');
    try {
      const params = new URLSearchParams({ patientId });
      const response = await fetch(`/api/admin/patients?${params.toString()}`, { cache: 'no-store' });
      const data = await readJson(response);
      if (response.status === 401) {
        setAuthState('login');
        return false;
      }
      if (!response.ok) throw new Error(data.message || 'This patient record could not be loaded.');
      setSelectedPatientId(patientId);
      setSelectedPatient(data.patient);
      return true;
    } catch (error) {
      setPatientError(error.message || 'This patient record could not be loaded.');
      return false;
    } finally {
      setSelectedPatientLoading(false);
    }
  }

  async function loadPatients({ nextPage = patientPage, nextSearch = activePatientSearch, nextSelectedId = selectedPatientId } = {}) {
    setPatientsLoading(true);
    setPatientError('');
    const params = new URLSearchParams({ page: String(nextPage), limit: String(PAGE_SIZE), search: nextSearch });
    try {
      const response = await fetch(`/api/admin/patients?${params.toString()}`, { cache: 'no-store' });
      const data = await readJson(response);
      if (response.status === 401) {
        setAuthState('login');
        return false;
      }
      if (!response.ok) throw new Error(data.message || 'Patient records could not be loaded.');

      const nextPatients = data.patients || [];
      setPatients(nextPatients);
      setPatientPage(data.page || nextPage);
      setPatientTotalPages(data.totalPages || 1);
      setPatientTotal(data.total || 0);
      setActivePatientSearch(nextSearch);
      const nextPatient = nextPatients.find((patient) => patient._id === nextSelectedId) || nextPatients[0];
      if (nextPatient) await loadPatient(nextPatient._id);
      else {
        setSelectedPatientId('');
        setSelectedPatient(null);
      }
      return true;
    } catch (error) {
      setPatientError(error.message || 'Patient records could not be loaded.');
      return false;
    } finally {
      setPatientsLoading(false);
    }
  }

  async function createPatient(event) {
    event.preventDefault();
    setPatientSaving(true);
    setPatientError('');
    setPatientMessage('');
    try {
      const response = await fetch('/api/admin/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientForm),
      });
      const data = await readJson(response);
      if (response.status === 401) {
        setAuthState('login');
        return;
      }
      if (!response.ok) throw new Error(data.message || 'The patient could not be added.');
      setPatientForm({ name: '', email: '', phone: '' });
      setPatientSearchInput('');
      setShowPatientForm(false);
      setPatientMessage('Patient added. You can now record their first measurements.');
      await loadPatients({ nextPage: 1, nextSearch: '', nextSelectedId: data.patient._id });
    } catch (error) {
      setPatientError(error.message || 'The patient could not be added.');
    } finally {
      setPatientSaving(false);
    }
  }

  async function deletePatient() {
    if (!selectedPatient || !selectedPatientId) return;
    const measurementCount = selectedPatient.measurementCount ?? selectedPatient.measurements?.length ?? 0;
    const visitLabel = measurementCount === 1 ? 'measurement' : 'measurements';
    if (!window.confirm(`Permanently delete ${selectedPatient.name} and all ${measurementCount} saved ${visitLabel}? This cannot be undone.`)) return;

    const patientName = selectedPatient.name;
    setPatientDeleting(true);
    setPatientError('');
    setPatientMessage('');
    try {
      const params = new URLSearchParams({ patientId: selectedPatientId });
      const response = await fetch(`/api/admin/patients?${params.toString()}`, { method: 'DELETE' });
      const data = await readJson(response);
      if (response.status === 401) {
        setAuthState('login');
        return;
      }
      if (!response.ok) throw new Error(data.message || 'The patient could not be deleted.');

      setShowMeasurementForm(false);
      setPatientMessage(`${patientName} and their measurement history were deleted.`);
      const nextPage = patients.length === 1 && patientPage > 1 ? patientPage - 1 : patientPage;
      await loadPatients({ nextPage, nextSearch: activePatientSearch, nextSelectedId: '' });
    } catch (error) {
      setPatientError(error.message || 'The patient could not be deleted.');
    } finally {
      setPatientDeleting(false);
    }
  }

  async function saveMeasurement(event) {
    event.preventDefault();
    if (!selectedPatientId) return;
    setMeasurementSaving(true);
    setPatientError('');
    setPatientMessage('');
    try {
      const params = new URLSearchParams({ patientId: selectedPatientId });
      const response = await fetch(`/api/admin/patients/measurements?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(measurementForm),
      });
      const data = await readJson(response);
      if (response.status === 401) {
        setAuthState('login');
        return;
      }
      if (!response.ok) throw new Error(data.message || 'The measurement could not be saved.');
      setSelectedPatient(data.patient);
      setMeasurementForm(emptyMeasurementForm());
      setShowMeasurementForm(false);
      setPatientMessage(`Measurements saved for ${data.patient.name}.`);
      await loadPatients({ nextSelectedId: data.patient._id });
    } catch (error) {
      setPatientError(error.message || 'The measurement could not be saved.');
    } finally {
      setMeasurementSaving(false);
    }
  }

  async function removeMeasurement(measurementId) {
    if (!selectedPatientId || !window.confirm('Remove this measurement from the patient’s history?')) return;
    setPatientError('');
    setPatientMessage('');
    try {
      const params = new URLSearchParams({ patientId: selectedPatientId, measurementId });
      const response = await fetch(`/api/admin/patients/measurements?${params.toString()}`, { method: 'DELETE' });
      const data = await readJson(response);
      if (response.status === 401) {
        setAuthState('login');
        return;
      }
      if (!response.ok) throw new Error(data.message || 'The measurement could not be removed.');
      setSelectedPatient(data.patient);
      setPatientMessage('Measurement removed from the patient’s history.');
      await loadPatients({ nextSelectedId: data.patient._id });
    } catch (error) {
      setPatientError(error.message || 'The measurement could not be removed.');
    }
  }

  function submitPatientSearch(event) {
    event.preventDefault();
    loadPatients({ nextPage: 1, nextSearch: patientSearchInput.trim(), nextSelectedId: '' });
  }

  async function saveSiteContent(event) {
    event.preventDefault();
    setContentSaving(true);
    setContentError('');
    setContentMessage('');
    try {
      const response = await fetch('/api/admin/site-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentDraft),
      });
      const data = await readJson(response);
      if (response.status === 401) {
        setAuthState('login');
        return;
      }
      if (!response.ok) throw new Error(data.message || 'Website content could not be saved.');
      setContentDraft(data.content);
      setContentMessage('Saved. The website will show these changes when it is next opened.');
    } catch (error) {
      setContentError(error.message || 'Website content could not be saved.');
    } finally {
      setContentSaving(false);
    }
  }

  function updateContentField(field, value) {
    setContentDraft((previous) => ({ ...previous, [field]: value }));
  }

  function updateContentItem(collection, index, field, value) {
    setContentDraft((previous) => ({
      ...previous,
      [collection]: previous[collection].map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
  }

  function addContentItem(collection) {
    setContentDraft((previous) => ({
      ...previous,
      [collection]: [...previous[collection], collection === 'features'
        ? { icon: 'leaf', title: '', description: '' }
        : { icon: 'leaf', title: '', detail: '' }],
    }));
  }

  function removeContentItem(collection, index) {
    setContentDraft((previous) => ({
      ...previous,
      [collection]: previous[collection].filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function selectView(nextView) {
    setActiveView(nextView);
    if (nextView === 'content') loadSiteContent();
    if (nextView === 'patients') loadPatients({ nextPage: 1, nextSearch: '', nextSelectedId: '' });
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
    setPatients([]);
    setSelectedPatient(null);
    setSelectedPatientId('');
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

  if (activeView === 'content') {
    return (
      <AdminShell>
        <AdminHeader activeView={activeView} onViewChange={selectView} onLogout={handleLogout} />
        <main className="admin-main">
          <div className="admin-page-heading">
            <div>
              <p className="admin-eyebrow">Public website</p>
              <h1>Website content</h1>
              <p className="admin-page-intro">Update the words, service cards, prices, and contact details visitors see.</p>
            </div>
            <button className="admin-refresh-button" disabled={contentLoading} onClick={loadSiteContent} type="button">
              <RefreshCw size={15} className={contentLoading ? 'admin-rotating' : ''} /> Reload content
            </button>
          </div>

          {contentError && <div className="admin-alert" role="alert">{contentError}</div>}
          {contentMessage && <div className="admin-success-alert" role="status">{contentMessage}</div>}

          {contentLoading && !contentDraft ? (
            <div className="admin-content-loading"><span className="admin-spinner" /> Loading website content…</div>
          ) : contentDraft ? (
            <form className="admin-content-form" onSubmit={saveSiteContent}>
              <div className="admin-content-actions">
                <p>Changes are stored in MongoDB and appear to visitors after they refresh the website.</p>
                <button className="admin-primary-button" disabled={contentSaving} type="submit">
                  <Save size={16} /> {contentSaving ? 'Saving…' : 'Save website changes'}
                </button>
              </div>

              <ContentSection title="First impression" description="The hero section at the top of your homepage.">
                <ContentField label="Eyebrow" value={contentDraft.heroEyebrow} onChange={(value) => updateContentField('heroEyebrow', value)} />
                <ContentField label="Main heading" value={contentDraft.heroTitle} onChange={(value) => updateContentField('heroTitle', value)} />
                <ContentField label="Heading emphasis" value={contentDraft.heroEmphasis} onChange={(value) => updateContentField('heroEmphasis', value)} />
                <ContentField label="Intro text" multiline value={contentDraft.heroDescription} onChange={(value) => updateContentField('heroDescription', value)} />
                <ContentField label="Short note" value={contentDraft.heroNote} onChange={(value) => updateContentField('heroNote', value)} />
                <ContentField label="Hero image URL" type="url" maxLength={2048} value={contentDraft.heroImageUrl} onChange={(value) => updateContentField('heroImageUrl', value)} />
                <ContentField label="Image description" value={contentDraft.heroImageAlt} onChange={(value) => updateContentField('heroImageAlt', value)} />
                <ContentField label="Image caption" value={contentDraft.heroCaption} onChange={(value) => updateContentField('heroCaption', value)} />
                <ContentField label="Location label" value={contentDraft.location} onChange={(value) => updateContentField('location', value)} />
              </ContentSection>

              <ContentSection title="Consultation and price" description="The introduction, price card, and promise below the hero.">
                <ContentField label="Section eyebrow" value={contentDraft.consultationEyebrow} onChange={(value) => updateContentField('consultationEyebrow', value)} />
                <ContentField label="Section heading" value={contentDraft.consultationTitle} onChange={(value) => updateContentField('consultationTitle', value)} />
                <ContentField label="Heading emphasis" value={contentDraft.consultationEmphasis} onChange={(value) => updateContentField('consultationEmphasis', value)} />
                <ContentField label="Section description" multiline value={contentDraft.consultationDescription} onChange={(value) => updateContentField('consultationDescription', value)} />
                <ContentField label="Price label" value={contentDraft.priceLabel} onChange={(value) => updateContentField('priceLabel', value)} />
                <ContentField label="Price" value={contentDraft.priceAmount} onChange={(value) => updateContentField('priceAmount', value)} />
                <ContentField label="Price caption" value={contentDraft.priceCaption} onChange={(value) => updateContentField('priceCaption', value)} />
                <ContentField label="Medical aid note" value={contentDraft.medicalNote} onChange={(value) => updateContentField('medicalNote', value)} />
                <ContentField label="Callout heading" value={contentDraft.calloutTitle} onChange={(value) => updateContentField('calloutTitle', value)} />
                <ContentField label="Callout text" value={contentDraft.calloutDescription} onChange={(value) => updateContentField('calloutDescription', value)} />
              </ContentSection>

              <ContentSection title="Services" description="Edit, add, remove, or reorder the consultation cards.">
                {contentDraft.features.map((feature, index) => (
                  <ContentItemEditor
                    key={`feature-${index}`}
                    title={`Service ${index + 1}`}
                    item={feature}
                    textKey="description"
                    textLabel="Description"
                    onChange={(field, value) => updateContentItem('features', index, field, value)}
                    onRemove={() => removeContentItem('features', index)}
                    canRemove={contentDraft.features.length > 1}
                  />
                ))}
                {contentDraft.features.length < 6 && <button className="admin-add-content-button" type="button" onClick={() => addContentItem('features')}><Plus size={15} /> Add a service</button>}
              </ContentSection>

              <ContentSection title="What clients can expect" description="The short practice values near the bottom of the homepage.">
                {contentDraft.values.map((value, index) => (
                  <ContentItemEditor
                    key={`value-${index}`}
                    title={`Practice value ${index + 1}`}
                    item={value}
                    textKey="detail"
                    textLabel="Detail"
                    onChange={(field, text) => updateContentItem('values', index, field, text)}
                    onRemove={() => removeContentItem('values', index)}
                    canRemove={contentDraft.values.length > 1}
                  />
                ))}
                {contentDraft.values.length < 4 && <button className="admin-add-content-button" type="button" onClick={() => addContentItem('values')}><Plus size={15} /> Add a practice value</button>}
              </ContentSection>

              <ContentSection title="Contact and WhatsApp" description="These details appear in the footer and floating WhatsApp link.">
                <ContentField label="Phone number" value={contentDraft.phone} onChange={(value) => updateContentField('phone', value)} />
                <ContentField label="Address" value={contentDraft.address} onChange={(value) => updateContentField('address', value)} />
                <ContentField label="WhatsApp number with country code" help="Use digits only, for example 263784909690." value={contentDraft.whatsappNumber} onChange={(value) => updateContentField('whatsappNumber', value)} />
                <ContentField label="WhatsApp pre-filled message" multiline value={contentDraft.whatsappMessage} onChange={(value) => updateContentField('whatsappMessage', value)} />
                <ContentField label="Footer prompt" value={contentDraft.footerPrompt} onChange={(value) => updateContentField('footerPrompt', value)} />
                <ContentField label="Footer tagline" value={contentDraft.footerTagline} onChange={(value) => updateContentField('footerTagline', value)} />
                <ContentField label="Footer closing line" value={contentDraft.footerBottomLine} onChange={(value) => updateContentField('footerBottomLine', value)} />
              </ContentSection>

              <ContentSection title="Booking form" description="The appointment request dialog and confirmation message.">
                <ContentField label="Form eyebrow" value={contentDraft.bookingEyebrow} onChange={(value) => updateContentField('bookingEyebrow', value)} />
                <ContentField label="Form heading" value={contentDraft.bookingTitle} onChange={(value) => updateContentField('bookingTitle', value)} />
                <ContentField label="Intro text" multiline value={contentDraft.bookingIntro} onChange={(value) => updateContentField('bookingIntro', value)} />
                <ContentField label="Success eyebrow" value={contentDraft.bookingSuccessEyebrow} onChange={(value) => updateContentField('bookingSuccessEyebrow', value)} />
                <ContentField label="Success heading" value={contentDraft.bookingSuccessTitle} onChange={(value) => updateContentField('bookingSuccessTitle', value)} />
                <ContentField label="Success message" multiline value={contentDraft.bookingSuccessCopy} onChange={(value) => updateContentField('bookingSuccessCopy', value)} />
                <ContentField label="Submit button" value={contentDraft.bookingSubmitLabel} onChange={(value) => updateContentField('bookingSubmitLabel', value)} />
                <ContentField label="Form footnote" value={contentDraft.bookingFootnote} onChange={(value) => updateContentField('bookingFootnote', value)} />
              </ContentSection>

              <div className="admin-content-actions admin-content-actions-bottom">
                <span>Remember to save before leaving this page.</span>
                <button className="admin-primary-button" disabled={contentSaving} type="submit">
                  <Save size={16} /> {contentSaving ? 'Saving…' : 'Save website changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="admin-content-empty"><p>Website content is not available right now.</p><button className="admin-primary-button" onClick={loadSiteContent}>Try again</button></div>
          )}
          <footer className="admin-footer"><span>Nutrition with Linda</span><span>Website content is stored securely in MongoDB.</span></footer>
        </main>
      </AdminShell>
    );
  }

  if (activeView === 'patients') {
    const measurementHistory = selectedPatient?.measurements || [];
    const latestMeasurement = measurementHistory[0] || null;
    const previousMeasurement = measurementHistory[1] || null;
    const activeMetric = MEASUREMENT_METRICS.find((metric) => metric.key === measurementMetric) || MEASUREMENT_METRICS[0];

    return (
      <AdminShell>
        <AdminHeader activeView={activeView} onViewChange={selectView} onLogout={handleLogout} />
        <main className="admin-main">
          <div className="admin-page-heading admin-patient-page-heading">
            <div>
              <p className="admin-eyebrow">Clinical records</p>
              <h1>Patient progress</h1>
              <p className="admin-page-intro">Keep each visit’s measurements together and compare changes over time.</p>
            </div>
            <button className="admin-primary-button" onClick={() => { setShowPatientForm((visible) => !visible); setPatientError(''); setPatientMessage(''); }} type="button">
              <UserRoundPlus size={16} /> {showPatientForm ? 'Close form' : 'Add patient'}
            </button>
          </div>

          {patientError && <div className="admin-alert" role="alert">{patientError}</div>}
          {patientMessage && <div className="admin-success-alert" role="status">{patientMessage}</div>}

          {showPatientForm && (
            <form className="admin-panel admin-patient-create" onSubmit={createPatient}>
              <div className="admin-panel-heading admin-patient-form-heading">
                <div><p className="admin-eyebrow">New record</p><h2>Patient details</h2></div>
                <span className="admin-panel-icon"><UserRoundPlus size={18} /></span>
              </div>
              <div className="admin-content-fields">
                <label className="admin-content-field"><span>Patient name</span><input autoComplete="name" maxLength="100" required value={patientForm.name} onChange={(event) => setPatientForm((current) => ({ ...current, name: event.target.value }))} /></label>
                <label className="admin-content-field"><span>Email address</span><input autoComplete="email" maxLength="254" type="email" value={patientForm.email} onChange={(event) => setPatientForm((current) => ({ ...current, email: event.target.value }))} /></label>
                <label className="admin-content-field"><span>Phone number</span><input autoComplete="tel" maxLength="32" type="tel" value={patientForm.phone} onChange={(event) => setPatientForm((current) => ({ ...current, phone: event.target.value }))} /><small>Add an email address or phone number to identify the patient.</small></label>
              </div>
              <div className="admin-patient-form-actions">
                <span>Patient records are private to this admin area.</span>
                <button className="admin-primary-button" disabled={patientSaving} type="submit"><Plus size={16} /> {patientSaving ? 'Adding patient…' : 'Save patient'}</button>
              </div>
            </form>
          )}

          <div className="admin-patient-toolbar">
            <form className="admin-search-form" onSubmit={submitPatientSearch}>
              <label className="admin-search-box"><Search size={16} /><input aria-label="Search patients" placeholder="Search name, email or phone" value={patientSearchInput} onChange={(event) => setPatientSearchInput(event.target.value)} /></label>
              <button className="admin-search-button" type="submit">Search</button>
            </form>
            <span>{activePatientSearch ? `${patientTotal} matching ${patientTotal === 1 ? 'patient' : 'patients'}` : `${patientTotal} ${patientTotal === 1 ? 'patient' : 'patients'} on your register`}</span>
          </div>

          <div className="admin-patient-layout">
            <aside className="admin-panel admin-patient-list-panel" aria-label="Patient register">
              <div className="admin-patient-list-heading"><div><p className="admin-eyebrow">Your register</p><h2>Patients <span className="admin-count-pill">{patientTotal}</span></h2></div><span className="admin-panel-icon"><UsersRound size={18} /></span></div>
              {patientsLoading && !patients.length ? <div className="admin-content-loading"><span className="admin-spinner" /> Loading patients…</div> : (
                <div className="admin-patient-list">
                  {patients.map((patient) => (
                    <button className={`admin-patient-list-item ${selectedPatientId === patient._id ? 'active' : ''}`} key={patient._id} onClick={() => loadPatient(patient._id)} type="button">
                      <span className="admin-patient-avatar" aria-hidden="true">{patient.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span>
                      <span className="admin-patient-list-copy"><strong>{patient.name}</strong><small>{patient.measurementCount || 0} {patient.measurementCount === 1 ? 'visit' : 'visits'} recorded</small><small>{patient.latestMeasurement ? `Latest · ${formatDate(patient.latestMeasurement.date)}` : 'No measurements yet'}</small></span>
                    </button>
                  ))}
                  {!patients.length && <div className="admin-patient-empty-list"><UsersRound size={21} /><strong>{activePatientSearch ? 'No patients found' : 'Your register is ready'}</strong><span>{activePatientSearch ? 'Try a different name or contact detail.' : 'Add a patient to start keeping their progress together.'}</span></div>}
                </div>
              )}
              <div className="admin-patient-pagination">
                <span>Page {patientPage} of {patientTotalPages}</span>
                <div><button disabled={patientPage <= 1 || patientsLoading} onClick={() => loadPatients({ nextPage: patientPage - 1, nextSelectedId: '' })} type="button"><ChevronLeft size={15} /> Previous</button><button disabled={patientPage >= patientTotalPages || patientsLoading} onClick={() => loadPatients({ nextPage: patientPage + 1, nextSelectedId: '' })} type="button">Next <ChevronRight size={15} /></button></div>
              </div>
            </aside>

            <section className="admin-panel admin-patient-detail-panel" aria-label="Patient measurement history">
              {selectedPatientLoading ? <div className="admin-content-loading"><span className="admin-spinner" /> Loading patient record…</div> : selectedPatient ? (
                <>
                  <div className="admin-patient-profile">
                    <span className="admin-patient-avatar admin-patient-avatar-large" aria-hidden="true">{selectedPatient.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span>
                    <div className="admin-patient-profile-copy"><p className="admin-eyebrow">Patient file</p><h2>{selectedPatient.name}</h2><div className="admin-patient-contact">{selectedPatient.email && <a href={`mailto:${selectedPatient.email}`}>{selectedPatient.email}</a>}{selectedPatient.phone && <a href={`tel:${selectedPatient.phone}`}>{selectedPatient.phone}</a>}</div></div>
                    <div className="admin-patient-profile-actions">
                      <button className="admin-primary-button admin-patient-record-button" disabled={patientDeleting} onClick={() => { setMeasurementForm(emptyMeasurementForm()); setShowMeasurementForm((visible) => !visible); setPatientError(''); setPatientMessage(''); }} type="button"><Plus size={16} /> {showMeasurementForm ? 'Close entry' : 'Record visit'}</button>
                      <button className="admin-patient-delete-button" disabled={patientDeleting} onClick={deletePatient} type="button"><Trash2 size={14} /> {patientDeleting ? 'Deleting…' : 'Delete patient'}</button>
                    </div>
                  </div>

                  {showMeasurementForm && (
                    <form className="admin-patient-measurement-form" onSubmit={saveMeasurement}>
                      <div className="admin-panel-heading admin-patient-form-heading"><div><p className="admin-eyebrow">New visit</p><h2>Measurements</h2></div><span className="admin-panel-icon"><Scale size={18} /></span></div>
                      <label className="admin-content-field admin-measurement-date"><span>Visit date</span><input type="date" required value={measurementForm.date} onChange={(event) => setMeasurementForm((current) => ({ ...current, date: event.target.value }))} /></label>
                      <div className="admin-patient-measurement-fields">
                        {MEASUREMENT_METRICS.map((metric) => <label className="admin-content-field" key={metric.key}><span>{metric.label}{metric.unit ? ` (${metric.unit})` : ''}</span><input type="number" inputMode="decimal" min={metric.min} max={metric.max} step={metric.step} required value={measurementForm[metric.key]} onChange={(event) => setMeasurementForm((current) => ({ ...current, [metric.key]: event.target.value }))} /></label>)}
                        <label className="admin-content-field admin-content-field-wide"><span>Visit notes <small>(optional)</small></span><textarea maxLength="500" rows="2" placeholder="Add a brief note for this visit" value={measurementForm.notes} onChange={(event) => setMeasurementForm((current) => ({ ...current, notes: event.target.value }))} /></label>
                      </div>
                      <div className="admin-patient-form-actions"><span>All five measurements are saved with the visit date.</span><button className="admin-primary-button" disabled={measurementSaving} type="submit"><Save size={15} /> {measurementSaving ? 'Saving measurements…' : 'Save measurements'}</button></div>
                    </form>
                  )}

                  <div className="admin-patient-section-heading"><div><p className="admin-eyebrow">Latest assessment</p><h3>{latestMeasurement ? `Recorded ${formatDate(latestMeasurement.date)}` : 'No measurements recorded yet'}</h3></div><span className="admin-patient-visit-count"><CalendarDays size={15} /> {measurementHistory.length} {measurementHistory.length === 1 ? 'visit' : 'visits'}</span></div>
                  <div className="admin-patient-metric-grid">
                    {MEASUREMENT_METRICS.map((metric) => <MeasurementMetricCard key={metric.key} metric={metric} value={latestMeasurement?.[metric.key]} previousValue={previousMeasurement?.[metric.key]} />)}
                  </div>

                  <div className="admin-panel admin-patient-chart-panel">
                    <div className="admin-panel-heading admin-patient-chart-heading"><div><p className="admin-eyebrow">Visit comparison</p><h3>Measurement trend</h3></div><label className="admin-patient-metric-select"><span>Compare</span><select aria-label="Choose a measurement to compare" value={measurementMetric} onChange={(event) => setMeasurementMetric(event.target.value)}>{MEASUREMENT_METRICS.map((metric) => <option value={metric.key} key={metric.key}>{metric.label}</option>)}</select></label></div>
                    <PatientMeasurementChart measurements={measurementHistory} metric={activeMetric} />
                  </div>

                  <div className="admin-patient-history-heading"><div><p className="admin-eyebrow">Full record</p><h3>Measurement history</h3></div><span>{measurementHistory.length ? 'Most recent first' : 'New visits will appear here'}</span></div>
                  <div className="admin-table-wrap admin-patient-history-wrap">
                    <table className="admin-bookings-table admin-patient-history-table">
                      <thead><tr><th>Visit date</th><th>Weight</th><th>BMI</th><th>Body fat</th><th>Visceral fat</th><th>Waist</th><th><span className="sr-only">Remove measurement</span></th></tr></thead>
                      <tbody>
                        {measurementHistory.map((measurement) => <tr key={measurement._id}><td><strong className="admin-client-name">{formatDate(measurement.date)}</strong>{measurement.notes && <small className="admin-measurement-note" title={measurement.notes}>{measurement.notes}</small>}</td><td>{formatMetricValue(measurement.weightKg, MEASUREMENT_METRICS[0])}</td><td>{formatMetricValue(measurement.bmi, MEASUREMENT_METRICS[1])}</td><td>{formatMetricValue(measurement.bodyFatPercentage, MEASUREMENT_METRICS[2])}</td><td>{formatMetricValue(measurement.visceralFat, MEASUREMENT_METRICS[3])}</td><td>{formatMetricValue(measurement.waistCircumferenceCm, MEASUREMENT_METRICS[4])}</td><td><button className="admin-remove-measurement-button" aria-label={`Remove measurements from ${formatDate(measurement.date)}`} onClick={() => removeMeasurement(measurement._id)} type="button"><Trash2 size={14} /></button></td></tr>)}
                        {!measurementHistory.length && <tr><td className="admin-empty-state" colSpan="7">Record the first visit to start comparing this patient’s progress.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="admin-patient-detail-empty"><span className="admin-note-icon"><Ruler size={18} /></span><p className="admin-eyebrow">Progress, recorded</p><h2>{patients.length ? 'Select a patient' : 'Start a patient register'}</h2><p>{patients.length ? 'Choose a name from the register to review their measurements and changes over time.' : 'Add your first patient, then record measurements at each visit to build a clear history.'}</p>{!patients.length && <button className="admin-primary-button" onClick={() => setShowPatientForm(true)} type="button"><UserRoundPlus size={16} /> Add first patient</button>}</div>
              )}
            </section>
          </div>
          <footer className="admin-footer"><span>Nutrition with Linda</span><span>Patient records are accessible only after admin sign-in.</span></footer>
        </main>
      </AdminShell>
    );
  }

  const trend = overview?.monthlyTrend || [];
  const maxTrend = Math.max(1, ...trend.map((entry) => entry.count));

  return (
    <AdminShell>
      <AdminHeader activeView={activeView} onViewChange={selectView} onLogout={handleLogout} />

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

function formatMetricValue(value, metric) {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return `${number.toFixed(metric.digits)}${metric.unit ? ` ${metric.unit}` : ''}`;
}

function MeasurementMetricCard({ metric, value, previousValue }) {
  const hasPrevious = previousValue !== null && previousValue !== undefined;
  const hasValue = value !== null && value !== undefined;
  const change = hasPrevious && hasValue ? Number(value) - Number(previousValue) : 0;
  const ChangeIcon = change > 0 ? ArrowUpRight : ArrowDownRight;
  const Icon = metric.key === 'weightKg' ? Scale : metric.key === 'waistCircumferenceCm' ? Ruler : Activity;

  return (
    <article className="admin-patient-metric-card">
      <div className="admin-patient-metric-title"><span className="admin-kpi-icon"><Icon size={17} strokeWidth={1.8} /></span><span>{metric.label}</span></div>
      <strong>{formatMetricValue(value, metric)}</strong>
      <small className={hasPrevious ? 'admin-measurement-change' : 'admin-measurement-change muted'}>
        {hasPrevious ? <><ChangeIcon size={13} /> {change === 0 ? 'Unchanged at prior visit' : `${formatMetricValue(Math.abs(change), metric)} ${change > 0 ? 'higher' : 'lower'} than prior visit`}</> : hasValue ? 'First recorded visit' : 'Not yet recorded'}
      </small>
    </article>
  );
}

function PatientMeasurementChart({ measurements, metric }) {
  const chronologicalMeasurements = [...measurements].sort((left, right) => new Date(left.date) - new Date(right.date));
  const values = chronologicalMeasurements.map((measurement) => Number(measurement[metric.key])).filter(Number.isFinite);
  if (!values.length) return <div className="admin-patient-chart-empty"><Activity size={19} /><span>Record a visit to see this measurement over time.</span></div>;

  const valueRange = Math.max(...values) - Math.min(...values);
  const paddedRange = valueRange || Math.max(Math.abs(values[0]) * 0.12, 1);
  const lowerBound = Math.min(...values) - paddedRange * 0.18;
  const upperBound = Math.max(...values) + paddedRange * 0.18;
  const points = values.map((value, index) => ({
    x: values.length === 1 ? 330 : 54 + (index / (values.length - 1)) * 552,
    y: 180 - ((value - lowerBound) / (upperBound - lowerBound)) * 145,
    value,
    date: chronologicalMeasurements[index]?.date,
  }));
  const linePath = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const areaPath = points.length > 1 ? `${linePath} L ${points[points.length - 1].x} 192 L ${points[0].x} 192 Z` : '';
  const dateLabel = (value) => new Intl.DateTimeFormat('en-ZW', { month: 'short', day: 'numeric', timeZone: 'Africa/Harare' }).format(new Date(value));

  return (
    <div className="admin-patient-chart">
      <div className="admin-patient-chart-values"><span>{formatMetricValue(Math.max(...values), metric)}</span><span>{formatMetricValue(Math.min(...values), metric)}</span></div>
      <svg viewBox="0 0 640 210" role="img" aria-label={`${metric.label} trend across ${points.length} visits`} preserveAspectRatio="none">
        {[35, 83, 131, 179].map((y) => <line key={y} x1="45" y1={y} x2="600" y2={y} className="admin-patient-chart-gridline" />)}
        {areaPath && <path d={areaPath} className="admin-patient-chart-area" />}
        {points.length > 1 && <path d={linePath} className="admin-patient-chart-line" />}
        {points.map((point, index) => <circle key={`${point.date}-${index}`} cx={point.x} cy={point.y} r="4.5" className="admin-patient-chart-point"><title>{`${dateLabel(point.date)}: ${formatMetricValue(point.value, metric)}`}</title></circle>)}
      </svg>
      <div className="admin-patient-chart-dates"><span>{dateLabel(chronologicalMeasurements[0].date)}</span>{points.length > 1 && <span>{dateLabel(chronologicalMeasurements[chronologicalMeasurements.length - 1].date)}</span>}</div>
      <p>{points.length === 1 ? 'One visit recorded · add another visit to compare change.' : `${points.length} visits recorded · showing oldest to most recent.`}</p>
    </div>
  );
}

function AdminHeader({ activeView, onViewChange, onLogout }) {
  return (
    <header className="admin-header">
      <a className="admin-brand" href="/" aria-label="Nutrition with Linda home">
        <span className="admin-brand-icon"><Leaf size={18} /></span>
        <span><strong>Nutrition</strong><small>with Linda</small></span>
      </a>
      <nav className="admin-view-tabs" aria-label="Dashboard sections">
        <button className={activeView === 'dashboard' ? 'admin-view-tab active' : 'admin-view-tab'} onClick={() => onViewChange('dashboard')} type="button">Bookings</button>
        <button className={activeView === 'patients' ? 'admin-view-tab active' : 'admin-view-tab'} onClick={() => onViewChange('patients')} type="button">Patients</button>
        <button className={activeView === 'content' ? 'admin-view-tab active' : 'admin-view-tab'} onClick={() => onViewChange('content')} type="button">Website content</button>
      </nav>
      <div className="admin-header-actions">
        <span className="admin-secure-label"><ShieldCheck size={15} /> Private admin area</span>
        <button className="admin-logout-button" onClick={onLogout}><LogOut size={16} /> <span>Sign out</span></button>
      </div>
    </header>
  );
}

function ContentSection({ title, description, children }) {
  return (
    <section className="admin-content-section">
      <div className="admin-content-section-heading"><h2>{title}</h2><p>{description}</p></div>
      <div className="admin-content-fields">{children}</div>
    </section>
  );
}

function ContentField({ label, value, onChange, multiline = false, type = 'text', help = '', maxLength = 400 }) {
  return (
    <label className={`admin-content-field ${multiline ? 'admin-content-field-wide' : ''}`}>
      <span>{label}</span>
      {multiline
        ? <textarea rows="3" maxLength={maxLength} value={value || ''} onChange={(event) => onChange(event.target.value)} />
        : <input type={type} maxLength={maxLength} value={value || ''} onChange={(event) => onChange(event.target.value)} />}
      {help && <small>{help}</small>}
    </label>
  );
}

function ContentItemEditor({ title, item, textKey, textLabel, onChange, onRemove, canRemove }) {
  const icons = [
    ['clipboard', 'Clipboard'],
    ['heart', 'Heart'],
    ['salad', 'Salad'],
    ['leaf', 'Leaf'],
    ['user', 'Person'],
  ];
  return (
    <div className="admin-content-item">
      <div className="admin-content-item-heading">
        <h3>{title}</h3>
        <button className="admin-remove-content-button" disabled={!canRemove} onClick={onRemove} type="button"><Trash2 size={14} /> Remove</button>
      </div>
      <div className="admin-content-fields">
        <label className="admin-content-field">
          <span>Icon</span>
          <select value={item.icon || 'leaf'} onChange={(event) => onChange('icon', event.target.value)}>
            {icons.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
        <ContentField label="Title" value={item.title} onChange={(value) => onChange('title', value)} />
        <ContentField label={textLabel} multiline value={item[textKey]} onChange={(value) => onChange(textKey, value)} />
      </div>
    </div>
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
