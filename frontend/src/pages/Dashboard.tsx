import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Copy, Database, Settings2, Plus, Terminal, X, Trash2, Activity, Play, CheckCircle2 } from 'lucide-react';
import { widgetApi, submissionApi, authApi, systemApi } from '../api/index';

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseJson(val: any, fallback: any) {
  if (!val) return fallback;
  if (typeof val !== 'string') return val ?? fallback;
  try { return JSON.parse(val) ?? fallback; } catch { return fallback; }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'submissions' | 'widgets'>('submissions');

  const [widgets, setWidgets] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [activeWidget, setActiveWidget] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [origins, setOrigins] = useState<string[]>([]);
  const [newOrigin, setNewOrigin] = useState('');

  // Sandbox preview settings (UI-only, not saved to DB)
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [widgetPosition, setWidgetPosition] = useState('bottom-right');

  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [validationError, setValidationError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationName, setDeleteConfirmationName] = useState('');

  const [fetchError, setFetchError] = useState('');

  // Track whether initial widget selection was done
  const initialWidgetSet = useRef(false);

  // ── Data Fetching ────────────────────────────────────────────────────────

  const fetchDashboardData = useCallback(async (preserveActive = false) => {
    setLoading(true);
    setFetchError('');
    try {
      const [widData, subData] = await Promise.all([
        widgetApi.getAll().catch((e: any) => {
          if (e.message.includes('401') || e.message.includes('403')) throw new Error('401');
          throw e; // Actually throw to show error!
        }),
        submissionApi.getAll().catch((e: any) => {
          if (e.message.includes('401') || e.message.includes('403')) throw new Error('401');
          throw e;
        }),
      ]);

      const fetched: any[] = widData.widgets || [];
      setWidgets(fetched);

      if (!preserveActive && !initialWidgetSet.current && fetched.length > 0) {
        initialWidgetSet.current = true;
        const w = fetched[0];
        setActiveWidget(w);
        setEditTitle(w.title || '');
        setOrigins(parseJson(w.allowed_origins, []));
        setValidationError('');
        setSaveSuccess(false);
      }

      setSubmissions(subData.submissions || []);
    } catch (e: any) {
      if (e.message === '401') {
        // App.tsx handles SESSION_EXPIRED_EVENT, but authApi/apiFetch might have already dispatched it.
        return;
      }
      setFetchError(e.message || 'Failed to load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ── Auth ─────────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    await authApi.logout();
    navigate('/');
  };

  // ── Origin management ────────────────────────────────────────────────────

  const handleAddOrigin = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter') return;
    if (e) e.preventDefault();

    const val = newOrigin.trim();
    if (!val) return;

    if (val === '*') {
      setValidationError('Wildcard (*) origins are not allowed for security reasons. Please specify exact domains.');
      return;
    }

    try { new URL(val); } catch {
      setValidationError('Invalid URL. Must start with http:// or https://');
      return;
    }

    setValidationError('');
    if (!origins.includes(val)) {
      setOrigins(prev => [...prev, val]);
      setSaveSuccess(false);
    }
    setNewOrigin('');
  };

  const removeOrigin = (index: number) => {
    setOrigins(prev => prev.filter((_, i) => i !== index));
    setSaveSuccess(false);
  };

  // ── Widget CRUD ───────────────────────────────────────────────────────────

  const handleCreateWidget = () => {
    // Discard any existing unsaved draft first
    const draft = {
      id: `draft-${Date.now()}`,
      title: '',
      public_api_key: 'pending...',
      allowed_origins: [],
      isDraft: true,
    };
    setWidgets(prev => [draft, ...prev.filter(w => !w.isDraft)]);
    setActiveWidget(draft);
    setEditTitle('');
    setOrigins([]);
    setValidationError('');
    setSaveSuccess(false);
    setActiveTab('widgets');
  };

  const handleSaveWidget = async () => {
    if (!activeWidget) return;
    if (!editTitle.trim()) {
      setValidationError('Workspace name is required.');
      return;
    }
    setValidationError('');
    setSaving(true);
    setSaveSuccess(false);

    try {
      if (activeWidget.isDraft) {
        // POST /api/widgets
        const data = await widgetApi.create({ title: editTitle.trim(), allowed_origins: origins });
        // Replace draft in list with the real saved widget
        setWidgets(prev => prev.map(w => w.id === activeWidget.id ? data.widget : w));
        setActiveWidget(data.widget);
        setSaveSuccess(true);
      } else {
        // PATCH /api/widgets/:id
        const data = await widgetApi.update(activeWidget.id, { title: editTitle.trim(), allowed_origins: origins });
        setWidgets(prev => prev.map(w => w.id === data.widget.id ? data.widget : w));
        setActiveWidget(data.widget);
        setSaveSuccess(true);
      }
    } catch (e: any) {
      setValidationError(e.message || 'Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWidget = () => {
    if (!activeWidget) return;

    if (activeWidget.isDraft) {
      setWidgets(prev => prev.filter(w => w.id !== activeWidget.id));
      setActiveWidget(null);
      setEditTitle('');
      setOrigins([]);
      setValidationError('');
      setSaveSuccess(false);
      return;
    }

    // Open modal instead of using confirm/prompt
    setDeleteConfirmationName('');
    setShowDeleteModal(true);
  };

  const executeDeleteWidget = async () => {
    if (!activeWidget) return;
    
    setSaving(true);
    try {
      await widgetApi.delete(activeWidget.id);
      setActiveWidget(null);
      setEditTitle('');
      setOrigins([]);
      setValidationError('');
      setSaveSuccess(false);
      setShowDeleteModal(false);
      initialWidgetSet.current = false;
      await fetchDashboardData(false);
    } catch (e: any) {
      setValidationError(e.message || 'Failed to delete workspace.');
      setShowDeleteModal(false);
    } finally {
      setSaving(false);
    }
  };

  // ── Clipboard ─────────────────────────────────────────────────────────────

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  // ── Search / Filter ───────────────────────────────────────────────────────

  const filteredSubmissions = submissions.filter(sub => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    const widgetName = widgets.find(w => w.id === sub.widget_id)?.title || '';
    const dataStr = typeof sub.data === 'string' ? sub.data : JSON.stringify(sub.data || {});
    const geoStr = typeof sub.geo_data === 'string' ? sub.geo_data : JSON.stringify(sub.geo_data || {});
    return (
      (sub.ip_address || '').toLowerCase().includes(q) ||
      dataStr.toLowerCase().includes(q) ||
      geoStr.toLowerCase().includes(q) ||
      widgetName.toLowerCase().includes(q) ||
      (sub.created_at || '').toLowerCase().includes(q)
    );
  });

  // ── Loading Screen ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          <span className="text-sm font-medium text-neutral-600">Loading workspace...</span>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center font-sans p-6">
        <div className="bg-white border border-red-200 rounded-lg max-w-md w-full p-6 text-center shadow-sm">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">Connection Error</h2>
          <p className="text-sm text-neutral-600 mb-6">{fetchError}</p>
          <button
            onClick={() => fetchDashboardData(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Sandbox URL builder ───────────────────────────────────────────────────
  const sandboxUrl = activeWidget && !activeWidget.isDraft
    ? `/demo?key=${activeWidget.public_api_key}&color=${encodeURIComponent(primaryColor)}&pos=${widgetPosition}`
    : null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900 font-sans selection:bg-blue-100">

      {/* ── Top Nav ────────────────────────────────────────────────────────── */}
      <header className="flex-none h-14 border-b border-neutral-200 bg-white flex items-center justify-between px-6 z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border border-neutral-200 bg-neutral-50 flex items-center justify-center rounded-sm">
              <Activity className="w-3 h-3 text-neutral-700" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-neutral-900">SignalLead</span>
          </div>
          <div className="h-4 w-px bg-neutral-200" />
          <span className="text-xs font-medium text-neutral-500 hidden sm:block">
            {activeWidget && !activeWidget.isDraft ? activeWidget.title : 'Console'}
          </span>
        </div>

        <nav className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${activeTab === 'submissions' ? 'text-neutral-900 bg-neutral-100' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'}`}
          >
            <Database className="w-4 h-4" /> Telemetry
          </button>
          <button
            onClick={() => setActiveTab('widgets')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${activeTab === 'widgets' ? 'text-neutral-900 bg-neutral-100' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'}`}
          >
            <Settings2 className="w-4 h-4" /> Settings
          </button>

          <div className="w-px h-4 bg-neutral-200 mx-1" />

          {sandboxUrl ? (
            <a
              href={sandboxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <Play className="w-4 h-4" /> Sandbox
            </a>
          ) : (
            <span className="px-3 py-1.5 rounded-md text-sm font-medium text-neutral-400 flex items-center gap-1.5 cursor-not-allowed" title="Save a workspace first">
              <Play className="w-4 h-4" /> Sandbox
            </span>
          )}

          <div className="w-px h-4 bg-neutral-200 mx-1" />
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-md text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            Sign Out
          </button>
        </nav>
      </header>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden">

        {/* ══ TELEMETRY TAB ═══════════════════════════════════════════════ */}
        {activeTab === 'submissions' ? (
          <div className="flex-1 flex flex-col bg-white">
            {/* Toolbar */}
            <div className="flex-none px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <h1 className="text-sm font-semibold text-neutral-900">
                Telemetry Feed
                {submissions.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-neutral-400">{filteredSubmissions.length} entries</span>
                )}
              </h1>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, IP, location..."
                  className="w-72 pl-9 pr-3 py-1.5 bg-white border border-neutral-200 rounded-md text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              {filteredSubmissions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-10 h-10 rounded border border-neutral-200 bg-neutral-50 flex items-center justify-center mb-4">
                    <Database className="w-4 h-4 text-neutral-400" />
                  </div>
                  <h3 className="text-sm font-medium text-neutral-900 mb-1">
                    {searchQuery ? 'No results found' : 'No submissions yet'}
                  </h3>
                  <p className="text-sm text-neutral-500 max-w-xs">
                    {searchQuery ? 'Try a different search term.' : 'Embed the widget snippet on your site to start capturing leads.'}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-white sticky top-0">
                      <th className="px-6 py-3 text-[11px] font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">Timestamp</th>
                      <th className="px-6 py-3 text-[11px] font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">Workspace</th>
                      <th className="px-6 py-3 text-[11px] font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">Name</th>
                      <th className="px-6 py-3 text-[11px] font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">Email</th>
                      <th className="px-6 py-3 text-[11px] font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 bg-white">
                    {filteredSubmissions.map(sub => {
                      const widgetName = widgets.find(w => w.id === sub.widget_id)?.title || '—';
                      const dataObj = parseJson(sub.data, {});
                      const geoObj = parseJson(sub.geo_data, {});
                      const locationParts = [geoObj?.city, geoObj?.country].filter(Boolean);

                      const date = new Date(sub.created_at);
                      const timeStr = isNaN(date.getTime())
                        ? sub.created_at
                        : date.toISOString().replace('T', ' ').slice(0, 19) + 'Z';

                      return (
                        <tr
                          key={sub.id}
                          className="hover:bg-neutral-50 cursor-pointer transition-colors"
                          onClick={() => setSelectedLead(sub)}
                        >
                          <td className="px-6 py-3.5 text-[13px] font-mono text-neutral-500 whitespace-nowrap">{timeStr}</td>
                          <td className="px-6 py-3.5 text-[13px] text-neutral-900 font-medium whitespace-nowrap">{widgetName}</td>
                          <td className="px-6 py-3.5 text-[13px] text-neutral-700 whitespace-nowrap">{dataObj?.name || '—'}</td>
                          <td className="px-6 py-3.5 text-[13px] text-neutral-700 whitespace-nowrap">{dataObj?.email || '—'}</td>
                          <td className="px-6 py-3.5 text-[13px] text-neutral-500 whitespace-nowrap">
                            {locationParts.length > 0 ? locationParts.join(', ') : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        ) : (
          /* ══ SETTINGS TAB ═══════════════════════════════════════════════ */
          <div className="flex-1 flex overflow-hidden">

            {/* Sidebar */}
            <div className="w-56 flex-none border-r border-neutral-200 bg-neutral-50 flex flex-col">
              <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500">Workspaces</span>
                <button
                  onClick={handleCreateWidget}
                  className="p-1 hover:bg-neutral-200 rounded text-neutral-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  title="New workspace"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {widgets.length === 0 && (
                  <p className="px-3 py-4 text-xs text-neutral-400 text-center">No workspaces yet.</p>
                )}
                {widgets.map(w => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setActiveWidget(w);
                      setEditTitle(w.title || '');
                      setOrigins(parseJson(w.allowed_origins, []));
                      setValidationError('');
                      setSaveSuccess(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-between gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${activeWidget?.id === w.id
                      ? 'bg-white border border-neutral-200 shadow-sm text-neutral-900'
                      : 'text-neutral-600 hover:bg-neutral-200/60 hover:text-neutral-900 border border-transparent'
                    }`}
                  >
                    <span className="truncate">{w.title || 'Untitled'}</span>
                    {w.isDraft && (
                      <span className="flex-none text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                        Draft
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Detail Pane */}
            <div className="flex-1 overflow-y-auto bg-white">
              {!activeWidget ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-10 h-10 rounded border border-neutral-200 bg-neutral-50 flex items-center justify-center mb-4">
                    <Settings2 className="w-4 h-4 text-neutral-400" />
                  </div>
                  <h3 className="text-sm font-medium text-neutral-900 mb-1">No workspace selected</h3>
                  <p className="text-sm text-neutral-500 mb-4">Select one from the sidebar or create a new one.</p>
                  <button
                    onClick={handleCreateWidget}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  >
                    <Plus className="w-4 h-4" /> New Workspace
                  </button>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto px-8 py-10">

                  {/* Header */}
                  <div className="flex items-center justify-between mb-8 pb-5 border-b border-neutral-200">
                    <h2 className="text-lg font-semibold text-neutral-900">
                      {activeWidget.isDraft ? 'New Workspace' : 'Workspace Settings'}
                    </h2>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleDeleteWidget}
                        disabled={saving}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 bg-white hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                      >
                        {activeWidget.isDraft ? 'Discard' : 'Delete'}
                      </button>
                      {saveSuccess ? (
                        <button
                          disabled
                          className="px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-md flex items-center gap-2 opacity-100 cursor-default"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Saved
                        </button>
                      ) : (
                        <button
                          onClick={handleSaveWidget}
                          disabled={saving}
                          className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Error Banner */}
                  {validationError && (
                    <div className="mb-6 px-3 py-2.5 border border-red-200 bg-red-50 text-red-700 text-sm rounded-md">
                      {validationError}
                    </div>
                  )}

                  <div className="space-y-10">

                    {/* ── Section: General ─── */}
                    <section>
                      <h3 className="text-sm font-semibold text-neutral-900 mb-5">General</h3>
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Workspace Name</label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={e => { setEditTitle(e.target.value); setSaveSuccess(false); }}
                            placeholder="e.g. Contact Sales Form"
                            className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-md text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-sm"
                          />
                        </div>

                        {!activeWidget.isDraft && (
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Public API Key</label>
                            <div className="flex rounded-md shadow-sm">
                              <input
                                type="text"
                                readOnly
                                value={activeWidget.public_api_key}
                                className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-l-md text-sm font-mono text-neutral-600 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => copyToClipboard(activeWidget.public_api_key)}
                                title="Copy API key"
                                className="px-3 py-2 bg-white border-y border-r border-neutral-300 rounded-r-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </section>

                    <hr className="border-neutral-200" />

                    {/* ── Section: Security ─── */}
                    <section>
                      <h3 className="text-sm font-semibold text-neutral-900 mb-1">Security — Allowed Origins</h3>
                      <p className="text-sm text-neutral-500 mb-5">
                        Only requests from these origins will be accepted. Leave empty to block all traffic.
                      </p>

                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newOrigin}
                            onChange={e => { setNewOrigin(e.target.value); setSaveSuccess(false); }}
                            onKeyDown={handleAddOrigin}
                            placeholder="https://example.com"
                            className="flex-1 px-3 py-2 bg-white border border-neutral-300 rounded-md text-sm font-mono text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={handleAddOrigin as any}
                            className="px-4 py-2 bg-white border border-neutral-300 text-neutral-700 text-sm font-medium rounded-md hover:bg-neutral-50 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                          >
                            Add
                          </button>
                        </div>

                        <div className="border border-neutral-200 rounded-md overflow-hidden">
                          {origins.length === 0 ? (
                            <div className="px-4 py-3 bg-neutral-50 text-sm text-neutral-400 text-center">
                              No origins added yet.
                            </div>
                          ) : (
                            <ul className="divide-y divide-neutral-100 max-h-48 overflow-y-auto">
                              {origins.map((org, i) => (
                                <li key={i} className="flex items-center justify-between px-4 py-2 hover:bg-neutral-50 transition-colors">
                                  <span className="font-mono text-xs text-neutral-700">{org}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeOrigin(i)}
                                    className="p-1 text-neutral-400 hover:text-red-600 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </section>

                    <hr className="border-neutral-200" />

                    {/* ── Section: Widget Delivery ─── */}
                    <section>
                      <h3 className="text-sm font-semibold text-neutral-900 mb-1">Widget Delivery</h3>
                      <p className="text-sm text-neutral-500 mb-5">Customize the embedded widget appearance and copy the snippet.</p>

                      <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Primary Color</label>
                            <div className="flex gap-2 items-center">
                              <input
                                type="color"
                                value={primaryColor}
                                onChange={e => setPrimaryColor(e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer border border-neutral-300 p-0"
                              />
                              <input
                                type="text"
                                value={primaryColor}
                                onChange={e => setPrimaryColor(e.target.value)}
                                className="w-24 px-2 py-1.5 bg-white border border-neutral-300 rounded-md text-sm font-mono text-neutral-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Position</label>
                            <select
                              value={widgetPosition}
                              onChange={e => setWidgetPosition(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-md text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
                            >
                              <option value="bottom-right">Bottom Right</option>
                              <option value="bottom-left">Bottom Left</option>
                            </select>
                          </div>
                        </div>

                        {!activeWidget.isDraft && (
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Embed Snippet</label>
                            <div className="bg-neutral-900 border border-neutral-800 rounded-md p-4 overflow-x-auto relative">
                              <button
                                onClick={() => copyToClipboard(`<script src="${systemApi.getWidgetScriptUrl()}" data-api-key="${activeWidget.public_api_key}" defer></script>`)}
                                className="absolute top-2 right-2 p-1 text-neutral-400 hover:text-white transition-colors focus-visible:outline-none"
                                title="Copy snippet"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <pre className="font-mono text-xs text-neutral-300 leading-relaxed">
                                <span className="text-neutral-500">{'<!-- Drop before </body> -->'}</span>{'\n'}
                                <span className="text-pink-400">{'<script'}</span>
                                {' '}<span className="text-blue-300">src=</span>
                                <span className="text-yellow-300">"{systemApi.getWidgetScriptUrl()}"</span>{'\n'}
                                {'        '}<span className="text-blue-300">data-api-key=</span>
                                <span className="text-yellow-300">"{activeWidget.public_api_key}"</span>
                                {' '}<span className="text-blue-300">defer</span>
                                <span className="text-pink-400">{'></script>'}</span>
                              </pre>
                            </div>
                          </div>
                        )}

                        {sandboxUrl && (
                          <div className="pt-1">
                            <a
                              href={sandboxUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 text-sm font-medium rounded-md hover:bg-neutral-50 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                            >
                              <Play className="w-4 h-4" /> Open in Sandbox
                            </a>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Payload Inspector Modal ────────────────────────────────────────── */}
      {selectedLead && (
        <div
          className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
          onClick={e => { if (e.target === e.currentTarget) setSelectedLead(null); }}
        >
          <div className="bg-white border border-neutral-200 rounded-lg w-full max-w-3xl shadow-xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex-none px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50 rounded-t-lg">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-neutral-500" />
                <h3 className="text-sm font-semibold text-neutral-900">Payload Inspector</h3>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-neutral-400 hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded p-0.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Meta Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-neutral-100">
                {[
                  { label: 'Lead ID', value: selectedLead.id },
                  { label: 'Widget ID', value: selectedLead.widget_id },
                  { label: 'Timestamp', value: new Date(selectedLead.created_at).toISOString() },
                  { label: 'IP Address', value: selectedLead.ip_address || 'Unknown' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 mb-1">{item.label}</div>
                    <div className="text-xs font-mono text-neutral-900 truncate" title={item.value}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Parsed Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Form Data */}
                <div className="border border-neutral-200 rounded-md overflow-hidden">
                  <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-200">
                    <span className="text-xs font-semibold text-neutral-700">Form Submission</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {(() => {
                      const obj = parseJson(selectedLead.data, {});
                      const entries = Object.entries(obj);
                      if (entries.length === 0) return <p className="text-sm text-neutral-400 italic">No data</p>;
                      return entries.map(([key, val]) => (
                        <div key={key}>
                          <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 mb-0.5">{key}</div>
                          <div className="text-sm text-neutral-900 font-medium">{String(val)}</div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Geo Data */}
                <div className="border border-neutral-200 rounded-md overflow-hidden">
                  <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-200">
                    <span className="text-xs font-semibold text-neutral-700">Location & Network</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {(() => {
                      const obj = parseJson(selectedLead.geo_data, {});
                      const entries = Object.entries(obj);
                      if (entries.length === 0) return <p className="text-sm text-neutral-400 italic">No geo data (local IP)</p>;
                      return entries.map(([key, val]) => (
                        <div key={key}>
                          <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 mb-0.5">{key}</div>
                          <div className="text-sm text-neutral-900 font-medium">{String(val)}</div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              {/* Raw JSON */}
              <div className="pt-2 border-t border-neutral-100 space-y-3">
                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Raw Telemetry</h4>
                <div className="bg-neutral-50 border border-neutral-200 rounded-md p-4">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 mb-2">Payload</div>
                  <pre className="font-mono text-xs text-neutral-700 whitespace-pre-wrap break-all">
                    {JSON.stringify(parseJson(selectedLead.data, {}), null, 2)}
                  </pre>
                </div>
                {selectedLead.geo_data && parseJson(selectedLead.geo_data, null) && (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-md p-4">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 mb-2">Geo Enrichment</div>
                    <pre className="font-mono text-xs text-neutral-700 whitespace-pre-wrap break-all">
                      {JSON.stringify(parseJson(selectedLead.geo_data, {}), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
      {showDeleteModal && activeWidget && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white border border-neutral-200 rounded-lg w-full max-w-md shadow-xl flex flex-col">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Delete Workspace?</h3>
              <p className="text-sm text-neutral-500 mb-5">
                This action cannot be undone. All telemetry data and settings will be permanently lost.
              </p>
              
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Please type <span className="font-bold text-neutral-900">"{activeWidget.title}"</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationName}
                onChange={e => setDeleteConfirmationName(e.target.value)}
                placeholder={activeWidget.title}
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-md text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent shadow-sm"
              />
            </div>
            
            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-end gap-3 rounded-b-lg">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteWidget}
                disabled={deleteConfirmationName !== activeWidget.title || saving}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
              >
                {saving ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
