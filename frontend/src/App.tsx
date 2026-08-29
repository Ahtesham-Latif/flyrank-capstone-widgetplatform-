import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import Landing from './pages/Landing';
import Auth from './components/Auth';
import Dashboard from './pages/Dashboard';
import Demo from './pages/Demo';
import { SESSION_EXPIRED_EVENT } from './api';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white border border-red-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-neutral-600 mb-4">
              An unexpected error occurred in the UI. 
            </p>
            <pre className="text-xs font-mono text-red-600 bg-red-50 p-3 rounded overflow-x-auto mb-6">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-800 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  useEffect(() => {
    const handleSessionExpired = () => {
      window.location.href = '/auth';
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, []);

  return (
    <ErrorBoundary>
      <Router>
      <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900 font-sans selection:bg-blue-100">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/demo" element={<Demo />} />
        </Routes>
      </div>
    </Router>
    </ErrorBoundary>
  );
}
