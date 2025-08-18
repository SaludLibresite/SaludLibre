import { useState } from "react";
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function AddPatientChoiceModal({ isOpen, onClose, onChoice }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500/50 backdrop-blur-lg transition-opacity -z-1" />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-4 border-b border-amber-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <UserPlusIcon className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Agregar Paciente
                  </h3>
                  <p className="text-sm text-gray-600">
                    ¿Cómo desea agregar al paciente?
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="space-y-4">
              {/* New Patient Option */}
              <button
                onClick={() => {
                  onChoice("new");
                  onClose();
                }}
                className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
              >
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <UserPlusIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Crear Nuevo Paciente
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      El paciente no está registrado en la plataforma. Crear una nueva cuenta
                      con datos completos.
                    </p>
                    <div className="text-xs text-blue-600 font-medium">
                      • Se creará cuenta de usuario con email y contraseña temporal
                      <br />
                      • Se enviará email de bienvenida con credenciales
                      <br />
                      • Acceso completo al portal de pacientes
                    </div>
                  </div>
                </div>
              </button>

              {/* Existing Patient Option */}
              <button
                onClick={() => {
                  onChoice("existing");
                  onClose();
                }}
                className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-200 text-left group"
              >
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <MagnifyingGlassIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Buscar Paciente Existente
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      El paciente ya está registrado por otro doctor. Buscar y asignar
                      acceso compartido.
                    </p>
                    <div className="text-xs text-green-600 font-medium">
                      • Búsqueda por nombre, email, teléfono o ID
                      <br />
                      • Mantiene historial médico completo
                      <br />
                      • Acceso compartido entre múltiples doctores
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-t border-blue-100 px-6 py-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="h-5 w-5 text-blue-500">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">💡 Consejo:</p>
                <p>
                  Si no está seguro, intente primero buscar el paciente. Esto evita
                  duplicados y mantiene un historial médico unificado.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
