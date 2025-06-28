import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import { useSidebarStore } from "../../store/sidebarStore";
import {
  CalendarIcon,
  UserIcon,
  StarIcon,
  ClipboardDocumentListIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BellIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

const menuItems = [
  {
    name: "Citas",
    href: "/paciente/appointments",
    icon: CalendarIcon,
    description: "Ver y gestionar mis citas médicas",
  },
  {
    name: "Historial Médico",
    href: "/paciente/medical-records",
    icon: ClipboardDocumentListIcon,
    description: "Registros, archivos y prescripciones",
  },
  {
    name: "Perfil",
    href: "/paciente/profile",
    icon: UserIcon,
    description: "Información personal y médica",
  },
  {
    name: "Reseñas",
    href: "/paciente/reviews",
    icon: StarIcon,
    description: "Calificar mis experiencias médicas",
  },
];

export default function PatientLayout({ children }) {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebarStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [patientData, setPatientData] = useState(null);

  // Load patient data
  useEffect(() => {
    // This would load patient data from Firestore
    // For now, we'll use mock data
    if (currentUser) {
      setPatientData({
        name: currentUser.displayName || "Paciente",
        email: currentUser.email,
        avatar: null,
      });
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/paciente/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent
              isCollapsed={false}
              toggleSidebar={toggleSidebar}
              patientData={patientData}
              handleLogout={handleLogout}
              router={router}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex w-64 flex-col">
          <SidebarContent
            isCollapsed={isCollapsed}
            toggleSidebar={toggleSidebar}
            patientData={patientData}
            handleLogout={handleLogout}
            router={router}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top navigation */}
        <header className="w-full">
          <div className="relative z-10 flex h-16 flex-shrink-0 border-b border-gray-200 bg-white shadow-sm">
            <button
              type="button"
              className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500 lg:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="flex flex-1 justify-between px-4 sm:px-6">
              <div className="flex flex-1">
                <div className="flex items-center">
                  <h1 className="text-lg font-semibold text-gray-900">
                    Portal de Pacientes
                  </h1>
                </div>
              </div>
              <div className="ml-2 flex items-center space-x-4 sm:ml-6 sm:space-x-6">
                {/* Notifications */}
                <button
                  type="button"
                  className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                >
                  <BellIcon className="h-6 w-6" />
                </button>

                {/* User info */}
                {patientData && (
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {patientData.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "P"}
                      </span>
                    </div>
                    <div className="hidden md:block">
                      <div className="text-sm font-medium text-gray-700">
                        {patientData.name}
                      </div>
                      <div className="text-sm text-gray-500">Paciente</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  isCollapsed,
  toggleSidebar,
  patientData,
  handleLogout,
  router,
}) {
  return (
    <div
      className={`flex flex-col h-full bg-gradient-to-b from-amber-50 to-yellow-50 border-r border-amber-100 transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo and toggle */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-amber-200">
        <div className="flex items-center space-x-3">
          <img src="/logo.png" alt="MédicsAR" className="h-12 w-44" />
        </div>
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex p-1.5 rounded-lg hover:bg-amber-100 transition-colors duration-200"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-4 w-4 text-amber-600" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4 text-amber-600" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = router.pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg transform scale-105"
                  : "text-amber-800 hover:bg-amber-100 hover:text-amber-900"
              }`}
              title={isCollapsed ? item.name : ""}
            >
              <item.icon
                className={`flex-shrink-0 h-5 w-5 ${
                  isActive ? "text-white" : "text-amber-600"
                }`}
              />
              {!isCollapsed && (
                <div className="ml-3 flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div
                    className={`text-xs ${
                      isActive ? "text-amber-100" : "text-amber-600"
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      {!isCollapsed && patientData && (
        <div className="border-t border-amber-200 p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {patientData.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() || "P"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {patientData.name}
              </p>
              <p className="text-xs text-amber-600 truncate">
                {patientData.email}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <Link
              href="/paciente/settings"
              className="flex items-center px-3 py-2 text-sm text-amber-700 rounded-lg hover:bg-amber-100 transition-colors duration-200"
            >
              <CogIcon className="h-4 w-4 mr-2" />
              Configuración
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}

      {/* Collapsed user section */}
      {isCollapsed && patientData && (
        <div className="border-t border-amber-200 p-2">
          <div className="flex flex-col items-center space-y-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 flex items-center justify-center">
              <span className="text-xs font-medium text-white">
                {patientData.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() || "P"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200"
              title="Cerrar Sesión"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
