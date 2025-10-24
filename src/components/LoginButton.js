import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUserStore } from '../store/userStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCircleIcon, 
  ChevronDownIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon,
  UserIcon,
  HeartIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export function LoginButton({ isMobile = false }) {
  const { currentUser, logout } = useAuth();
  const { userType, userProfile, getDashboardUrl, loading } = useUserStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Show loading state while detecting user type
  if (loading) {
    return (
      <div className="flex items-center">
        <div className="animate-pulse flex items-center gap-2 bg-gray-200 px-4 py-2 rounded-full">
          <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
          <div className="w-16 h-4 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  // If user is logged in, show user menu with dropdown
  if (currentUser && userType) {
    const dashboardUrl = getDashboardUrl();
    const displayName = userProfile?.displayName || 
                       userProfile?.name || 
                       currentUser.displayName || 
                       currentUser.email;

    const getUserTypeInfo = () => {
      switch (userType) {
        case 'doctor':
          return {
            label: 'Doctor',
            icon: UserIcon,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200'
          };
        case 'patient':
          return {
            label: 'Paciente',
            icon: HeartIcon,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
          };
        case 'superadmin':
          return {
            label: 'Administrador',
            icon: ShieldCheckIcon,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200'
          };
        default:
          return {
            label: 'Usuario',
            icon: UserIcon,
            color: 'text-gray-600',
            bgColor: 'bg-gray-50',
            borderColor: 'border-gray-200'
          };
      }
    };

    const userTypeInfo = getUserTypeInfo();
    const TypeIcon = userTypeInfo.icon;

    // Mobile version - expanded layout
    if (isMobile) {
      return (
        <div className="space-y-3">
          {/* User Info Card */}
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${userTypeInfo.borderColor} ${userTypeInfo.bgColor}`}>
            <div className={`w-10 h-10 rounded-full ${userTypeInfo.color} bg-white border-2 ${userTypeInfo.borderColor} flex items-center justify-center`}>
              <TypeIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate text-sm leading-tight">
                {displayName}
              </div>
              <div className={`text-xs ${userTypeInfo.color} font-medium`}>
                {userTypeInfo.label}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Link href={dashboardUrl}>
              <motion.div
                className="flex items-center gap-3 p-3 rounded-lg bg-blue-600 text-white cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Cog6ToothIcon className="w-5 h-5" />
                <span className="font-medium">Mi Panel</span>
              </motion.div>
            </Link>

            <motion.button
              onClick={logout}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span className="font-medium">Cerrar Sesión</span>
            </motion.button>
          </div>
        </div>
      );
    }

    // Desktop version - dropdown
    return (
      <div className="relative" ref={dropdownRef}>
        {/* User Button */}
        <motion.button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`flex items-center gap-3 px-4 py-2 rounded-full border ${userTypeInfo.borderColor} ${userTypeInfo.bgColor} hover:shadow-md transition-all duration-200`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Avatar */}
          <div className={`w-8 h-8 rounded-full ${userTypeInfo.color} bg-white border-2 ${userTypeInfo.borderColor} flex items-center justify-center`}>
            <TypeIcon className="w-4 h-4" />
          </div>

          {/* User Info - Desktop */}
          <div className="hidden lg:block text-left">
            <div className="text-sm font-medium text-gray-900 truncate max-w-24">
              {displayName}
            </div>
            <div className={`text-xs ${userTypeInfo.color} font-medium`}>
              {userTypeInfo.label}
            </div>
          </div>

          {/* Chevron */}
          <ChevronDownIcon 
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
              isDropdownOpen ? 'rotate-180' : ''
            }`} 
          />
        </motion.button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden"
            >
              {/* User Info Header */}
              <div className={`px-4 py-3 ${userTypeInfo.bgColor} border-b border-gray-100`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${userTypeInfo.color} bg-white border-2 ${userTypeInfo.borderColor} flex items-center justify-center`}>
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 truncate max-w-36">
                      {displayName}
                    </div>
                    <div className={`text-sm ${userTypeInfo.color} font-medium`}>
                      {userTypeInfo.label}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <Link href={dashboardUrl}>
                  <motion.div
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                    whileHover={{ x: 4 }}
                  >
                    <Cog6ToothIcon className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700 font-medium">Mi Panel</span>
                  </motion.div>
                </Link>

                <hr className="my-2 border-gray-100" />

                <motion.button
                  onClick={() => {
                    logout();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 cursor-pointer transition-colors text-left"
                  whileHover={{ x: 4 }}
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-500" />
                  <span className="text-red-600 font-medium">Cerrar Sesión</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // If user is not logged in, show elegant login options
  if (isMobile) {
    return (
      <div className="space-y-3">
        {/* Patient Login */}
        <Link href="/paciente/login">
          <motion.div
            className="flex items-center gap-3 p-4 text-green-600 bg-green-50 border border-green-200 rounded-xl cursor-pointer transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <HeartIcon className="w-5 h-5" />
            <span className="font-medium">Pacientes</span>
          </motion.div>
        </Link>

        {/* Doctor Login */}
        <Link href="/auth/login">
          <motion.div
            className="flex items-center gap-3 p-4 bg-blue-600 text-white rounded-xl cursor-pointer transition-all duration-200 shadow-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <UserIcon className="w-5 h-5" />
            <span className="font-medium">Doctores</span>
          </motion.div>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Patient Login */}
      <Link href="/paciente/login">
        <motion.div
          className="flex items-center gap-2 px-4 py-2 text-green-600 hover:text-white hover:bg-gradient-to-r hover:from-green-500 hover:to-emerald-500 border border-green-200 hover:border-green-300 rounded-lg transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md group transform hover:scale-[1.02]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="p-1 bg-green-100 rounded-md group-hover:bg-white/20 transition-colors duration-200">
            <HeartIcon className="w-3.5 h-3.5 text-green-600 group-hover:text-white transition-colors duration-200" />
          </div>
          <div className="flex flex-col">
            <span className="hidden sm:inline font-medium text-gray-900 group-hover:text-white transition-colors duration-200">Pacientes</span>
          </div>
        </motion.div>
      </Link>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300"></div>

      {/* Doctor Login */}
      <Link href="/auth/login">
        <motion.div
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg transform hover:scale-[1.02]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="p-1 bg-white/20 rounded-md">
            <UserIcon className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">Doctores</span>
          </div>
        </motion.div>
      </Link>
    </div>
  );
}
