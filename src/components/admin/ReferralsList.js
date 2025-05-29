import { useState } from "react";
import { referrals } from "../../data/adminData";
import {
  PlusIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

export default function ReferralsList() {
  const [filter, setFilter] = useState("all");

  const filteredReferrals = referrals.filter((referral) => {
    if (filter === "all") return true;
    return referral.status === filter;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "pending":
        return <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />;
      case "scheduled":
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "completada";
      case "pending":
        return "pendiente";
      case "scheduled":
        return "programada";
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Referencias de Pacientes
          </h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700">
            <PlusIcon className="h-4 w-4" />
            <span>Nueva Referencia</span>
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 flex space-x-4">
          {[
            { key: "all", label: "Todas las Referencias" },
            { key: "pending", label: "Pendientes" },
            { key: "scheduled", label: "Programadas" },
            { key: "completed", label: "Completadas" },
          ].map((status) => (
            <button
              key={status.key}
              onClick={() => setFilter(status.key)}
              className={`px-3 py-1 text-sm rounded-lg ${
                filter === status.key
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Referrals List */}
      <div className="divide-y divide-gray-200">
        {filteredReferrals.map((referral) => (
          <div key={referral.id} className="p-6 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-gray-600" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {referral.patientName}
                    </h4>
                    {getStatusIcon(referral.status)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Referido a:{" "}
                    <span className="font-medium">{referral.referredTo}</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Motivo: {referral.reason}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">{referral.date}</p>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      referral.status
                    )}`}
                  >
                    {getStatusText(referral.status)}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-700 text-sm">
                    Ver
                  </button>
                  <button className="text-green-600 hover:text-green-700 text-sm">
                    Editar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredReferrals.length === 0 && (
        <div className="p-12 text-center">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No se encontraron referencias
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === "all"
              ? "Comience creando una nueva referencia."
              : `No hay referencias ${
                  filter === "pending"
                    ? "pendientes"
                    : filter === "scheduled"
                    ? "programadas"
                    : "completadas"
                } en este momento.`}
          </p>
          <div className="mt-6">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Crear Nueva Referencia
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      {filteredReferrals.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {referrals.filter((r) => r.status === "pending").length}
              </p>
              <p className="text-sm text-gray-600">Pendientes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {referrals.filter((r) => r.status === "scheduled").length}
              </p>
              <p className="text-sm text-gray-600">Programadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {referrals.filter((r) => r.status === "completed").length}
              </p>
              <p className="text-sm text-gray-600">Completadas</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
