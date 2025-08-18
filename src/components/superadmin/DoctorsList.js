import { useRouter } from "next/router";
import ManualSubscriptionActivator from '../admin/ManualSubscriptionActivator';

const DoctorsList = ({ 
  doctors, 
  updating, 
  onVerifyDoctor, 
  onEditDoctor, 
  onDeleteDoctor, 
  onDoctorUpdated 
}) => {
  const router = useRouter();

  if (doctors.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No hay doctores para mostrar
        </h3>
        <p className="text-gray-600">
          Los doctores aparecerán aquí cuando se registren en la plataforma.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Doctor
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Especialidad
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Documentos
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {doctors.map((doctor) => (
              <tr key={doctor.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-6">
                  <div className="flex items-center">
                    <div className="relative">
                      {(doctor.photoURL || doctor.imagen) ? (
                        <img
                          className="h-16 w-16 rounded-xl object-cover ring-2 ring-white shadow-lg"
                          src={doctor.photoURL || doctor.imagen}
                          alt={doctor.nombre || "Doctor"}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`h-16 w-16 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-2 ring-white ${
                          (doctor.photoURL || doctor.imagen) ? 'hidden' : 'flex'
                        }`}
                      >
                        C
                      </div>
                      <div
                        className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white ${
                          doctor.verified
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                      ></div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="text-sm font-semibold text-gray-900">
                        {doctor.nombre}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {doctor.ubicacion ? (
                          <div className="relative group">
                            <p 
                              className="max-w-44 truncate cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => {
                                const address = encodeURIComponent(doctor.ubicacion);
                                window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
                              }}
                              title="Click para abrir en Google Maps"
                            >
                              📍 {doctor.ubicacion}
                            </p>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                              {doctor.ubicacion}
                              <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-400 italic">No especificada</p>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <svg
                        className="w-3 h-3 mr-2 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                        />
                      </svg>
                      {doctor.dni || "No especificado"}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <span className="inline-flex truncate items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    {doctor.especialidad}
                  </span>
                </td>
                <td className="px-6 py-6">
                  <span
                    className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full border ${
                      doctor.verified
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-amber-100 text-amber-800 border-amber-200"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${
                        doctor.verified
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      }`}
                    ></div>
                    {doctor.verified ? "Verificado" : "Pendiente"}
                  </span>
                </td>
                <td className="px-6 py-6">
                  <div className="flex flex-col space-y-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        doctor.verified
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {doctor.verified ? "Verificado" : "Pendiente"}
                    </span>
                    {doctor.subscriptionStatus && (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          doctor.subscriptionStatus === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {doctor.subscriptionPlan || "Sin plan"}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex flex-wrap gap-1">
                    {doctor.tituloURL && (
                      <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        📜 Título
                      </span>
                    )}
                    {doctor.signatureURL && (
                      <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ✍️ Firma
                      </span>
                    )}
                    {doctor.stampURL && (
                      <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        🏥 Sello
                      </span>
                    )}
                    {!doctor.tituloURL &&
                      !doctor.signatureURL &&
                      !doctor.stampURL && (
                        <span className="text-gray-400 text-xs italic">
                          Sin documentos
                        </span>
                      )}
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex items-center space-x-2">
                    {doctor.verified ? (
                      <button
                        onClick={() => onVerifyDoctor(doctor.id, false)}
                        disabled={updating[doctor.id]}
                        className="inline-flex items-center px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50 border border-red-200"
                      >
                        {updating[doctor.id] ? "..." : "Revocar"}
                      </button>
                    ) : (
                      <button
                        onClick={() => onVerifyDoctor(doctor.id, true)}
                        disabled={updating[doctor.id]}
                        className="inline-flex items-center px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50 border border-emerald-200"
                      >
                        {updating[doctor.id] ? "..." : "Verificar"}
                      </button>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1">
                      {/* Edit Doctor */}
                      <button
                        onClick={() => onEditDoctor(doctor)}
                        disabled={updating[doctor.id]}
                        className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Editar Perfil"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* View Public Profile */}
                      <button
                        onClick={() => router.push(`/doctores/${doctor.slug}`)}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200"
                        title="Ver Perfil Público"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>

                      {/* Manual Subscription Activation */}
                      <div className="relative">
                        <ManualSubscriptionActivator
                          userId={doctor.id}
                          userEmail={doctor.email}
                          onActivated={onDoctorUpdated}
                        />
                      </div>

                      {/* Delete Doctor */}
                      <button
                        onClick={() => onDeleteDoctor(doctor.id)}
                        disabled={updating[doctor.id]}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Eliminar Doctor"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorsList;
