import { useState, useEffect } from "react";
import {
  DocumentIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { getPatientDocuments } from "../../lib/patientDocumentsService";

export default function PatientDocumentsAdmin({ patientId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      loadDocuments();
    }
  }, [patientId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await getPatientDocuments(patientId);
      setDocuments(docs);
    } catch (error) {
      console.error("Error loading patient documents:", error);
    } finally {
      setLoading(false);
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
          Documentos Personales del Paciente
        </h3>
        <div className="text-sm text-gray-500">
          {documents.length} documento{documents.length !== 1 ? 's' : ''}
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No hay documentos personales
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            El paciente no ha subido documentos personales aún
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3 flex-1">
                <span className="text-2xl">{getFileIcon(doc.fileType)}</span>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {doc.title}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {doc.fileName} • {formatFileSize(doc.fileSize)} •{" "}
                    {doc.uploadedAt?.toDate
                      ? doc.uploadedAt.toDate().toLocaleDateString("es-ES")
                      : new Date(doc.uploadedAt).toLocaleDateString("es-ES")}
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Documento personal
                    </span>
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

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 mr-2" />
          <div>
            <p className="text-sm text-blue-800">
              <strong>Información:</strong> Estos son documentos personales que el paciente ha subido desde su cuenta. 
              Pueden incluir DNI, carnet de vacunación, estudios médicos previos, etc.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
