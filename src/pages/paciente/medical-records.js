import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { query, collection, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import PatientLayout from "../../components/paciente/PatientLayout";
import ProtectedPatientRoute from "../../components/paciente/ProtectedPatientRoute";
import {
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
  DocumentArrowUpIcon,
  EyeIcon,
  TrashIcon,
  PlusIcon,
  CalendarIcon,
  UserIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

export default function MedicalRecords() {
  const { currentUser } = useAuth();
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("records");
  const [message, setMessage] = useState("");

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
      }
    } catch (error) {
      console.error("Error loading patient data:", error);
      setMessage("Error al cargar los datos médicos");
    } finally {
      setLoading(false);
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
                  <h1 className="text-2xl font-bold text-gray-900">Historial Médico</h1>
                  <p className="text-gray-600">
                    Accede a todos tus registros médicos y archivos
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-2 rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center">
                  <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                  Subir Archivo
                </button>
              </div>
            </div>

            {message && (
              <div className={`mt-4 p-3 rounded-lg ${
                message.includes("Error")
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-green-100 text-green-700 border border-green-200"
              }`}>
                {message}
              </div>
            )}
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
                    Registros Médicos
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
                    Archivos
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
                    Recetas
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
                    Estudios
                  </div>
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "records" && (
                <div className="text-center py-12">
                  <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay registros médicos
                  </h3>
                  <p className="text-gray-600">
                    Los registros de tus consultas aparecerán aquí.
                  </p>
                </div>
              )}

              {activeTab === "files" && (
                <div className="text-center py-12">
                  <DocumentArrowUpIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay archivos subidos
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Sube tus estudios, recetas y documentos médicos.
                  </p>
                  <button className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Subir Primer Archivo
                  </button>
                </div>
              )}

              {activeTab === "prescriptions" && (
                <div className="text-center py-12">
                  <ClipboardDocumentListIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay recetas disponibles
                  </h3>
                  <p className="text-gray-600">
                    Las recetas médicas aparecerán aquí cuando tu doctor las genere.
                  </p>
                </div>
              )}

              {activeTab === "lab" && (
                <div className="text-center py-12">
                  <BeakerIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay estudios disponibles
                  </h3>
                  <p className="text-gray-600">
                    Los resultados de tus estudios de laboratorio aparecerán aquí.
                  </p>
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
                    <li>• Todos tus datos médicos están encriptados y son confidenciales</li>
                    <li>• Puedes subir archivos de hasta 10MB (PDF, imágenes, documentos)</li>
                    <li>• Solo tú y tu médico pueden acceder a esta información</li>
                    <li>• Los datos se sincronizan automáticamente con tu doctor</li>
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