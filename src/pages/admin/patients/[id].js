import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/admin/AdminLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeftIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  PencilIcon,
  PlusIcon,
  ClipboardDocumentListIcon,
  HeartIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  IdentificationIcon,
  ShieldCheckIcon,
  DocumentArrowUpIcon,
  BeakerIcon,
  EyeIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { getPatientById } from "@/lib/patientsService";
import { getAppointmentsByPatientId } from "@/lib/appointmentsService";
import { getDoctorByUserId } from "@/lib/doctorsService";
import { getPrescriptionsByPatientId } from "@/lib/prescriptionsService";
import {
  getMedicalFilesByPatientId,
  uploadMedicalFile,
  deleteMedicalFile,
} from "@/lib/medicalRecordsService";
import PatientAppointments from "@/components/admin/PatientAppointments";
import NewAppointmentModal from "@/components/admin/NewAppointmentModal";
import EditPatientModal from "@/components/admin/EditPatientModal";
import PrescriptionModal from "@/components/admin/PrescriptionModal";

export default function PatientDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser } = useAuth();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [message, setMessage] = useState("");
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  // Medical history states
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicalFiles, setMedicalFiles] = useState([]);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileTitle, setFileTitle] = useState("");
  const [fileCategory, setFileCategory] = useState("general");

  useEffect(() => {
    if (id && currentUser) {
      loadPatientData();
    }
  }, [id, currentUser]);

  const loadPatientData = async () => {
    try {
      setLoading(true);

      // Get doctor data first
      const doctor = await getDoctorByUserId(currentUser.uid);
      if (!doctor) {
        throw new Error("No se encontró el perfil del doctor");
      }
      setDoctorData(doctor);

      // Load patient data
      const patientData = await getPatientById(id);

      // Verify this patient belongs to the current doctor
      if (patientData.doctorId !== doctor.id) {
        throw new Error("No tienes permiso para ver este paciente");
      }

      setPatient(patientData);

      // Load patient appointments
      const patientAppointments = await getAppointmentsByPatientId(id);
      setAppointments(patientAppointments);

      // Load medical data
      await loadMedicalData(id);
    } catch (error) {
      console.error("Error loading patient data:", error);
      setMessage(error.message || "Error al cargar los datos del paciente");
    } finally {
      setLoading(false);
    }
  };

  const loadMedicalData = async (patientId) => {
    try {
      // Load completed appointments
      const allAppointments = await getAppointmentsByPatientId(patientId);
      const completed = allAppointments.filter(
        (apt) => apt.status === "completed"
      );
      setCompletedAppointments(completed);

      // Load prescriptions
      const prescriptionsList = await getPrescriptionsByPatientId(patientId);
      setPrescriptions(prescriptionsList);

      // Load medical files
      const filesList = await getMedicalFilesByPatientId(patientId);
      setMedicalFiles(filesList);

      // Create combined medical records
      const records = [];

      // Add completed appointments as records
      completed.forEach((appointment) => {
        records.push({
          id: `appointment-${appointment.id}`,
          type: "appointment",
          date: appointment.date,
          time: appointment.time,
          title: `Consulta ${appointment.doctorSpecialty || "Médica"}`,
          description: appointment.reason || "Consulta médica",
          notes: appointment.notes,
          doctorName: appointment.doctorName,
          doctorSpecialty: appointment.doctorSpecialty,
          createdAt: appointment.completedAt || appointment.createdAt,
        });
      });

      // Add prescriptions as records
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

      // Add medical files as records
      filesList.forEach((file) => {
        records.push({
          id: `file-${file.id}`,
          type: "file",
          date: file.uploadedAt?.toDate
            ? file.uploadedAt.toDate()
            : new Date(file.uploadedAt),
          title: file.title || file.fileName,
          description: `Archivo médico - ${file.category || "General"}`,
          fileType: file.fileType,
          downloadURL: file.downloadURL,
          fileSize: file.fileSize,
          category: file.category,
          fileId: file.id,
          filePath: file.filePath,
          createdAt: file.uploadedAt?.toDate
            ? file.uploadedAt.toDate()
            : new Date(file.uploadedAt),
        });
      });

      // Sort records by date
      records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setMedicalRecords(records);
    } catch (error) {
      console.error("Error loading medical data:", error);
    }
  };

  const refreshAppointments = async () => {
    try {
      const patientAppointments = await getAppointmentsByPatientId(id);
      setAppointments(patientAppointments);
      // Also refresh medical data to update the history
      await loadMedicalData(id);
    } catch (error) {
      console.error("Error refreshing appointments:", error);
    }
  };

  const refreshPatientData = async () => {
    try {
      const patientData = await getPatientById(id);
      setPatient(patientData);
    } catch (error) {
      console.error("Error refreshing patient data:", error);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !fileTitle.trim()) {
      setMessage("Por favor seleccione un archivo y proporcione un título");
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setMessage("El archivo no puede superar los 10MB");
      return;
    }

    try {
      setUploading(true);

      const metadata = {
        title: fileTitle.trim(),
        category: fileCategory,
        uploadedBy: currentUser.uid,
        uploadedByRole: "doctor",
      };

      await uploadMedicalFile(selectedFile, id, doctorData.id, metadata);

      // Reset form
      setSelectedFile(null);
      setFileTitle("");
      setFileCategory("general");
      setShowUploadModal(false);

      // Reload medical data
      await loadMedicalData(id);

      setMessage("Archivo subido exitosamente");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error uploading file:", error);
      setMessage("Error al subir el archivo");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId, filePath) => {
    if (!confirm("¿Está seguro de que desea eliminar este archivo?")) {
      return;
    }

    try {
      await deleteMedicalFile(fileId, filePath);
      await loadMedicalData(id);
      setMessage("Archivo eliminado exitosamente");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting file:", error);
      setMessage("Error al eliminar el archivo");
    }
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

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "N/A";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AdminLayout>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
              <p className="text-gray-600">
                Cargando información del paciente...
              </p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (message && !patient) {
    return (
      <ProtectedRoute>
        <AdminLayout>
          <div className="p-6">
            <div className="flex items-center mb-6">
              <button
                onClick={() => router.push("/admin/patients")}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Volver a Pacientes
              </button>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{message}</p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push("/admin/patients")}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Volver
              </button>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 flex items-center justify-center shadow-md mr-4">
                  <span className="text-lg font-medium text-white">
                    {patient?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "?"}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {patient?.name || "Paciente"}
                  </h1>
                  <p className="text-gray-600">
                    {patient?.patientId && `ID: ${patient.patientId} • `}
                    {patient?.age || calculateAge(patient?.dateOfBirth)} años
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowNewAppointmentModal(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <CalendarIcon className="h-4 w-4" />
                <span>Nueva Cita</span>
              </button>
              <button
                onClick={() => setShowPrescriptionModal(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <DocumentTextIcon className="h-4 w-4" />
                <span>Receta</span>
              </button>
              <button
                onClick={() => setShowEditPatientModal(true)}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Editar</span>
              </button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.includes("Error")
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-green-100 text-green-700 border border-green-200"
              }`}
            >
              {message}
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {[
                  { id: "info", name: "Información", icon: UserIcon },
                  { id: "appointments", name: "Citas", icon: CalendarIcon },
                  {
                    id: "medical",
                    name: "Historial Médico",
                    icon: ClipboardDocumentListIcon,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? "border-amber-500 text-amber-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "info" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Información Personal
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">Nombre</div>
                            <div className="font-medium">
                              {patient?.name || "N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">Email</div>
                            <div className="font-medium">
                              {patient?.email || "N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">
                              Teléfono
                            </div>
                            <div className="font-medium">
                              {patient?.phone || "N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">
                              Fecha de Nacimiento
                            </div>
                            <div className="font-medium">
                              {patient?.dateOfBirth
                                ? new Date(
                                    patient.dateOfBirth
                                  ).toLocaleDateString("es-ES")
                                : "N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">Género</div>
                            <div className="font-medium">
                              {patient?.gender || "N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">
                              Dirección
                            </div>
                            <div className="font-medium">
                              {patient?.address || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Contacto de Emergencia
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">Nombre</div>
                            <div className="font-medium">
                              {patient?.emergencyContact || "N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">
                              Teléfono
                            </div>
                            <div className="font-medium">
                              {patient?.emergencyPhone || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Medical & Insurance Information */}
                  <div className="space-y-6">
                    {/* Medical Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Información Médica
                      </h3>
                      <div className="space-y-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-500 mb-1">
                            Alergias
                          </div>
                          <div className="font-medium">
                            {patient?.allergies || "Ninguna registrada"}
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-500 mb-1">
                            Medicaciones Actuales
                          </div>
                          <div className="font-medium">
                            {patient?.currentMedications ||
                              "Ninguna registrada"}
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-500 mb-1">
                            Historial Médico
                          </div>
                          <div className="font-medium">
                            {patient?.medicalHistory &&
                            patient.medicalHistory.length > 0
                              ? patient.medicalHistory[0]?.notes || "Sin notas"
                              : "Sin historial registrado"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Insurance Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Información del Seguro
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <ShieldCheckIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">
                              Obra Social/Prepaga
                            </div>
                            <div className="font-medium">
                              {patient?.insuranceProvider || "N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <IdentificationIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">
                              Número de Afiliado
                            </div>
                            <div className="font-medium">
                              {patient?.insuranceNumber || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "appointments" && (
                <PatientAppointments
                  patient={patient}
                  appointments={appointments}
                  onRefresh={refreshAppointments}
                />
              )}

              {activeTab === "medical" && (
                <div>
                  {/* Medical Records Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Historial Médico Completo
                      </h3>
                      <p className="text-gray-600">
                        Historial de consultas, recetas y documentos médicos
                      </p>
                    </div>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <DocumentArrowUpIcon className="h-4 w-4" />
                      <span>Subir Documento</span>
                    </button>
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
                            {completedAppointments.length}
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
                            {
                              medicalFiles.filter((f) => f.category === "lab")
                                .length
                            }
                          </p>
                          <p className="text-sm text-gray-600">Estudios</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Medical Records Timeline */}
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Cronología Médica ({medicalRecords.length} registros)
                    </h4>

                    {medicalRecords.length === 0 ? (
                      <div className="text-center py-12">
                        <ClipboardDocumentListIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No hay registros médicos
                        </h3>
                        <p className="text-gray-600">
                          Los registros de consultas, recetas y documentos
                          aparecerán aquí.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {medicalRecords.map((record) => (
                          <div
                            key={record.id}
                            className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm"
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
                                  {record.type === "file" && (
                                    <DocumentArrowUpIcon className="h-5 w-5 text-purple-500 mr-2" />
                                  )}
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {record.title}
                                  </h3>
                                  <span
                                    className={`ml-3 px-2 py-1 text-xs rounded-full ${
                                      record.type === "appointment"
                                        ? "bg-blue-100 text-blue-800"
                                        : record.type === "prescription"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-purple-100 text-purple-800"
                                    }`}
                                  >
                                    {record.type === "appointment"
                                      ? "Consulta"
                                      : record.type === "prescription"
                                      ? "Receta"
                                      : "Archivo"}
                                  </span>
                                  {record.category === "lab" && (
                                    <span className="ml-2 px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">
                                      Estudio
                                    </span>
                                  )}
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
                                  {record.fileSize && (
                                    <span className="text-gray-500">
                                      {formatFileSize(record.fileSize)}
                                    </span>
                                  )}
                                </div>

                                {record.notes && (
                                  <div className="mt-3 p-3 bg-gray-50 rounded border">
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
                                        {record.medications.map(
                                          (med, index) => (
                                            <div
                                              key={index}
                                              className="text-sm text-gray-700 bg-gray-50 p-2 rounded border"
                                            >
                                              <strong>{med.name}</strong> -{" "}
                                              {med.dosage} - {med.frequency}
                                              {med.instructions && (
                                                <p className="text-gray-600 text-xs mt-1">
                                                  {med.instructions}
                                                </p>
                                              )}
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>

                              <div className="ml-4 flex space-x-2">
                                {record.type === "prescription" && (
                                  <button
                                    onClick={() =>
                                      downloadPrescription(
                                        record.prescriptionId
                                      )
                                    }
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-amber-600 bg-amber-100 hover:bg-amber-200"
                                    title="Descargar PDF"
                                  >
                                    <ArrowDownTrayIcon className="h-4 w-4" />
                                  </button>
                                )}

                                {record.type === "file" && (
                                  <>
                                    <a
                                      href={record.downloadURL}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                                      title="Ver archivo"
                                    >
                                      <EyeIcon className="h-4 w-4" />
                                    </a>
                                    <button
                                      onClick={() =>
                                        handleDeleteFile(
                                          record.fileId,
                                          record.filePath
                                        )
                                      }
                                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-600 bg-red-100 hover:bg-red-200"
                                      title="Eliminar archivo"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upload Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Subir Documento Médico
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título del Documento *
                    </label>
                    <input
                      type="text"
                      value={fileTitle}
                      onChange={(e) => setFileTitle(e.target.value)}
                      placeholder="Ej: Resultados de análisis, Radiografía..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría *
                    </label>
                    <select
                      value={fileCategory}
                      onChange={(e) => setFileCategory(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="general">General</option>
                      <option value="lab">Estudios de Laboratorio</option>
                      <option value="imaging">Imágenes Médicas</option>
                      <option value="prescription">Recetas</option>
                      <option value="report">Informes Médicos</option>
                      <option value="other">Otros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seleccionar Archivo *
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    {selectedFile && (
                      <p className="mt-2 text-sm text-gray-600">
                        Archivo seleccionado: {selectedFile.name} (
                        {formatFileSize(selectedFile.size)})
                      </p>
                    )}
                  </div>

                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                      <div>
                        <p className="text-sm text-yellow-800">
                          Tipos permitidos: PDF, DOC, DOCX, JPG, PNG, TXT
                        </p>
                        <p className="text-sm text-yellow-800">
                          Tamaño máximo: 10MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedFile(null);
                      setFileTitle("");
                      setFileCategory("general");
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    disabled={uploading}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleFileUpload}
                    disabled={uploading || !selectedFile || !fileTitle.trim()}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? "Subiendo..." : "Subir Documento"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modals */}
          <NewAppointmentModal
            isOpen={showNewAppointmentModal}
            onClose={() => setShowNewAppointmentModal(false)}
            patient={patient}
            doctorData={doctorData}
            onSuccess={() => {
              setShowNewAppointmentModal(false);
              refreshAppointments();
              setMessage("Cita creada exitosamente");
              setTimeout(() => setMessage(""), 3000);
            }}
          />

          <EditPatientModal
            isOpen={showEditPatientModal}
            onClose={() => setShowEditPatientModal(false)}
            patient={patient}
            onSuccess={() => {
              setShowEditPatientModal(false);
              refreshPatientData();
              setMessage("Información del paciente actualizada exitosamente");
              setTimeout(() => setMessage(""), 3000);
            }}
          />

          <PrescriptionModal
            isOpen={showPrescriptionModal}
            onClose={() => setShowPrescriptionModal(false)}
            patientId={patient?.id}
            onSuccess={() => {
              setShowPrescriptionModal(false);
              loadMedicalData(id); // Refresh medical data to show new prescription
              setMessage("Receta generada exitosamente");
              setTimeout(() => setMessage(""), 3000);
            }}
          />
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
