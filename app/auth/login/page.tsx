'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const SUPERADMIN_EMAILS = (
  process.env.NEXT_PUBLIC_SUPERADMIN_EMAILS ?? 'juan@jhernandez.mx'
).split(',');

function isSuperadmin(email: string) {
  return SUPERADMIN_EMAILS.includes(email);
}

export default function DoctorLoginPage() {
  const { login, loginWithGoogle, resetPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const referralCode = searchParams.get('ref') || searchParams.get('referral') || searchParams.get('code') || '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const superadmin = isSuperadmin(email);
      document.cookie = '__session=1; path=/; max-age=604800; SameSite=Lax';
      document.cookie = `__userType=${superadmin ? 'superadmin' : 'doctor'}; path=/; max-age=604800; SameSite=Lax`;
      router.push(superadmin ? '/superadmin' : '/admin');
    } catch {
      setError('Email o contraseña incorrectos. Verificá tus datos e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    try {
      const user = await loginWithGoogle();
      const userEmail = user.email ?? '';
      if (isSuperadmin(userEmail)) {
        document.cookie = '__session=1; path=/; max-age=604800; SameSite=Lax';
        document.cookie = '__userType=superadmin; path=/; max-age=604800; SameSite=Lax';
        router.push('/superadmin');
        return;
      }
      // Check if this user already has a doctor profile
      const token = await user.getIdToken();
      const res = await fetch('/api/doctors/me', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        document.cookie = '__session=1; path=/; max-age=604800; SameSite=Lax';
        document.cookie = '__userType=doctor; path=/; max-age=604800; SameSite=Lax';
        router.push('/admin');
      } else {
        // No doctor profile — send to register to complete it
        router.push('/auth/register');
      }
    } catch {
      setError('Error al iniciar sesión con Google');
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail);
      setForgotSent(true);
    } catch {
      setError('No se pudo enviar el email. Verificá la dirección.');
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div className="min-h-[85vh] flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#011d2f] via-[#0a3d5c] to-[#4dbad9] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#4dbad9] rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Portal Médico</h2>
          <p className="text-lg text-white/70 mb-8 max-w-md">
            Gestioná tus pacientes, turnos y consultas desde un solo lugar. Tu práctica médica, simplificada.
          </p>
          <div className="space-y-4">
            {[
              { icon: '📋', text: 'Gestión de pacientes y turnos' },
              { icon: '💊', text: 'Recetas digitales con formato oficial' },
              { icon: '📹', text: 'Videoconsultas integradas' },
              { icon: '⭐', text: 'Perfil público con reseñas' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-white/80">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <img src="/img/logo.png" alt="SaludLibre" width={48} height={48} className="mx-auto" />
            </Link>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Bienvenido, Doctor</h1>
            <p className="mt-1 text-sm text-gray-500">Ingresá a tu panel de administración</p>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-100">
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleGoogle}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:border-gray-300"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continuar con Google
            </button>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-400">o con email</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200 pl-10 pr-4 py-3 text-sm outline-none transition focus:border-[#4dbad9] focus:ring-2 focus:ring-[#4dbad9]/20"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                  <button type="button" onClick={() => { setShowForgot(true); setForgotEmail(email); }} className="text-xs text-[#4dbad9] hover:underline">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200 pl-10 pr-10 py-3 text-sm outline-none transition focus:border-[#4dbad9] focus:ring-2 focus:ring-[#4dbad9]/20"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                    {showPassword ? (
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#4dbad9] to-[#3aa8c7] py-3 text-sm font-semibold text-white transition hover:from-[#3aa8c7] hover:to-[#2d97b4] disabled:opacity-50 shadow-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Ingresando...
                  </span>
                ) : 'Iniciar Sesión'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              ¿No tenés cuenta?{' '}
              <Link href={`/auth/register${referralCode ? `?ref=${referralCode}` : ''}`} className="font-medium text-[#4dbad9] hover:underline">Registrate como médico</Link>
            </p>

            <div className="mt-4 pt-4 border-t border-gray-100 text-center space-y-2">
              <p className="text-xs text-gray-400">
                ¿Sos paciente?{' '}
                <Link href="/paciente/login" className="text-green-600 hover:underline font-medium">Ingresá acá</Link>
              </p>
              <Link href="/" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => { setShowForgot(false); setForgotSent(false); }} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              {forgotSent ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Email enviado</h3>
                  <p className="mt-2 text-sm text-gray-500">Revisá tu bandeja de entrada en <strong>{forgotEmail}</strong> y seguí las instrucciones para restablecer tu contraseña.</p>
                  <button onClick={() => { setShowForgot(false); setForgotSent(false); }} className="mt-6 w-full rounded-xl bg-[#4dbad9] py-3 text-sm font-semibold text-white hover:bg-[#3aa8c7] transition">
                    Entendido
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-gray-900">Recuperar contraseña</h3>
                  <p className="mt-1 text-sm text-gray-500">Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.</p>
                  <form onSubmit={handleForgotPassword} className="mt-4 space-y-4">
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#4dbad9] focus:ring-2 focus:ring-[#4dbad9]/20"
                      placeholder="tu@email.com"
                    />
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setShowForgot(false)} className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                        Cancelar
                      </button>
                      <button type="submit" disabled={forgotLoading} className="flex-1 rounded-xl bg-[#4dbad9] py-3 text-sm font-semibold text-white hover:bg-[#3aa8c7] transition disabled:opacity-50">
                        {forgotLoading ? 'Enviando...' : 'Enviar enlace'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
