import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import { getDoctorByUserId } from "../../lib/doctorsService";
import { getUserSubscription, isSubscriptionActive } from "../../lib/subscriptionsService";
import { useSidebarStore } from "../../store/sidebarStore";
import CompleteProfileModal from "./CompleteProfileModal";
import {
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  UserIcon,
  StarIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  VideoCameraIcon,
  ChevronRightIcon as ChevronRightSmallIcon,
  CurrencyDollarIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

// Navegación base (disponible para todos)
const baseNavigation = [
  { name: "Inicio", href: "/admin", icon: HomeIcon },
  { name: "Perfil", href: "/admin/profile", icon: UserIcon },
  { name: "Suscripción", href: "/admin/subscription", icon: CurrencyDollarIcon },
];

// Navegación premium (solo para suscriptores)
const premiumNavigation = [
  { name: "Inicio", href: "/admin", icon: HomeIcon },
  { name: "Pacientes", href: "/admin/patients", icon: UserGroupIcon },
  { name: "Agenda", href: "/admin/schedule", icon: CalendarIcon },
  { name: "Perfil", href: "/admin/profile", icon: UserIcon },
  { name: "Reseñas", href: "/admin/reviews", icon: StarIcon },
  {
    name: "Referencias",
    href: "/admin/referrals",
    icon: ArrowRightOnRectangleIcon,
  },
  {
    name: "Video Consulta",
    href: "/admin/video-consultation",
    icon: VideoCameraIcon,
  },
  { name: "Suscripción", href: "/admin/subscription", icon: CurrencyDollarIcon },
];

// Lista de emails autorizados como superadmin
const SUPERADMIN_EMAILS = ["juan@jhernandez.mx"];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebarStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [doctorData, setDoctorData] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

  const isSuperAdmin =
    currentUser && SUPERADMIN_EMAILS.includes(currentUser.email);

  // Check for welcome message in URL
  useEffect(() => {
    const { newGoogleUser } = router.query;
    if (newGoogleUser === "true") {
      setShowWelcomeMessage(true);
      // Remove query params from URL without reload
      router.replace("/admin", undefined, { shallow: true });
    }
  }, [router.query]);

  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;

      try {
        const [doctor, userSubscription] = await Promise.all([
          getDoctorByUserId(currentUser.uid),
          getUserSubscription(currentUser.uid)
        ]);
        
        setDoctorData(doctor);
        setSubscription(userSubscription);
        
        // Check if profile is incomplete for Google users
        if (doctor && doctor.isGoogleUser && !doctor.profileComplete) {
          setShowCompleteProfileModal(true);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setSubscriptionLoading(false);
      }
    }

    loadData();
  }, [currentUser]);

  // Handle welcome message auto-hide
  useEffect(() => {
    if (showWelcomeMessage) {
      const timer = setTimeout(() => {
        setShowWelcomeMessage(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showWelcomeMessage]);

  const hasActiveSubscription = isSubscriptionActive(subscription);
  const navigation = hasActiveSubscription ? premiumNavigation : baseNavigation;

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/auth/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleProfileComplete = async (updatedData) => {
    try {
      // Update doctor data in state
      setDoctorData(prev => ({
        ...prev,
        ...updatedData,
        profileComplete: true
      }));
      
      // Close modal
      setShowCompleteProfileModal(false);
      setProfileError("");
      
      // Optionally reload the page to refresh all data
      window.location.reload();
    } catch (error) {
      console.error("Error handling profile completion:", error);
      setProfileError("Error al completar el perfil");
    }
  };

  const handleProfileError = (error) => {
    setProfileError(error);
  };

  const sidebarWidth = isCollapsed ? "w-16" : "w-64";
  const contentMargin = isCollapsed ? "ml-16" : "ml-64";

  // Generate breadcrumbs based on current route
  const generateBreadcrumbs = () => {
    const pathSegments = router.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Inicio', href: '/admin', icon: HomeIcon }];

    if (pathSegments.length > 1) {
      const currentPage = pathSegments[pathSegments.length - 1];
      const navItem = navigation.find(item => item.href.includes(currentPage));
      
      if (navItem) {
        breadcrumbs.push({
          name: navItem.name,
          href: navItem.href,
          icon: navItem.icon
        });
      } else {
        // Handle dynamic routes or special cases
        const breadcrumbMap = {
          'patients': { name: 'Pacientes', href: '/admin/patients', icon: UserGroupIcon },
          'schedule': { name: 'Agenda', href: '/admin/schedule', icon: CalendarIcon },
          'profile': { name: 'Perfil', href: '/admin/profile', icon: UserIcon },
          'reviews': { name: 'Reseñas', href: '/admin/reviews', icon: StarIcon },
          'referrals': { name: 'Referencias', href: '/admin/referrals', icon: ArrowRightOnRectangleIcon },
          'video-consultation': { name: 'Video Consulta', href: '/admin/video-consultation', icon: VideoCameraIcon },
        };

        if (breadcrumbMap[currentPage]) {
          breadcrumbs.push(breadcrumbMap[currentPage]);
        }
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

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

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 ${sidebarWidth} bg-gradient-to-b from-amber-50 to-yellow-50 shadow-xl border-r border-amber-100 transition-all duration-300 ease-in-out`}
      >
        {/* Logo section */}
        <div className="flex h-16 items-center justify-center border-b border-amber-200 bg-white/50 backdrop-blur-sm">
          {!isCollapsed ? (
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
            </div>
          ) : (
            <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
          )}
        </div>

        {/* Collapse button */}
        <div className="flex justify-center py-2 border-b border-amber-100">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-amber-100 text-amber-700 transition-colors duration-200"
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
          {/* Subscription Status Banner */}
          {!subscriptionLoading && !hasActiveSubscription && !isCollapsed && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <LockClosedIcon className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <p className="text-xs text-yellow-800 font-medium">
                    Sin suscripción activa
                  </p>
                  <p className="text-xs text-yellow-600">
                    Funciones limitadas
                  </p>
                </div>
              </div>
            </div>
          )}

          {navigation.map((item) => {
            const isActive = router.pathname === item.href;
            const isRestricted = !hasActiveSubscription && 
              !baseNavigation.some(nav => nav.href === item.href);
            
            return (
              <div key={item.name} className="relative">
                {isRestricted ? (
                  <div
                    className={`flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 opacity-50 cursor-not-allowed ${
                      isCollapsed ? "justify-center" : ""
                    }`}
                    title={isCollapsed ? `${item.name} (Requiere suscripción)` : ""}
                  >
                    <item.icon
                      className={`h-5 w-5 ${
                        isCollapsed ? "mx-auto" : "mr-3"
                      } flex-shrink-0 text-gray-400`}
                    />
                    {!isCollapsed && (
                      <span className="truncate text-gray-400 flex items-center">
                        {item.name}
                        <LockClosedIcon className="h-3 w-3 ml-2" />
                      </span>
                    )}
                    
                    {/* Tooltip for restricted items */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {item.name} (Requiere suscripción)
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                      isActive
                        ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg transform scale-105"
                        : "text-amber-700 hover:bg-amber-100 hover:text-amber-800"
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
                )}

                {/* Tooltip for collapsed sidebar */}
                {!isRestricted && isCollapsed && (
                  <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User info section */}
        <div className="absolute bottom-20 left-0 right-0 px-2">
          {!isCollapsed && doctorData && (
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-amber-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center shadow-md">
                  <UserIcon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {doctorData.nombre}
                  </p>
                  <p className="text-xs text-amber-600 truncate">
                    {doctorData.especialidad}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Logout button */}
        <div className="absolute bottom-4 left-0 right-0 px-2">
          <button
            onClick={handleLogout}
            className={`flex items-center w-full px-3 py-3 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors duration-200 group ${
              isCollapsed ? "justify-center" : ""
            }`}
            title={isCollapsed ? "Cerrar Sesión" : ""}
          >
            <ArrowLeftOnRectangleIcon
              className={`h-5 w-5 ${
                isCollapsed ? "mx-auto" : "mr-3"
              } flex-shrink-0`}
            />
            {!isCollapsed && <span>Cerrar Sesión</span>}

            {/* Tooltip for collapsed sidebar */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Cerrar Sesión
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div
        className={`transition-all duration-300 ease-in-out ${contentMargin}`}
      >
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>

              {/* Search bar */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar pacientes..."
                  className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Status indicator */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Disponible</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserMenu(!showUserMenu);
                  }}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center shadow-md">
                    <UserIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-700">
                      {doctorData ? doctorData.nombre : "Cargando..."}
                    </p>
                    <p className="text-xs text-gray-500">
                      {doctorData ? doctorData.especialidad : ""}
                    </p>
                  </div>
                </button>

                {/* User dropdown menu */}
                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg border border-gray-200 py-2 z-50 bg-white"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {doctorData ? doctorData.nombre : "Cargando..."}
                      </p>
                      <p className="text-xs text-gray-500">
                        {currentUser ? currentUser.email : ""}
                      </p>
                    </div>

                    <Link
                      href="/admin/profile"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors duration-200"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <UserIcon className="w-4 h-4 mr-3" />
                      Mi Perfil
                    </Link>

                    <Link
                      href="/doctores"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors duration-200"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <HomeIcon className="w-4 h-4 mr-3" />
                      Ver sitio público
                    </Link>

                    {isSuperAdmin && (
                      <Link
                        href="/superadmin"
                        className="flex items-center px-4 py-3 text-sm text-purple-600 hover:bg-purple-50 transition-colors duration-200"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Cog6ToothIcon className="w-4 h-4 mr-3" />
                        Panel SuperAdmin
                      </Link>
                    )}

                    <hr className="my-2 border-gray-100" />

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                      <ArrowLeftOnRectangleIcon className="w-4 h-4 mr-3" />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Breadcrumbs */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              {breadcrumbs.map((breadcrumb, index) => (
                <li key={breadcrumb.href} className="flex items-center">
                  {index > 0 && (
                    <ChevronRightSmallIcon className="h-4 w-4 text-gray-400 mx-2" />
                  )}
                  <Link
                    href={breadcrumb.href}
                    className={`flex items-center space-x-2 text-sm font-medium transition-colors duration-200 ${
                      index === breadcrumbs.length - 1
                        ? 'text-amber-600 cursor-default'
                        : 'text-gray-500 hover:text-amber-600'
                    }`}
                  >
                    <breadcrumb.icon className="h-4 w-4" />
                    <span>{breadcrumb.name}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Page content */}
        <main className="min-h-screen bg-gray-50 transition-all duration-300 ease-in-out">
          {children}
        </main>
      </div>

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-amber-50 to-yellow-50 shadow-xl border-r border-amber-100 transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile sidebar content - same as desktop but always expanded */}
        <div className="flex h-16 items-center justify-center border-b border-amber-200 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
          </div>
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
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg"
                    : "text-amber-700 hover:bg-amber-100 hover:text-amber-800"
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

        <div className="absolute bottom-4 left-0 right-0 px-2">
          <button
            onClick={() => {
              setSidebarOpen(false);
              handleLogout();
            }}
            className="flex items-center w-full px-3 py-3 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors duration-200"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3 flex-shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Click outside to close menus */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowUserMenu(false)}
        />
      )}

      {/* Welcome Message for New Google Users */}
      {showWelcomeMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  ¡Bienvenido a la plataforma!
                </h3>
                <p className="mt-1 text-sm text-green-700">
                  Tu cuenta se ha creado exitosamente. Por favor completa tu perfil profesional para continuar.
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setShowWelcomeMessage(false)}
                  className="text-green-400 hover:text-green-600"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Profile Modal */}
      {showCompleteProfileModal && doctorData && (
        <CompleteProfileModal
          doctor={doctorData}
          onComplete={handleProfileComplete}
          onError={handleProfileError}
        />
      )}

      {/* Welcome Message for New Google Users */}
      {showWelcomeMessage && (
        <div className="fixed top-4 right-4 z-40">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  ¡Bienvenido a tu panel médico!
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Tu cuenta se creó exitosamente. Completa tu perfil para comenzar.
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setShowWelcomeMessage(false)}
                  className="text-green-400 hover:text-green-600"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Error Alert */}
      {profileError && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{profileError}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setProfileError("")}
                  className="text-red-400 hover:text-red-600"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
