import { useState } from 'react';
import { Loader2, ArrowLeft, Activity } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/index';

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const validateForm = (): boolean => {
    if (mode === 'register' && !name.trim()) {
      setError('Full name is required.');
      return false;
    }
    if (!email.trim()) {
      setError('Email is required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Enter a valid email address.');
      return false;
    }
    if (!password) {
      setError('Password is required.');
      return false;
    }
    if (mode === 'register' && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    setLoading(true);

  try {                                                                                            
          if (mode === 'login') {                                                                        
            await authApi.login({ email: email.trim(), password });                                      
          } else {                                                                                       
            await authApi.register({ email: email.trim(), password, name: name.trim() });                
          }                                                                                              
                                                                                                         
      

      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 bg-white border border-neutral-300 rounded-md text-sm text-neutral-900 placeholder:text-neutral-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow';

  return (
    <div className="min-h-screen flex flex-col font-sans bg-neutral-50 text-neutral-900 selection:bg-blue-100">

      {/* Back link */}
      <div className="absolute top-0 left-0 w-full p-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[380px] bg-white border border-neutral-200 rounded-lg shadow-sm p-8">

          {/* Logo + Title */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-8 h-8 border border-neutral-200 bg-neutral-50 flex items-center justify-center rounded-md mb-4">
              <Activity className="w-4 h-4 text-neutral-700" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 tracking-tight">
              {mode === 'login' ? 'Sign in to SignalLead' : 'Create your account'}
            </h2>
            <p className="text-sm text-neutral-500 mt-1.5">
              {mode === 'login' ? 'Enter your credentials to continue.' : 'Get started in seconds.'}
            </p>
          </div>

          {/* Server / Validation Error */}
          {error && (
            <div className="mb-5 px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-neutral-700">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  autoComplete="name"
                  className={inputClass}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className={inputClass}
              />
              {mode === 'register' && (
                <p className="text-xs text-neutral-400 mt-1">Minimum 8 characters.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-neutral-900 text-white hover:bg-neutral-800 rounded-md font-medium text-sm transition-colors flex justify-center items-center gap-2 disabled:opacity-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                : mode === 'login' ? 'Sign In' : 'Create Account'
              }
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-neutral-500">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="font-medium text-neutral-900 hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
