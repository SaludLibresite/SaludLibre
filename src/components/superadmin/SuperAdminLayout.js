import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useSidebarStore } from '../../store/sidebarStore';
import {
  HomeIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

export default function SuperAdminLayout({ children }) {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebarStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (!authLoading && (!currentUser || !currentUser.email === "juan@jhernandez.mx")) {
      router.push('/auth/login?message=superadmin');
    }
  }, [currentUser, authLoading, router]);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/superadmin',
      icon: HomeIcon,
    },
    {
      name: 'Doctores',
      href: '/superadmin/doctors',
      icon: UserGroupIcon,
    },
    {
      name: 'Especialidades',
      href: '/superadmin/specialties',
      icon: Cog6ToothIcon,
    },
    {
      name: 'Planes',
      href: '/superadmin/subscriptions',
      icon: CurrencyDollarIcon,
    },
    {
      name: 'Suscriptores',
      href: '/superadmin/subscriptions-overview',
      icon: UserIcon,
    },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const sidebarWidth = isCollapsed ? "w-16" : "w-64";
  const contentMargin = isCollapsed ? "ml-16" : "ml-64";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-black opacity-50"></div>
        </div>
      )}

      {/* Desktop Sidebar - Hidden on mobile */}
      <div
        className={`hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 ${sidebarWidth} bg-gradient-to-b from-orange-50 to-amber-50 shadow-xl border-r border-orange-100 transition-all duration-300 ease-in-out`}
      >
        <div className="flex h-16 items-center justify-center border-b border-orange-200 bg-white/50 backdrop-blur-sm">
          {!isCollapsed ? (
            <div className="flex items-center space-x-3">
              <span className="text-lg font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                SuperAdmin Panel
              </span>
            </div>
          ) : (
            <span className="text-2xl font-bold text-orange-600">S</span>
          )}
        </div>

        {/* Collapse button */}
        <div className="flex justify-center py-2 border-b border-orange-100">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-orange-100 text-orange-700 transition-colors duration-200"
            title={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-5 w-5" />
            ) : (
              <ChevronLeftIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        <nav className="mt-4 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <div key={item.name} className="relative">
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg transform scale-105"
                      : "text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                  }`}
                  title={isCollapsed ? item.name : ""}
                >
                  <item.icon
                    className={`h-5 w-5 ${
                      isCollapsed ? "mx-auto" : "mr-3"
                    } flex-shrink-0`}
                  />
                  {!isCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                  {isActive && !isCollapsed && (
                    <div className="absolute right-3 w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>

                {/* Tooltip for collapsed sidebar */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Logout button */}
        <div className="absolute bottom-4 left-0 right-0 px-2">
          <button
            onClick={() => router.push('/')}
            className={`flex items-center w-full px-3 py-3 text-sm font-medium text-orange-600 rounded-xl hover:bg-orange-50 transition-colors duration-200 group ${
              isCollapsed ? "justify-center" : ""
            }`}
            title={isCollapsed ? "Volver al Sitio" : ""}
          >
            <ArrowLeftOnRectangleIcon
              className={`h-5 w-5 ${
                isCollapsed ? "mx-auto" : "mr-3"
              } flex-shrink-0`}
            />
            {!isCollapsed && <span>Volver al Sitio</span>}

            {/* Tooltip for collapsed sidebar */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Volver al Sitio
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-orange-50 to-amber-50 shadow-xl border-r border-orange-100 transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile sidebar content */}
        <div className="flex h-16 items-center justify-between border-b border-orange-200 bg-white/50 backdrop-blur-sm px-4">
          <div className="flex items-center space-x-3">
            <span className="text-lg font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              SuperAdmin Panel
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-orange-100 text-orange-700 transition-colors duration-200 lg:hidden"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="mt-4 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg"
                    : "text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                }`}
              >
                <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                <span>{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout button for mobile */}
        <div className="absolute bottom-4 left-0 right-0 px-2">
          <button
            onClick={() => {
              setSidebarOpen(false);
              router.push('/');
            }}
            className="flex items-center w-full px-3 py-3 text-sm font-medium text-orange-600 rounded-xl hover:bg-orange-50 transition-colors duration-200"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3 flex-shrink-0" />
            <span>Volver al Sitio</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="flex h-16 items-center justify-between px-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              {currentUser && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUserMenu(!showUserMenu);
                    }}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full flex items-center justify-center shadow-md">
                      <UserIcon className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-700">
                        SuperAdmin
                      </p>
                      <p className="text-xs text-gray-500">
                        {currentUser.email}
                      </p>
                    </div>
                  </button>

                  {/* User dropdown menu */}
                  {showUserMenu && (
                    <div
                      className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg border border-gray-200 py-2 z-50 bg-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        href="/"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors duration-200"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <HomeIcon className="w-4 h-4 mr-3" />
                        Ver sitio público
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-screen bg-gray-50 p-6">
          {children}
        </main>
      </div>

      {/* Click outside to close menus */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
}
