import { useState } from "react";
import { appointmentDetail } from "../../data/adminData";
import {
  CalendarIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PencilIcon,
  DocumentIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export default function AppointmentDetail({ appointmentId }) {
  const [activeTab, setActiveTab] = useState("Notas");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const data = appointmentDetail; // In real app, fetch by appointmentId

  const tabs = [
    "Notas",
    "Historial Médico",
    "Recetas",
    "Resultados de Laboratorio",
    "Seguimiento",
  ];

  const handleCompleteVisit = () => {
    // Handle complete visit logic
    console.log("Visit completed");
  };

  const handleReschedule = () => {
    // Handle reschedule logic
    console.log("Reschedule appointment");
  };

  const handleCall = () => {
    // Handle call logic
    console.log("Calling patient");
  };

  const handleWhatsApp = () => {
    // Handle WhatsApp logic
    console.log("Opening WhatsApp");
  };

  const handleCancel = () => {
    // Handle cancel logic
    console.log("Cancel appointment");
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-lg font-medium text-gray-700">
                {data.patient.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {data.patient.name}
              </h2>
              <p className="text-sm text-gray-500">
                {data.appointment.date} • {data.appointment.time}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleReschedule}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <CalendarIcon className="h-4 w-4" />
              <span>Reprogramar</span>
            </button>
            <button
              onClick={handleCall}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <PhoneIcon className="h-4 w-4" />
              <span>Llamar</span>
            </button>
            <button
              onClick={handleWhatsApp}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <XMarkIcon className="h-4 w-4" />
              <span>Cancelar</span>
            </button>
            <button
              onClick={handleCompleteVisit}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Completar Visita
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "Notas" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Notas Clínicas
              </h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Editar</span>
              </button>
            </div>

            {isEditing ? (
              <div>
                <textarea
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Ingrese notas clínicas..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">
                  {clinicalNotes ||
                    "No hay notas clínicas aún. Haga clic en Editar para agregar notas."}
                </p>
              </div>
            )}

            {/* Documents Section */}
            <div className="mt-8">
              <h4 className="text-md font-medium text-gray-900 mb-4">
                Documentos
              </h4>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Arrastre y suelte archivos aquí o
                </p>
                <button className="mt-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                  Examinar Archivos
                </button>
              </div>

              {data.documents.length > 0 && (
                <div className="mt-4">
                  {data.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <DocumentIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {doc.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-700 text-sm">
                          Descargar
                        </button>
                        <button className="text-red-600 hover:text-red-700 text-sm">
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Historial Médico" && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Historial Médico
            </h3>
            <div className="space-y-4">
              {data.medicalHistory.map((entry, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      {entry.diagnosis}
                    </h4>
                    <span className="text-sm text-gray-500">{entry.date}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Tratamiento: {entry.treatment}
                  </p>
                  <p className="text-sm text-gray-600">Notas: {entry.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Recetas" && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Recetas Actuales
            </h3>
            <div className="space-y-4">
              {data.prescriptions.map((prescription, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      {prescription.medication}
                    </h4>
                    <span className="text-sm text-gray-500">
                      Repeticiones: {prescription.refills}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {prescription.dosage} - {prescription.frequency}
                  </p>
                  <p className="text-sm text-gray-500">
                    Iniciado: {prescription.startDate}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Resultados de Laboratorio" && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Resultados de Laboratorio
            </h3>
            <div className="space-y-4">
              {data.labResults.map((result, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{result.test}</h4>
                    <span className="text-sm text-gray-500">{result.date}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Estado: {result.status}
                  </p>
                  <button className="mt-2 text-blue-600 hover:text-blue-700 text-sm">
                    Ver Reporte ({result.file})
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Seguimiento" && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Planificación de Seguimiento
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Próxima Cita
                </label>
                <div className="flex space-x-4">
                  <input
                    type="date"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Chequeo Regular</option>
                    <option>Seguimiento</option>
                    <option>Consulta</option>
                  </select>
                </div>
              </div>

              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Programar Seguimiento
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
