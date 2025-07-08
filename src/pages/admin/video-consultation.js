import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import ProtectedRoute from "../../components/ProtectedRoute";
import {
  VideoCameraIcon,
  PhoneIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentIcon,
  Cog6ToothIcon,
  SignalIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowsPointingOutIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

// Skeleton component for loading states
const Skeleton = ({ className, children }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`}>
    {children}
  </div>
);

// Coming Soon Badge Component
const ComingSoonBadge = () => (
  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform rotate-12 z-10">
    PRÓXIMAMENTE
  </div>
);

// Video Call Interface Skeleton
const VideoCallSkeleton = () => (
  <div className="relative bg-gray-900 rounded-xl overflow-hidden h-96">
    <ComingSoonBadge />

    {/* Main video area */}
    <div className="h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-32 h-32 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
          <VideoCameraIcon className="h-16 w-16 text-gray-500" />
        </div>
        <Skeleton className="h-4 w-32 mx-auto mb-2" />
        <Skeleton className="h-3 w-24 mx-auto" />
      </div>
    </div>

    {/* Picture-in-picture for doctor */}
    <div className="absolute top-4 right-4 w-32 h-24 bg-gray-700 rounded-lg border-2 border-white shadow-lg">
      <div className="h-full flex items-center justify-center">
        <UserGroupIcon className="h-8 w-8 text-gray-500" />
      </div>
    </div>

    {/* Control bar */}
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-6 py-3">
      <div className="flex items-center space-x-4">
        <button className="p-3 bg-gray-600 rounded-full hover:bg-gray-500 transition-colors">
          <MicrophoneIcon className="h-5 w-5 text-white" />
        </button>
        <button className="p-3 bg-gray-600 rounded-full hover:bg-gray-500 transition-colors">
          <VideoCameraIcon className="h-5 w-5 text-white" />
        </button>
        <button className="p-3 bg-red-600 rounded-full hover:bg-red-500 transition-colors">
          <PhoneIcon className="h-5 w-5 text-white" />
        </button>
        <button className="p-3 bg-gray-600 rounded-full hover:bg-gray-500 transition-colors">
          <SpeakerWaveIcon className="h-5 w-5 text-white" />
        </button>
        <button className="p-3 bg-gray-600 rounded-full hover:bg-gray-500 transition-colors">
          <ArrowsPointingOutIcon className="h-5 w-5 text-white" />
        </button>
      </div>
    </div>

    {/* Connection status */}
    <div className="absolute top-4 left-4 flex items-center space-x-2 bg-green-500/20 backdrop-blur-sm rounded-full px-3 py-1">
      <SignalIcon className="h-4 w-4 text-green-400" />
      <span className="text-green-400 text-sm font-medium">Conectado</span>
    </div>
  </div>
);

// Scheduled Consultations Skeleton
const ScheduledConsultationsSkeleton = () => (
  <div className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <ComingSoonBadge />

    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
        <CalendarIcon className="h-5 w-5 mr-2 text-blue-500" />
        Video Consultas Programadas
      </h3>
      <Skeleton className="h-8 w-24" />
    </div>

    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-4 w-4 text-gray-400" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-20" />
            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <VideoCameraIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Patient Queue Skeleton
const PatientQueueSkeleton = () => (
  <div className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <ComingSoonBadge />

    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
        <UserGroupIcon className="h-5 w-5 mr-2 text-purple-500" />
        Cola de Espera
      </h3>
      <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
        3 pacientes
      </span>
    </div>

    <div className="space-y-3">
      {[1, 2, 3].map((item, index) => (
        <div
          key={item}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
              {index + 1}
            </div>
            <div>
              <Skeleton className="h-4 w-28 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Esperando...</span>
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Chat Sidebar Skeleton
const ChatSidebarSkeleton = () => (
  <div className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-96">
    <ComingSoonBadge />

    <div className="flex items-center justify-between mb-4">
      <h4 className="font-medium text-gray-900 flex items-center">
        <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2 text-green-500" />
        Chat en Vivo
      </h4>
    </div>

    <div className="space-y-3 mb-4 flex-1 overflow-hidden">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="flex space-x-2">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-3 w-16 mb-1" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>

    <div className="border-t pt-4">
      <div className="flex space-x-2">
        <Skeleton className="flex-1 h-10 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  </div>
);

// Recording Management Skeleton
const RecordingManagementSkeleton = () => (
  <div className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <ComingSoonBadge />

    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
        <DocumentIcon className="h-5 w-5 mr-2 text-red-500" />
        Grabaciones
      </h3>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">Auto-grabación:</span>
        <div className="w-10 h-6 bg-gray-200 rounded-full p-1">
          <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
        </div>
      </div>
    </div>

    <div className="space-y-4">
      {[1, 2].map((item) => (
        <div
          key={item}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <PlayIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <Skeleton className="h-4 w-40 mb-2" />
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <PlayIcon className="h-4 w-4" />
            </button>
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Settings Panel Skeleton
const SettingsPanelSkeleton = () => (
  <div className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <ComingSoonBadge />

    <div className="flex items-center mb-6">
      <Cog6ToothIcon className="h-5 w-5 mr-2 text-gray-500" />
      <h3 className="text-lg font-semibold text-gray-900">
        Configuración de Video
      </h3>
    </div>

    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Calidad de Video
        </label>
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Micrófono
        </label>
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cámara
        </label>
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Notificaciones de llamada
          </span>
          <div className="w-10 h-6 bg-gray-200 rounded-full p-1">
            <div className="w-4 h-4 bg-blue-500 rounded-full shadow-sm"></div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Grabación automática
        </span>
        <div className="w-10 h-6 bg-gray-200 rounded-full p-1">
          <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
        </div>
      </div>
    </div>
  </div>
);

export default function VideoConsultationPage() {
  const [activeTab, setActiveTab] = useState("live");

  const tabs = [
    { id: "live", name: "En Vivo", icon: VideoCameraIcon },
    { id: "scheduled", name: "Programadas", icon: CalendarIcon },
    { id: "recordings", name: "Grabaciones", icon: DocumentIcon },
    { id: "settings", name: "Configuración", icon: Cog6ToothIcon },
  ];

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <VideoCameraIcon className="h-7 w-7 mr-3 text-blue-600" />
                  Video Consultas
                </h1>
                <p className="text-gray-600 mt-1">
                  Gestiona tus consultas médicas virtuales
                </p>
              </div>

              {/* Coming Soon Banner */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl px-6 py-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-blue-700 font-medium">
                    Funcionalidad en desarrollo
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <nav className="flex space-x-1 bg-gray-100 rounded-xl p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === "live" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Video Area */}
              <div className="lg:col-span-2 space-y-6">
                <VideoCallSkeleton />
                <PatientQueueSkeleton />
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <ChatSidebarSkeleton />

                {/* Quick Actions */}
                <div className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <ComingSoonBadge />
                  <h4 className="font-medium text-gray-900 mb-4">
                    Acciones Rápidas
                  </h4>
                  <div className="space-y-2">
                    <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                      <VideoCameraIcon className="h-4 w-4 mr-2" />
                      Iniciar Consulta
                    </button>
                    <button className="w-full flex items-center justify-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Programar Cita
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "scheduled" && (
            <div className="space-y-6">
              <ScheduledConsultationsSkeleton />

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: "Consultas Hoy",
                    value: "8",
                    icon: CalendarIcon,
                    color: "blue",
                  },
                  {
                    title: "Tiempo Promedio",
                    value: "25 min",
                    icon: ClockIcon,
                    color: "green",
                  },
                  {
                    title: "Pacientes Atendidos",
                    value: "156",
                    icon: UserGroupIcon,
                    color: "purple",
                  },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                  >
                    <ComingSoonBadge />
                    <div className="flex items-center">
                      <div
                        className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}
                      >
                        <stat.icon
                          className={`h-6 w-6 text-${stat.color}-600`}
                        />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stat.value}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "recordings" && (
            <div className="space-y-6">
              <RecordingManagementSkeleton />

              {/* Storage Info */}
              <div className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <ComingSoonBadge />
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Almacenamiento
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Usado</span>
                      <span className="font-medium">2.4 GB de 10 GB</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: "24%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SettingsPanelSkeleton />

              {/* Audio/Video Test */}
              <div className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <ComingSoonBadge />
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Prueba de Audio/Video
                </h3>

                <div className="space-y-6">
                  {/* Camera Preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vista Previa de Cámara
                    </label>
                    <div className="w-full h-48 bg-gray-900 rounded-lg flex items-center justify-center">
                      <VideoCameraIcon className="h-16 w-16 text-gray-500" />
                    </div>
                  </div>

                  {/* Audio Test */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prueba de Micrófono
                    </label>
                    <div className="flex items-center space-x-4">
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        <MicrophoneIcon className="h-4 w-4 inline mr-2" />
                        Probar
                      </button>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full animate-pulse"
                          style={{ width: "60%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
