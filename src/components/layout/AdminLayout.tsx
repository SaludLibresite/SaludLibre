'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import ProtectedRoute from '@/components/guards/ProtectedRoute';
import { useSubscriptionStore, type PlanTier } from '@/src/stores/subscriptionStore';

const FREE_LINKS = [
  { href: '/admin',         label: 'Inicio',       icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/admin/profile', label: 'Perfil',        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { href: '/admin/subscription', label: 'Suscripción', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { href: '/admin/referrals', label: 'Referencias', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
];

// minPlan: minimum plan required to access the link
const PREMIUM_LINKS: { href: string; label: string; icon: string; minPlan: PlanTier }[] = [
  { href: '/admin/patients',           label: 'Pacientes',      minPlan: 'medium', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { href: '/admin/schedule',           label: 'Agenda',         minPlan: 'medium', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href: '/admin/reviews',            label: 'Reseñas',        minPlan: 'medium', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { href: '/admin/video-consultation', label: 'Video Consulta', minPlan: 'plus',   icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
];

const PLAN_ORDER: Record<PlanTier, number> = { free: 0, medium: 1, plus: 2 };

function hasAccess(tier: PlanTier, minPlan: PlanTier) {
  return PLAN_ORDER[tier] >= PLAN_ORDER[minPlan];
}

function getExpiryInfo(expiresAt: string | null): { label: string; urgent: boolean } | null {
  if (!expiresAt) return null;
  const exp = new Date(expiresAt);
  const now = new Date();
  const diffMs = exp.getTime() - now.getTime();
  if (diffMs <= 0) return { label: 'Suscripción vencida', urgent: true };
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) return { label: `Vence en ${diffDays} día${diffDays === 1 ? '' : 's'}`, urgent: true };
  if (diffDays <= 30) return { label: `Vence en ${diffDays} días`, urgent: false };
  // Show exact date if more than 30 days away
  return {
    label: `Vence el ${exp.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    urgent: false,
  };
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { planTier, expiresAt, setSubscription, clearSubscription, isValid } = useSubscriptionStore();

  const isActive = (href: string) => pathname === href || (href !== '/admin' && pathname.startsWith(href));

  useEffect(() => {
    if (!user) return;
    // Use cached value if still valid (< 1 hour old, same user)
    if (isValid(user.uid)) return;

    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/subscriptions/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const tier = (data.subscription?.planId ?? 'free') as PlanTier;
          const expiresAt = data.subscription?.expiresAt ?? null;
          setSubscription(user.uid, PLAN_ORDER[tier] !== undefined ? tier : 'free', expiresAt);
        }
      } catch { /* */ }
    })();
  }, [user, isValid, setSubscription]);

  async function handleLogout() {
    clearSubscription();
    await logout();
    router.push('/');
  }

  const planLabel = planTier === 'plus' ? 'Plus' : planTier === 'medium' ? 'Medium' : 'Free';

  return (
    <ProtectedRoute requiredUserType="doctor">
      <div className="flex min-h-screen">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-4 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#011d2f] text-white shadow-lg lg:hidden"
          aria-label="Abrir menú"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Sidebar backdrop */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-[#011d2f] transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col">
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-4 py-5 lg:py-6">
              <div>
                <h2 className="text-lg font-bold text-white">Panel Médico</h2>
                <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  planTier === 'plus' ? 'bg-[#e8ad0f]/20 text-[#e8ad0f]' :
                  planTier === 'medium' ? 'bg-[#4dbad9]/20 text-[#4dbad9]' :
                  'bg-white/10 text-gray-400'
                }`}>
                  Plan {planLabel}
                </span>
                {planTier !== 'free' && (() => {
                  const expiry = getExpiryInfo(expiresAt);
                  if (!expiry) return null;
                  return (
                    <p className={`mt-1 flex items-center gap-1 text-[10px] font-medium ${expiry.urgent ? 'text-red-400' : 'text-gray-500'}`}>
                      {expiry.urgent && (
                        <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                      )}
                      {expiry.label}
                    </p>
                  );
                })()}
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white lg:hidden">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
              {/* Free links — always visible */}
              {FREE_LINKS.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[#4dbad9]/20 text-[#4dbad9]'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                    </svg>
                    {link.label}
                  </Link>
                );
              })}

              {/* Premium links — shown with lock or active depending on plan */}
              {PREMIUM_LINKS.map((link) => {
                const active = isActive(link.href);
                const accessible = hasAccess(planTier, link.minPlan);
                const badgeLabel = link.minPlan === 'plus' ? 'Plus' : 'Medium';

                return accessible ? (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[#4dbad9]/20 text-[#4dbad9]'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                    </svg>
                    {link.label}
                  </Link>
                ) : (
                  <Link
                    key={link.href}
                    href="/admin/subscription"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-white/5 hover:text-gray-400"
                    title={`Requiere plan ${badgeLabel}`}
                  >
                    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                    </svg>
                    <span className="flex-1">{link.label}</span>
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-[#e8ad0f]/60">
                      {badgeLabel}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* User info + actions */}
            <div className="border-t border-white/10 px-3 py-4 space-y-2">
              {user && (
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-9 h-9 rounded-full bg-[#4dbad9]/20 flex items-center justify-center text-[#4dbad9] text-sm font-bold shrink-0">
                    {(profile?.name?.[0] ?? user.displayName?.[0] ?? user.email?.[0] ?? 'D').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{profile?.name ?? user.displayName ?? 'Doctor'}</p>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              )}

              <Link
                href="/"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                Ir al sitio
              </Link>

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
              >
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 bg-gray-50 lg:ml-64">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
