import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Box } from 'lucide-react';

export default function Demo() {
  const [searchParams, setSearchParams] = useSearchParams();

  // If navigated here from Dashboard with ?key= already in URL, use it immediately
  const [apiKey, setApiKey] = useState(searchParams.get('key') || '');
  const [loadedKey, setLoadedKey] = useState(searchParams.get('key') || '');

  const previewColor = searchParams.get('color') || '#2563EB';
  const previewPos = searchParams.get('pos') || 'bottom-right';

  // Ref guards against React StrictMode double-invocation of the effect
  const mountedRef = useRef(false);

  const handleLoadWidget = () => {
    const key = apiKey.trim();
    if (!key) return;
    setSearchParams({ key, color: previewColor, pos: previewPos });
    setLoadedKey(key);
    mountedRef.current = false; // allow effect to re-run for the new key
  };

  useEffect(() => {
    if (!loadedKey) return;
    // Guard: only run once per loadedKey value (prevents StrictMode double-mount)
    if (mountedRef.current) return;
    mountedRef.current = true;

    // Clean up any previously injected widget
    document.getElementById('flyrank-widget-script')?.remove();
    document.getElementById('flyrank-widget-root')?.remove();

    const script = document.createElement('script');
    script.id = 'flyrank-widget-script';
    script.async = false;                         // required for document.currentScript to work
    script.src = `/widget.js?t=${Date.now()}`;   // cache-bust so updated widget.js is always fetched
    script.setAttribute('data-api-key', loadedKey);
    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount or key change
      document.getElementById('flyrank-widget-script')?.remove();
      document.getElementById('flyrank-widget-root')?.remove();
      mountedRef.current = false;
    };
  }, [loadedKey]);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 font-sans text-neutral-900 selection:bg-blue-100">
      {/* Inject style overrides for color/position — applied on top of widget.js defaults */}
      <style>{`
        #flyrank-widget-root {
          ${previewPos === 'bottom-left'
            ? 'right: auto !important; left: 24px !important;'
            : 'left: auto !important; right: 24px !important;'
          }
        }
        #flyrank-widget-root button[type="submit"] {
          background: ${previewColor} !important;
        }
      `}</style>

      {/* Top Banner */}
      <div className="flex-none h-14 bg-white border-b border-neutral-200 px-6 flex items-center justify-between z-40 relative">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-600" />
          <span className="text-sm font-semibold text-neutral-900">Sandbox</span>
          {loadedKey && (
            <span className="hidden sm:inline ml-2 font-mono text-xs text-neutral-400 bg-neutral-100 border border-neutral-200 rounded px-2 py-0.5">
              {loadedKey}
            </span>
          )}
        </div>
        <Link
          to="/dashboard"
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          ← Return to Console
        </Link>
      </div>

      {!loadedKey ? (
        /* ── Key entry screen ──────────────────────────────────────────── */
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-lg shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded border border-neutral-200 bg-neutral-50 flex items-center justify-center flex-none">
                <Box className="w-5 h-5 text-neutral-700" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-neutral-900">Widget Sandbox</h2>
                <p className="text-sm text-neutral-500">Enter your API key to preview the widget.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Public API Key</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-md text-sm font-mono text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
                  placeholder="key_..."
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLoadWidget()}
                  autoFocus
                />
              </div>
              <button
                onClick={handleLoadWidget}
                disabled={!apiKey.trim()}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                Load Widget
              </button>
            </div>
          </div>
        </div>

      ) : (
        /* ── Wireframe preview background ─────────────────────────────── */
        <div className="relative flex-1 bg-neutral-50 bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:48px_48px] overflow-hidden">

          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span className="text-[5rem] sm:text-[7rem] font-bold text-neutral-900/5 rotate-[-8deg] whitespace-nowrap tracking-tight">
              Target Page
            </span>
          </div>

          {/* Skeleton page chrome */}
          <div className="absolute inset-0 pointer-events-none flex flex-col">
            <nav className="border-b border-neutral-200 bg-white/60 px-8 py-4 flex justify-between items-center">
              <div className="w-28 h-5 bg-neutral-200 rounded" />
              <div className="hidden sm:flex gap-5">
                <div className="w-14 h-4 bg-neutral-200 rounded" />
                <div className="w-14 h-4 bg-neutral-200 rounded" />
                <div className="w-14 h-4 bg-neutral-200 rounded" />
              </div>
              <div className="w-20 h-8 bg-neutral-200 rounded" />
            </nav>

            <div className="flex-1 max-w-4xl mx-auto w-full px-8 py-20 flex flex-col items-center">
              <div className="w-3/4 h-12 bg-neutral-200 rounded mb-6" />
              <div className="w-1/2 h-5 bg-neutral-200 rounded mb-16" />
              <div className="w-full grid sm:grid-cols-3 gap-6 mb-12">
                <div className="h-36 bg-white border border-neutral-200 rounded shadow-sm" />
                <div className="h-36 bg-white border border-neutral-200 rounded shadow-sm" />
                <div className="h-36 bg-white border border-neutral-200 rounded shadow-sm" />
              </div>
              <div className="w-full space-y-3">
                <div className="w-full h-3 bg-neutral-200 rounded" />
                <div className="w-5/6 h-3 bg-neutral-200 rounded" />
                <div className="w-3/4 h-3 bg-neutral-200 rounded" />
              </div>
            </div>
          </div>

          {/* Reload widget button */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
            <button
              onClick={() => { mountedRef.current = false; setLoadedKey(prev => prev + ' '); setTimeout(() => setLoadedKey(loadedKey), 10); }}
              className="px-4 py-2 bg-white border border-neutral-200 text-neutral-600 text-xs font-medium rounded-full shadow-sm hover:bg-neutral-50 transition-colors"
            >
              Reload Widget
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
