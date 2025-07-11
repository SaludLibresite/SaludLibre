import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { query, collection, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import PatientLayout from "../../components/paciente/PatientLayout";
import ProtectedPatientRoute from "../../components/paciente/ProtectedPatientRoute";
import {
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
  DocumentArrowUpIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { getPrescriptionsByPatientId } from "../../lib/prescriptionsService";
import { getMedicalFilesByPatientId } from "../../lib/medicalRecordsService";

export default function MedicalRecords() {
  const { currentUser } = useAuth();
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("records");
  const [message, setMessage] = useState("");

  // Datos del historial médico
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicalFiles, setMedicalFiles] = useState([]);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    if (currentUser) {
      loadPatientData();
    }
  }, [currentUser]);

  const loadPatientData = async () => {
    try {
      setLoading(true);

      const patientsQuery = query(
        collection(db, "patients"),
        where("userId", "==", currentUser.uid)
      );
      const patientsSnapshot = await getDocs(patientsQuery);

      if (!patientsSnapshot.empty) {
        const patientDoc = patientsSnapshot.docs[0];
        const patient = { id: patientDoc.id, ...patientDoc.data() };
        setPatientData(patient);

        // Cargar datos médicos
        await loadMedicalData(patient.id);
      }
    } catch (error) {
      console.error("Error loading patient data:", error);
      setMessage("Error al cargar los datos médicos");
    } finally {
      setLoading(false);
    }
  };

  const loadMedicalData = async (patientId) => {
    try {
      // Cargar citas completadas
      const appointmentsQuery = query(
        collection(db, "appointments"),
        where("patientId", "==", patientId),
        where("status", "==", "completed"),
        orderBy("date", "desc")
      );
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      const appointmentsList = [];
      appointmentsSnapshot.forEach((doc) => {
        appointmentsList.push({ id: doc.id, ...doc.data() });
      });
      setAppointments(appointmentsList);

      // Cargar recetas
      const prescriptionsList = await getPrescriptionsByPatientId(patientId);
      setPrescriptions(prescriptionsList);

      // Cargar archivos médicos
      const filesList = await getMedicalFilesByPatientId(patientId);
      setMedicalFiles(filesList);

      // Crear registros médicos combinados
      const records = [];

      // Agregar citas como registros
      appointmentsList.forEach((appointment) => {
        records.push({
          id: `appointment-${appointment.id}`,
          type: "appointment",
          date: appointment.date,
          time: appointment.time,
          title: `Consulta con ${appointment.doctorName}`,
          description: appointment.reason || "Consulta médica",
          notes: appointment.notes,
          doctorName: appointment.doctorName,
          doctorSpecialty: appointment.doctorSpecialty,
          createdAt: appointment.completedAt || appointment.createdAt,
        });
      });

      // Agregar recetas como registros
      prescriptionsList.forEach((prescription) => {
        records.push({
          id: `prescription-${prescription.id}`,
          type: "prescription",
          date: prescription.createdAt?.toDate
            ? prescription.createdAt.toDate()
            : new Date(prescription.createdAt),
          title: "Receta Médica",
          description: `${
            prescription.medications?.length || 0
          } medicamento(s) recetado(s)`,
          medications: prescription.medications,
          notes: prescription.notes,
          doctorName: prescription.doctorInfo?.nombre,
          prescriptionId: prescription.id,
          createdAt: prescription.createdAt?.toDate
            ? prescription.createdAt.toDate()
            : new Date(prescription.createdAt),
        });
      });

      // Ordenar registros por fecha
      records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setMedicalRecords(records);
    } catch (error) {
      console.error("Error loading medical data:", error);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Fecha no disponible";
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes("pdf")) return "📄";
    if (fileType?.includes("image")) return "🖼️";
    if (fileType?.includes("word")) return "📝";
    return "📄";
  };

  const downloadPrescription = async (prescriptionId) => {
    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `receta-${prescriptionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error("Error al generar PDF");
      }
    } catch (error) {
      console.error("Error downloading prescription:", error);
      setMessage("Error al descargar la receta");
    }
  };

  if (loading) {
    return (
      <ProtectedPatientRoute>
        <PatientLayout>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando historial médico...</p>
            </div>
          </div>
        </PatientLayout>
      </ProtectedPatientRoute>
    );
  }

  if (!patientData) {
    return (
      <ProtectedPatientRoute>
        <PatientLayout>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                No se encontraron datos del paciente
              </h1>
              <p className="text-gray-600">
                No se pudo cargar tu información médica.
              </p>
            </div>
          </div>
        </PatientLayout>
      </ProtectedPatientRoute>
    );
  }

  return (
    <ProtectedPatientRoute>
      <PatientLayout>
        <div className="p-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center mr-4">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Historial Médico
                  </h1>
                  <p className="text-gray-600">
                    Accede a todos tus registros médicos y archivos
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total de registros</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {medicalRecords.length}
                  </p>
                </div>
              </div>
            </div>

            {message && (
              <div
                className={`mt-4 p-3 rounded-lg ${
                  message.includes("Error")
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : "bg-green-100 text-green-700 border border-green-200"
                }`}
              >
                {message}
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {appointments.length}
                  </p>
                  <p className="text-sm text-gray-600">Consultas</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {prescriptions.length}
                  </p>
                  <p className="text-sm text-gray-600">Recetas</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <DocumentArrowUpIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {medicalFiles.length}
                  </p>
                  <p className="text-sm text-gray-600">Archivos</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <BeakerIcon className="h-6 w-6 text-amber-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {medicalFiles.filter((f) => f.category === "lab").length}
                  </p>
                  <p className="text-sm text-gray-600">Estudios</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab("records")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "records"
                      ? "border-amber-500 text-amber-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    Historial Completo ({medicalRecords.length})
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("prescriptions")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "prescriptions"
                      ? "border-amber-500 text-amber-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                    Recetas ({prescriptions.length})
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("files")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "files"
                      ? "border-amber-500 text-amber-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                    Archivos ({medicalFiles.length})
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("lab")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "lab"
                      ? "border-amber-500 text-amber-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    <BeakerIcon className="h-5 w-5 mr-2" />
                    Estudios (
                    {medicalFiles.filter((f) => f.category === "lab").length})
                  </div>
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "records" && (
                <div>
                  {medicalRecords.length === 0 ? (
                    <div className="text-center py-12">
                      <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No hay registros médicos
                      </h3>
                      <p className="text-gray-600">
                        Los registros de tus consultas aparecerán aquí.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {medicalRecords.map((record) => (
                        <div
                          key={record.id}
                          className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                {record.type === "appointment" && (
                                  <CalendarIcon className="h-5 w-5 text-blue-500 mr-2" />
                                )}
                                {record.type === "prescription" && (
                                  <ClipboardDocumentListIcon className="h-5 w-5 text-green-500 mr-2" />
                                )}
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {record.title}
                                </h3>
                                <span
                                  className={`ml-3 px-2 py-1 text-xs rounded-full ${
                                    record.type === "appointment"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {record.type === "appointment"
                                    ? "Consulta"
                                    : "Receta"}
                                </span>
                              </div>

                              <p className="text-gray-600 mb-2">
                                {record.description}
                              </p>

                              <div className="flex items-center text-sm text-gray-500 space-x-4">
                                <span className="flex items-center">
                                  <ClockIcon className="h-4 w-4 mr-1" />
                                  {formatDate(record.createdAt)}
                                  {record.time && ` a las ${record.time}`}
                                </span>
                                {record.doctorName && (
                                  <span className="flex items-center">
                                    <UserIcon className="h-4 w-4 mr-1" />
                                    {record.doctorName}
                                  </span>
                                )}
                              </div>

                              {record.notes && (
                                <div className="mt-3 p-3 bg-white rounded border">
                                  <p className="text-sm text-gray-700">
                                    <strong>Notas:</strong> {record.notes}
                                  </p>
                                </div>
                              )}

                              {record.medications &&
                                record.medications.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-sm font-medium text-gray-900 mb-2">
                                      Medicamentos:
                                    </p>
                                    <div className="space-y-1">
                                      {record.medications.map((med, index) => (
                                        <div
                                          key={index}
                                          className="text-sm text-gray-700 bg-white p-2 rounded border"
                                        >
                                          <strong>{med.name}</strong> -{" "}
                                          {med.dosage} - {med.frequency}
                                          {med.instructions && (
                                            <p className="text-gray-600 text-xs mt-1">
                                              {med.instructions}
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                            </div>

                            {record.type === "prescription" && (
                              <div className="ml-4">
                                <button
                                  onClick={() =>
                                    downloadPrescription(record.prescriptionId)
                                  }
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-amber-600 bg-amber-100 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                                >
                                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                                  Descargar PDF
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "prescriptions" && (
                <div>
                  {prescriptions.length === 0 ? (
                    <div className="text-center py-12">
                      <ClipboardDocumentListIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No hay recetas disponibles
                      </h3>
                      <p className="text-gray-600">
                        Las recetas médicas aparecerán aquí cuando tu doctor las
                        genere.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {prescriptions.map((prescription) => (
                        <div
                          key={prescription.id}
                          className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Receta Médica
                            </h3>
                            <button
                              onClick={() =>
                                downloadPrescription(prescription.id)
                              }
                              className="text-amber-600 hover:text-amber-700"
                            >
                              <ArrowDownTrayIcon className="h-5 w-5" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-gray-500">Fecha</p>
                              <p className="font-medium">
                                {formatDate(prescription.createdAt)}
                              </p>
                            </div>

                            {prescription.doctorInfo?.nombre && (
                              <div>
                                <p className="text-sm text-gray-500">Doctor</p>
                                <p className="font-medium">
                                  {prescription.doctorInfo.nombre}
                                </p>
                              </div>
                            )}

                            <div>
                              <p className="text-sm text-gray-500">
                                Medicamentos
                              </p>
                              <div className="space-y-1">
                                {prescription.medications?.map((med, index) => (
                                  <p
                                    key={index}
                                    className="text-sm font-medium"
                                  >
                                    {med.name} - {med.dosage}
                                  </p>
                                ))}
                              </div>
                            </div>

                            {prescription.notes && (
                              <div>
                                <p className="text-sm text-gray-500">Notas</p>
                                <p className="text-sm">{prescription.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "files" && (
                <div>
                  {medicalFiles.length === 0 ? (
                    <div className="text-center py-12">
                      <DocumentArrowUpIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No hay archivos subidos
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Sube tus estudios, recetas y documentos médicos.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {medicalFiles.map((file) => (
                        <div
                          key={file.id}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                        >
                          <div className="flex items-center space-x-3 mb-3">
                            <span className="text-2xl">
                              {getFileIcon(file.fileType)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {file.title || file.fileName}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.fileSize)}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs text-gray-500">
                              Subido: {formatDate(file.uploadedAt)}
                            </p>

                            <a
                              href={file.downloadURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-xs text-amber-600 hover:text-amber-700"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                              Descargar
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "lab" && (
                <div>
                  {medicalFiles.filter((f) => f.category === "lab").length ===
                  0 ? (
                    <div className="text-center py-12">
                      <BeakerIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No hay estudios disponibles
                      </h3>
                      <p className="text-gray-600">
                        Los resultados de tus estudios de laboratorio aparecerán
                        aquí.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {medicalFiles
                        .filter((f) => f.category === "lab")
                        .map((file) => (
                          <div
                            key={file.id}
                            className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <BeakerIcon className="h-8 w-8 text-amber-600" />
                                <div>
                                  <h4 className="text-lg font-medium text-gray-900">
                                    {file.title || file.fileName}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    {formatDate(file.uploadedAt)} •{" "}
                                    {formatFileSize(file.fileSize)}
                                  </p>
                                </div>
                              </div>

                              <a
                                href={file.downloadURL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700"
                              >
                                <EyeIcon className="h-4 w-4 mr-2" />
                                Ver Resultado
                              </a>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Information Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">
                  Información sobre tus datos médicos
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="space-y-1">
                    <li>
                      • Todos tus datos médicos están encriptados y son
                      confidenciales
                    </li>
                    <li>
                      • Puedes descargar tus recetas y documentos en cualquier
                      momento
                    </li>
                    <li>
                      • Solo tú y tu médico pueden acceder a esta información
                    </li>
                    <li>
                      • Los datos se actualizan automáticamente después de cada
                      consulta
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PatientLayout>
    </ProtectedPatientRoute>
  );
}
