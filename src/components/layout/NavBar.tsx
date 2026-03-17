'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/components/providers/AuthProvider';

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/acerca-de', label: 'Acerca de' },
  { href: '/doctores', label: 'Especialistas' },
  { href: '/especialidades', label: 'Especialidades' },
  { href: '/preguntas-frecuentes', label: 'Preguntas Frecuentes' },
];

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, userType, profile, loading, logout, getDashboardUrl } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Hide NavBar on admin/superadmin panels
  if (pathname.startsWith('/admin') || pathname.startsWith('/superadmin')) return null;

  const typeBadge = () => {
    const map = {
      doctor: { label: 'Doctor', color: 'bg-blue-100 text-blue-700' },
      patient: { label: 'Paciente', color: 'bg-green-100 text-green-700' },
      superadmin: { label: 'Admin', color: 'bg-purple-100 text-purple-700' },
    };
    if (!userType || !map[userType]) return null;
    const { label, color } = map[userType];
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{label}</span>;
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200'
            : 'bg-white border-b border-gray-200'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <img
                src="/img/logo.png"
                alt="SaludLibre"
                width={40}
                height={40}
                className="w-10 h-10"
              />
              <span className="text-xl font-bold text-[#011d2f] hidden sm:block">
                Salud<span className="text-[#4dbad9]">Libre</span>
              </span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-3 py-2 text-sm font-medium transition-colors rounded-lg
                      ${active ? 'text-[#4dbad9]' : 'text-gray-700 hover:text-[#4dbad9]'}
                    `}
                  >
                    {link.label}
                    {active && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-[#4dbad9] to-[#e8ad0f]" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Auth Button / User Menu */}
            <div className="flex items-center gap-3">
              {loading ? (
                <div className="w-24 h-9 bg-gray-200 rounded-lg animate-pulse" />
              ) : user ? (
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#4dbad9]/20 flex items-center justify-center text-[#4dbad9] font-medium text-sm overflow-hidden">
                      {profile?.profileImage ? (
                        <img src={profile.profileImage} alt="" width={32} height={32} className="w-full h-full object-cover" />
                      ) : (
                        (profile?.name?.[0] ?? user.email?.[0] ?? 'U').toUpperCase()
                      )}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                      {profile?.name ?? user.email}
                    </span>
                    {typeBadge()}
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>

                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">{profile?.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <Link
                          href={getDashboardUrl()}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                          Mi Panel
                        </Link>
                        <button
                          onClick={() => { logout(); setDropdownOpen(false); }}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          Cerrar Sesión
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    href="/paciente/login"
                    className="px-4 py-2 text-sm font-medium text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    Pacientes
                  </Link>
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-[#4dbad9] to-[#3aa8c7] hover:from-[#3aa8c7] hover:to-[#2d97b4] transition-all shadow-sm"
                  >
                    Doctores
                  </Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Menú"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  }
                </svg>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-50 shadow-2xl lg:hidden overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-8">
                <span className="text-lg font-bold text-[#011d2f]">
                  Salud<span className="text-[#4dbad9]">Libre</span>
                </span>
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-1">
                {NAV_LINKS.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors
                        ${active ? 'bg-[#4dbad9]/10 text-[#4dbad9]' : 'text-gray-700 hover:bg-gray-50'}
                      `}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-[#4dbad9]/20 flex items-center justify-center text-[#4dbad9] font-medium">
                        {(profile?.name?.[0] ?? 'U').toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{profile?.name}</p>
                        <div className="mt-0.5">{typeBadge()}</div>
                      </div>
                    </div>
                    <Link href={getDashboardUrl()} className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                      Mi Panel
                    </Link>
                    <button onClick={logout} className="block w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg">
                      Cerrar Sesión
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">Ingresá como</p>
                    <Link href="/paciente/login" className="block w-full text-center px-4 py-3 text-sm font-medium text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors">
                      Pacientes
                    </Link>
                    <Link href="/auth/login" className="block w-full text-center px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-[#4dbad9] to-[#3aa8c7] rounded-lg transition-colors">
                      Doctores
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}
