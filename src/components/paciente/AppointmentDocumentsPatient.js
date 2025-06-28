import { useState, useEffect } from "react";
import {
  DocumentIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import {
  uploadAppointmentDocument,
  getAppointmentDocuments,
} from "../../lib/appointmentsService";

export default function AppointmentDocumentsPatient({ appointmentId, readOnly = false }) {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (appointmentId) {
      loadDocuments();
    }
  }, [appointmentId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await getAppointmentDocuments(appointmentId);
      setDocuments(docs);
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 10 * 1024 * 1024) { // 10MB limit
      setSelectedFile(file);
    } else {
      alert("El archivo debe ser menor a 10MB");
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
        currentUser.uid,
        { uploadedByRole: 'patient' }
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Documentos de la Cita
        </h3>
        {!readOnly && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Subir Documento</span>
          </button>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No hay documentos
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {readOnly ? "No se han subido documentos para esta cita" : "Suba el primer documento para esta cita"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getFileIcon(doc.fileType)}</span>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {doc.title}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {doc.fileName} • {formatFileSize(doc.fileSize)} •{" "}
                    {doc.uploadedAt?.toDate
                      ? doc.uploadedAt.toDate().toLocaleDateString("es-ES")
                      : new Date(doc.uploadedAt).toLocaleDateString("es-ES")}
                    {doc.uploadedByRole === 'patient' && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Subido por paciente
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={doc.downloadURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Descargar"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                  placeholder="Ej: Estudios previos, Análisis de sangre..."
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
                    Archivo seleccionado: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 mr-2" />
                  <div>
                    <p className="text-sm text-blue-800">
                      Tipos de archivo permitidos: PDF, DOC, DOCX, JPG, PNG, TXT
                    </p>
                    <p className="text-sm text-blue-800">
                      Tamaño máximo: 10MB
                    </p>
                    <p className="text-sm text-blue-800 mt-1">
                      Suba estudios médicos, análisis o documentos relevantes para su consulta
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
                disabled={uploading || !selectedFile || !newDocumentTitle.trim()}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Subiendo..." : "Subir Documento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 