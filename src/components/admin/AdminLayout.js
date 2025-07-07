import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import { getDoctorByUserId } from "../../lib/doctorsService";
import { useSidebarStore } from "../../store/sidebarStore";
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
} from "@heroicons/react/24/outline";

const navigation = [
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

  const isSuperAdmin =
    currentUser && SUPERADMIN_EMAILS.includes(currentUser.email);

  useEffect(() => {
    async function loadDoctorData() {
      if (!currentUser) return;

      try {
        const doctor = await getDoctorByUserId(currentUser.uid);
        setDoctorData(doctor);
      } catch (error) {
        console.error("Error loading doctor data:", error);
      }
    }

    loadDoctorData();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/auth/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

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
          {navigation.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <div key={item.name} className="relative">
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
        <header className=" shadow-sm border-b border-gray-200 sticky top-0 z-30">
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

              {/* Notification button */}
              <button className="relative p-2 text-gray-400 hover:text-amber-600 transition-colors duration-200">
                <BellIcon className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </button>

              {/* Settings button */}
              <button className="p-2 text-gray-400 hover:text-amber-600 transition-colors duration-200">
                <Cog6ToothIcon className="h-5 w-5" />
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
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
                  <div className="absolute right-0 mt-2 w-56  rounded-xl shadow-lg border border-gray-200 py-2 z-50 ">
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
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
}
