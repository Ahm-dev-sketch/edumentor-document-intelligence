import React, { useState } from 'react';
import { BookOpen, LogIn, Mail, Lock, ShieldAlert, Loader2 } from 'lucide-react';
import { translations, Language } from '../lib/translations';

interface LoginViewProps {
  onLoginSuccess: (email: string) => void;
  lang: Language;
}

export default function LoginView({ onLoginSuccess, lang }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const t = translations[lang || 'id'];

  const handleGoogleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    
    // Simulate natural OAuth redirect and back callback
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess('ahmaddhani7901@gmail.com');
    }, 1200);
  };

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg(t.errorRequired);
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      setLoading(false);
      onLoginSuccess(email);
    }, 1000);
  };

  return (
    <div id="login-screen" className="min-h-screen bg-slate-50 dark:bg-black flex flex-col items-center justify-center p-4">
      <div id="login-card" className="w-full max-w-sm bg-white dark:bg-zinc-950/20 border border-slate-200 dark:border-zinc-850 rounded-2xl shadow-xl p-6 space-y-6">
        
        {/* Brand visual header */}
        <div className="flex flex-col items-center text-center">
          <div className="h-12 w-12 bg-blue-900 text-white rounded-xl flex items-center justify-center shadow-sm mb-3">
            <BookOpen className="h-6 w-6" />
          </div>
          <h1 id="login-brand-title" className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight font-sans">
            {t.brandTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-sans">
            {t.brandDesc}
          </p>
        </div>

        {/* Input Form container */}
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-mono">
              {t.emailLabel}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 dark:text-zinc-500">
                <Mail className="h-4 w-4" />
              </span>
              <input
                id="login-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 text-xs rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-900/50 text-slate-800 dark:text-slate-101 font-sans"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-mono">
              {t.passwordLabel}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 dark:text-zinc-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                id="login-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 text-xs rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-900/50 text-slate-800 dark:text-slate-101 font-sans"
              />
            </div>
          </div>

          {errorMsg && (
            <div id="login-err-msg" className="flex items-center gap-1.5 text-xs text-red-650 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-lg p-2.5 font-sans">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Regular Login Submission */}
          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {t.loginEmailBtn}
          </button>
        </form>

        {/* Divider badge */}
        <div className="flex items-center justify-between gap-4">
          <div className="h-px bg-slate-100 dark:bg-zinc-800 flex-1" />
          <span className="text-[9px] text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-mono">{t.orSeparator}</span>
          <div className="h-px bg-slate-100 dark:bg-zinc-805 flex-1" />
        </div>

        {/* Google SSO Login */}
        <button
          id="login-google-oauth"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-750 dark:text-zinc-200 font-semibold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.2-.01-.01-.17-.63"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          {t.loginGoogleBtn}
        </button>

        {/* Footer credits */}
        <p className="text-[10px] text-center text-slate-400 dark:text-zinc-500 font-mono">
          EduMentor Core Ingest v1.1.0 • HTTPS Secure
        </p>

      </div>
    </div>
  );
}
