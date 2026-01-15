
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import TermsOfServiceModal from './TermsOfServiceModal';
import { GitHubLink } from './GitHubLink';

type AuthView = 'signin' | 'signup' | 'forgot';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState<AuthView>('signin');
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [showTos, setShowTos] = useState(false);

  // @ts-ignore
  const enableTos = import.meta.env?.VITE_SHOW_TOS === 'true';

  const clearMessage = () => setMessage(null);

  const switchView = (newView: AuthView) => {
    clearMessage();
    setView(newView);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessage();

    try {
      if (view === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Registration successful! Check your email for confirmation (if configured) or log in.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Authentication failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessage();

    try {
      const redirectTo = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Password reset instructions sent! Check your email.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to send reset email' });
    } finally {
      setLoading(false);
    }
  };

  // SVG Icons
  const LogoIcon = () => (
    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" />
    </svg>
  );

  const Spinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700 to-brand-900 z-0"></div>
        {/* Decorative Circle */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-brand-600 opacity-20 blur-3xl z-0"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-brand-500 opacity-20 blur-3xl z-0"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-2xl font-bold tracking-tight">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <LogoIcon />
            </div>
            PolyU Calendar
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl font-extrabold tracking-tight mb-6 leading-tight">
            Manage your university schedule with ease.
          </h1>
          <p className="text-lg text-brand-100/90 leading-relaxed">
            Sync your timetable, merge .ics files, and organize your academic life in one seamless platform.
          </p>
        </div>

        <div className="relative z-10 text-sm text-brand-200/60 font-medium">
          Note: This is a student project and not affiliated with PolyU.
        </div>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white relative">
        <div className="mx-auto w-full max-w-sm lg:w-96">

          {/* Logo for mobile only */}
          <div className="lg:hidden text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-brand-600 rounded-lg flex items-center justify-center text-white mb-4">
              <LogoIcon />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">PolyU Calendar</h2>
          </div>

          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              {view === 'signin' && 'Welcome back'}
              {view === 'signup' && 'Create an account'}
              {view === 'forgot' && 'Reset password'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {view === 'signin' && 'Please enter your details to sign in.'}
              {view === 'signup' && 'Get started with your free account today.'}
              {view === 'forgot' && 'We’ll send you an email to reset your password.'}
            </p>
          </div>

          <div className="mt-8">
            <div className="mt-6">
              {view === 'forgot' ? (
                // Forgot Password Form
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <div className="mt-1">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-colors"
                      />
                    </div>
                  </div>

                  {message && (
                    <div className={`text-sm p-3 rounded-md font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                      {message.text}
                    </div>
                  )}

                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading && <Spinner />}
                      Send Reset Instructions
                    </button>
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => switchView('signin')}
                      className="text-sm font-medium text-brand-600 hover:text-brand-500 transition-colors"
                    >
                      &larr; Back to sign in
                    </button>
                  </div>
                </form>
              ) : (
                // Sign In / Sign Up Form
                <form onSubmit={handleAuth} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <div className="mt-1">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      {view === 'signin' && (
                        <div className="text-sm">
                          <button
                            type="button"
                            onClick={() => switchView('forgot')}
                            className="font-medium text-brand-600 hover:text-brand-500"
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-1">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete={view === 'signin' ? "current-password" : "new-password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-colors"
                      />
                    </div>
                  </div>

                  {message && (
                    <div className={`text-sm p-3 rounded-md font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                      {message.text}
                    </div>
                  )}

                  {enableTos && view === 'signup' && (
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        {/* Simple checkbox for agreement could be added here if needed, but currently just text */}
                      </div>
                      <div className="text-sm text-gray-500 text-center w-full">
                        By signing up, you agree to our{' '}
                        <button type="button" onClick={() => setShowTos(true)} className="font-medium text-brand-600 hover:text-brand-500 underline">
                          Terms of Service
                        </button>
                        .
                      </div>
                    </div>
                  )}

                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading && <Spinner />}
                      {view === 'signin' ? 'Sign in' : 'Create account'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Switcher at the bottom */}
            {view !== 'forgot' && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      {view === 'signin' ? 'New here?' : 'Already have an account?'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => switchView(view === 'signin' ? 'signup' : 'signin')}
                    className="font-medium text-brand-600 hover:text-brand-500 transition-colors"
                  >
                    {view === 'signin' ? 'Create an account' : 'Sign in to your account'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-10">
            <GitHubLink />
          </div>

        </div>
      </div>

      <TermsOfServiceModal isOpen={showTos} onClose={() => setShowTos(false)} />
    </div>
  );
};

export default Auth;

