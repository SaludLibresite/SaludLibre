import { useState, useEffect } from "react";
import {
  DocumentIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import {
  uploadAppointmentDocument,
  getAppointmentDocuments,
  deleteAppointmentDocument,
  updateAppointmentDocumentTitle,
} from "../../lib/appointmentsService";
import {
  getPrescriptionsByAppointmentId,
  deletePrescription,
} from "../../lib/prescriptionsService";
import PrescriptionModal from "./PrescriptionModal";

export default function AppointmentDocuments({ appointmentId, patientId }) {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingDocument, setEditingDocument] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    if (appointmentId) {
      loadDocuments();
    }
  }, [appointmentId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const [docs, presc] = await Promise.all([
        getAppointmentDocuments(appointmentId),
        getPrescriptionsByAppointmentId(appointmentId),
      ]);
      setDocuments(docs);
      setPrescriptions(presc);
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !newDocumentTitle.trim()) {
      alert("Por favor seleccione un archivo y proporcione un título");
      return;
    }

    try {
      setUploading(true);
      await uploadAppointmentDocument(
        selectedFile,
        appointmentId,
        newDocumentTitle.trim(),
        currentUser.uid
      );

      // Reset form
      setSelectedFile(null);
      setNewDocumentTitle("");
      setShowUploadModal(false);

      // Reload documents
      await loadDocuments();
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Error al subir el documento");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId, filePath) => {
    if (!confirm("¿Está seguro de que desea eliminar este documento?")) {
      return;
    }

    try {
      await deleteAppointmentDocument(documentId, filePath);
      await loadDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Error al eliminar el documento");
    }
  };

  const handleEditTitle = async () => {
    if (!editTitle.trim()) {
      alert("El título no puede estar vacío");
      return;
    }

    try {
      await updateAppointmentDocumentTitle(
        editingDocument.id,
        editTitle.trim()
      );
      setEditingDocument(null);
      setEditTitle("");
      await loadDocuments();
    } catch (error) {
      console.error("Error updating title:", error);
      alert("Error al actualizar el título");
    }
  };

  const handlePrescriptionSuccess = () => {
    // Reload documents to show the new prescription PDF
    loadDocuments();
  };

  const handleDeletePrescription = async (prescriptionId) => {
    if (!confirm("¿Está seguro de que desea eliminar esta receta médica?")) {
      return;
    }

    try {
      await deletePrescription(prescriptionId);
      await loadDocuments();
    } catch (error) {
      console.error("Error deleting prescription:", error);
      alert("Error al eliminar la receta médica");
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes("pdf")) {
      return "📄";
    } else if (fileType.includes("image")) {
      return "🖼️";
    } else if (fileType.includes("word")) {
      return "📝";
    } else {
      return "📄";
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Cargando documentos...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-3 sm:space-y-0">
        <h3 className="text-base sm:text-lg font-medium text-gray-900">
          Documentos de la Cita
        </h3>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowPrescriptionModal(true)}
            disabled={!patientId}
            className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base w-full sm:w-auto"
          >
            <DocumentTextIcon className="h-4 w-4" />
            <span>Crear Receta Médica</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-amber-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-amber-700 flex items-center justify-center space-x-2 text-sm sm:text-base w-full sm:w-auto"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Subir Documento</span>
          </button>
        </div>
      </div>

      {documents.length === 0 && prescriptions.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No hay documentos
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Suba el primer documento o cree una receta médica para esta cita
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {/* Prescriptions */}
          {prescriptions.map((prescription) => (
            <div
              key={prescription.id}
              className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📋</span>
                <div>
                  <h4 className="text-sm font-medium text-green-900">
                    Receta Médica
                  </h4>
                  <p className="text-xs text-green-700">
                    {prescription.createdAt?.toDate
                      ? prescription.createdAt
                          .toDate()
                          .toLocaleDateString("es-ES")
                      : new Date(prescription.createdAt).toLocaleDateString(
                          "es-ES"
                        )}
                    {" • "}
                    {prescription.medications?.length || 0} medicamento(s)
                    {" • "}
                    Dr. {prescription.doctorInfo?.nombre}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={`/api/prescriptions/${prescription.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-green-600 hover:text-green-700"
                  title="Ver receta en PDF"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </a>
                <button
                  onClick={() => handleDeletePrescription(prescription.id)}
                  className="p-2 text-red-400 hover:text-red-600"
                  title="Eliminar receta"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Regular Documents */}
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getFileIcon(doc.fileType)}</span>
                <div>
                  {editingDocument?.id === doc.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleEditTitle();
                          }
                        }}
                      />
                      <button
                        onClick={handleEditTitle}
                        className="text-green-600 hover:text-green-700"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => {
                          setEditingDocument(null);
                          setEditTitle("");
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <h4 className="text-sm font-medium text-gray-900">
                      {doc.title}
                    </h4>
                  )}
                  <p className="text-xs text-gray-500">
                    {doc.fileName} • {formatFileSize(doc.fileSize)} •{" "}
                    {doc.uploadedAt?.toDate
                      ? doc.uploadedAt.toDate().toLocaleDateString("es-ES")
                      : new Date(doc.uploadedAt).toLocaleDateString("es-ES")}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setEditingDocument(doc);
                    setEditTitle(doc.title);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Editar título"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <a
                  href={doc.downloadURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Descargar"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </a>
                <button
                  onClick={() => handleDelete(doc.id, doc.filePath)}
                  className="p-2 text-red-400 hover:text-red-600"
                  title="Eliminar"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Subir Nuevo Documento
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título del Documento *
                </label>
                <input
                  type="text"
                  value={newDocumentTitle}
                  onChange={(e) => setNewDocumentTitle(e.target.value)}
                  placeholder="Ej: Resultados de análisis, Receta médica..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Archivo *
                </label>
                <input
                  type="file"
                  onChange={handleFileSelect}
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
                      Tipos de archivo permitidos: PDF, DOC, DOCX, JPG, PNG, TXT
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
                  setNewDocumentTitle("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={uploading}
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={
                  uploading || !selectedFile || !newDocumentTitle.trim()
                }
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Subiendo..." : "Subir Documento"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Modal */}
      <PrescriptionModal
        isOpen={showPrescriptionModal}
        onClose={() => setShowPrescriptionModal(false)}
        appointmentId={appointmentId}
        patientId={patientId}
        onSuccess={handlePrescriptionSuccess}
      />
    </div>
  );
}
