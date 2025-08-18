import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import { useSidebarStore } from "../../store/sidebarStore";
import { usePatientStoreHydrated } from "../../store/patientStore";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { getFamilyMembersByPrimaryPatientId } from "../../lib/familyService";
import PatientSelector from "./PatientSelector";
import { motion, AnimatePresence } from "framer-motion";
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
  HomeIcon,
  ChevronRightIcon as ChevronRightSmallIcon,
} from "@heroicons/react/24/outline";

const menuItems = [
  {
    name: "Inicio",
    href: "/doctores",
    icon: HomeIcon,
    description: "Buscar doctores y especialistas",
  },
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
  const {
    initializePatientData,
    clearPatientData,
    activePatient,
    getActivePatientDisplayName,
    isHydrated,
  } = usePatientStoreHydrated();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Generate breadcrumbs based on current route
  const generateBreadcrumbs = () => {
    const pathSegments = router.pathname.split("/").filter(Boolean);
    const breadcrumbs = [{ name: "Inicio", href: "/doctores" }];

    if (pathSegments.length > 0) {
      // Map route segments to readable names
      const routeMap = {
        paciente: "Pacientes",
        appointments: "Citas",
        "medical-records": "Historial Médico",
        profile: "Perfil",
        reviews: "Reseñas",
      };

      let currentPath = "";
      pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        const name =
          routeMap[segment] ||
          segment.charAt(0).toUpperCase() + segment.slice(1);

        // Don't add the last segment if it's the current page
        if (index < pathSegments.length - 1 || pathSegments.length === 1) {
          breadcrumbs.push({
            name,
            href: currentPath,
          });
        } else {
          breadcrumbs.push({
            name,
            href: null, // Current page, no link
          });
        }
      });
    }

    return breadcrumbs;
  };

  // Load patient and family data
  useEffect(() => {
    async function loadPatientData() {
      if (!currentUser || !isHydrated) {
        setLoading(false);
        return;
      }

      try {
        // Get primary patient data
        const patientsQuery = query(
          collection(db, "patients"),
          where("userId", "==", currentUser.uid)
        );
        const patientsSnapshot = await getDocs(patientsQuery);

        if (!patientsSnapshot.empty) {
          const patientDoc = patientsSnapshot.docs[0];
          const primaryPatientData = {
            id: patientDoc.id,
            ...patientDoc.data(),
          };
          setPatientData(primaryPatientData);

          // Load family members
          const familyMembers = await getFamilyMembersByPrimaryPatientId(
            patientDoc.id
          );

          // Initialize patient store
          initializePatientData(primaryPatientData, familyMembers);
        }
      } catch (error) {
        console.error("Error loading patient data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPatientData();
  }, [currentUser, isHydrated, initializePatientData]);

  const handleLogout = async () => {
    try {
      clearPatientData(); // Clear patient store
      await logout();
      router.push("/paciente/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="fixed inset-0 bg-gray-600/75"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              className="relative flex w-full max-w-xs flex-1 flex-col bg-white"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.8,
              }}
            >
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <motion.button
                  type="button"
                  className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ delay: 0.2, duration: 0.2 }}
                >
                  <XMarkIcon className="h-6 w-6 text-white" />
                </motion.button>
              </div>
              <SidebarContent
                isCollapsed={false}
                toggleSidebar={toggleSidebar}
                patientData={patientData}
                handleLogout={handleLogout}
                router={router}
                isMobile={true}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <div className="flex flex-1 justify-between px-4 sm:px-6 py-1">
              <div className="flex flex-1 flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h1 className="text-lg font-semibold text-gray-900">
                      Pacientes
                    </h1>
                    {/* Patient Selector */}
                    <PatientSelector />
                  </div>
                </div>
                {/* Breadcrumbs */}
                <Breadcrumbs breadcrumbs={generateBreadcrumbs()} />
              </div>

              {/* Active Patient Context Info */}
              {activePatient && !activePatient.isPrimary && (
                <div className="hidden md:flex items-center px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                  <UserIcon className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-700">
                    Viendo como: {getActivePatientDisplayName()}
                  </span>
                </div>
              )}
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
  isMobile = false,
}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: isMobile ? 0.2 : 0,
      },
    },
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  return (
    <div
      className={`flex flex-col min-h-screen h-full bg-gradient-to-b from-amber-50 to-yellow-50 border-r border-amber-100 transition-all duration-300 ${
        isCollapsed ? "w-16" : "lg:w-64"
      }`}
    >
      {/* Logo and toggle */}
      <motion.div
        className="flex items-center justify-between px-4 py-4 border-b border-amber-200"
        initial={isMobile ? { y: -20, opacity: 0 } : false}
        animate={isMobile ? { y: 0, opacity: 1 } : {}}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
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
      </motion.div>

      {/* Navigation */}
      <motion.nav
        className="flex-1 px-2 py-4 space-y-2"
        variants={containerVariants}
        initial={isMobile ? "hidden" : false}
        animate={isMobile ? "visible" : {}}
      >
        {menuItems.map((item, index) => {
          const isActive = router.pathname === item.href;
          return (
            <motion.div key={item.name} variants={itemVariants}>
              <Link
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
            </motion.div>
          );
        })}
      </motion.nav>

      {/* User section */}
      {!isCollapsed && patientData && (
        <motion.div
          className="border-t border-amber-200 p-4"
          initial={isMobile ? { y: 20, opacity: 0 } : false}
          animate={isMobile ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: isMobile ? 0.4 : 0, duration: 0.3 }}
        >
          <motion.div
            className="flex items-center space-x-3 mb-3"
            initial={isMobile ? { scale: 0.9, opacity: 0 } : false}
            animate={isMobile ? { scale: 1, opacity: 1 } : {}}
            transition={{ delay: isMobile ? 0.5 : 0, duration: 0.2 }}
          >
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
          </motion.div>

          <motion.div
            className="space-y-1"
            initial={isMobile ? { x: -20, opacity: 0 } : false}
            animate={isMobile ? { x: 0, opacity: 1 } : {}}
            transition={{ delay: isMobile ? 0.6 : 0, duration: 0.3 }}
          >
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </button>
          </motion.div>
        </motion.div>
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

function Breadcrumbs({ breadcrumbs }) {
  return (
    <nav className="flex mt-2.5" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.name} className="flex items-center">
            {index > 0 && (
              <ChevronRightSmallIcon className="h-4 w-4 text-gray-400 mx-2" />
            )}
            {breadcrumb.href ? (
              <Link
                href={breadcrumb.href}
                className="text-sm text-amber-600 hover:text-amber-800 transition-colors duration-200"
              >
                {breadcrumb.name}
              </Link>
            ) : (
              <span className="text-sm text-gray-500 font-medium">
                {breadcrumb.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
