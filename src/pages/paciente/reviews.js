import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import PatientLayout from "../../components/paciente/PatientLayout";
import ProtectedPatientRoute from "../../components/paciente/ProtectedPatientRoute";
import {
  getReviewsByPatientId,
  getReviewableAppointments,
  createReview,
} from "../../lib/reviewsService";
import {
  StarIcon,
  PlusIcon,
  CalendarIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

export default function PatientReviews() {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewReviewModal, setShowNewReviewModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [message, setMessage] = useState("");
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: "",
    wouldRecommend: true,
    aspects: {
      punctuality: 0,
      attention: 0,
      explanation: 0,
      facilities: 0,
    },
  });

  useEffect(() => {
    if (currentUser) {
      loadPatientData();
    }
  }, [currentUser]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      setMessage("");

      // Get patient data
      const patientsQuery = query(
        collection(db, "patients"),
        where("userId", "==", currentUser.uid)
      );
      const patientsSnapshot = await getDocs(patientsQuery);

      if (!patientsSnapshot.empty) {
        const patientDoc = patientsSnapshot.docs[0];
        const patient = { id: patientDoc.id, ...patientDoc.data() };
        setPatientData(patient);

        // Load existing reviews
        await loadReviews(patient.id);

        // Load reviewable appointments (completed appointments without reviews)
        await loadReviewableAppointments(patient.id);
      } else {
        setMessage("No se encontraron datos del paciente");
      }
    } catch (error) {
      console.error("Error loading patient data:", error);
      setMessage("Error al cargar los datos del paciente");
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async (patientId) => {
    try {
      const reviewsList = await getReviewsByPatientId(patientId);
      setReviews(reviewsList);
    } catch (error) {
      console.error("Error loading reviews:", error);
      setMessage("Error al cargar las reseñas");
    }
  };

  const loadReviewableAppointments = async (patientId) => {
    try {
      const reviewableAppointments = await getReviewableAppointments(patientId);
      setPendingReviews(reviewableAppointments);
    } catch (error) {
      console.error("Error loading reviewable appointments:", error);
      setMessage("Error al cargar las citas disponibles para reseña");
    }
  };

  const handleRatingChange = (rating) => {
    setNewReview((prev) => ({
      ...prev,
      rating: rating,
    }));
  };

  const handleAspectRatingChange = (aspect, rating) => {
    setNewReview((prev) => ({
      ...prev,
      aspects: {
        ...prev.aspects,
        [aspect]: rating,
      },
    }));
  };

  const handleSubmitReview = async () => {
    if (newReview.rating === 0) {
      alert("Por favor, selecciona una calificación general");
      return;
    }

    if (!patientData || !selectedAppointment) {
      alert("Error: Datos del paciente o cita no disponibles");
      return;
    }

    try {
      const reviewData = {
        patientId: patientData.id,
        patientName: patientData.name,
        appointmentId: selectedAppointment.id,
        doctorId: selectedAppointment.doctorId,
        doctorName: selectedAppointment.doctorName,
        doctorSpecialty:
          selectedAppointment.doctorSpecialty || "No especificado",
        appointmentDate: selectedAppointment.date?.toDate
          ? selectedAppointment.date.toDate()
          : new Date(selectedAppointment.date),
        rating: newReview.rating,
        comment: newReview.comment,
        wouldRecommend: newReview.wouldRecommend,
        aspects: newReview.aspects,
      };

      const createdReview = await createReview(reviewData);

      // Update local state
      setReviews((prev) => [createdReview, ...prev]);
      setPendingReviews((prev) =>
        prev.filter((p) => p.id !== selectedAppointment.id)
      );

      // Reset form
      setNewReview({
        rating: 0,
        comment: "",
        wouldRecommend: true,
        aspects: {
          punctuality: 0,
          attention: 0,
          explanation: 0,
          facilities: 0,
        },
      });
      setSelectedAppointment(null);
      setShowNewReviewModal(false);

      setMessage("Reseña creada exitosamente");
    } catch (error) {
      console.error("Error creating review:", error);
      alert("Error al crear la reseña. Por favor, inténtalo de nuevo.");
    }
  };

  const openReviewModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowNewReviewModal(true);
  };

  const closeReviewModal = () => {
    setSelectedAppointment(null);
    setShowNewReviewModal(false);
    setNewReview({
      rating: 0,
      comment: "",
      wouldRecommend: true,
      aspects: {
        punctuality: 0,
        attention: 0,
        explanation: 0,
        facilities: 0,
      },
    });
  };

  const renderStars = (rating, onRatingChange = null, size = "h-5 w-5") => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange && onRatingChange(star)}
            className={`${
              onRatingChange
                ? "cursor-pointer hover:scale-110"
                : "cursor-default"
            } transition-transform`}
            disabled={!onRatingChange}
          >
            {star <= rating ? (
              <StarIconSolid className={`${size} text-yellow-400`} />
            ) : (
              <StarIcon className={`${size} text-gray-300`} />
            )}
          </button>
        ))}
      </div>
    );
  };

  const getAspectName = (aspect) => {
    const names = {
      punctuality: "Puntualidad",
      attention: "Atención",
      explanation: "Explicación",
      facilities: "Instalaciones",
    };
    return names[aspect] || aspect;
  };

  if (loading) {
    return (
      <ProtectedPatientRoute>
        <PatientLayout>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando reseñas...</p>
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
                  <StarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Mis Reseñas
                  </h1>
                  <p className="text-gray-600">
                    Califica tu experiencia con los doctores
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {message && (
            <div
              className={`p-4 rounded-lg mb-6 ${
                message.includes("Error") || message.includes("error")
                  ? "bg-red-50 border border-red-200 text-red-800"
                  : "bg-green-50 border border-green-200 text-green-800"
              }`}
            >
              {message}
            </div>
          )}

          {/* Pending Reviews */}
          {pendingReviews.length > 0 && (
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Citas Pendientes de Reseña
              </h3>
              <div className="space-y-3">
                {pendingReviews.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200"
                  >
                    <div className="flex items-center">
                      <div className="h-12 w-12 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center mr-4">
                        <span className="text-sm font-bold text-white">
                          {appointment.doctorName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {appointment.doctorName}
                        </h4>
                        <p className="text-gray-600 text-sm">
                          {appointment.doctorSpecialty || "No especificado"}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {appointment.date?.toDate
                            ? appointment.date
                                .toDate()
                                .toLocaleDateString("es-ES")
                            : new Date(appointment.date).toLocaleDateString(
                                "es-ES"
                              )}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => openReviewModal(appointment)}
                      className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-2 rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 flex items-center"
                    >
                      <StarIcon className="h-4 w-4 mr-2" />
                      Escribir Reseña
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Mis Reseñas ({reviews.length})
            </h3>

            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-xl shadow-md border border-gray-100 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-12 w-12 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center mr-4">
                        <span className="text-sm font-bold text-white">
                          {review.doctorName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {review.doctorName}
                        </h4>
                        <p className="text-gray-600 text-sm">
                          {review.doctorSpecialty || "No especificado"}
                        </p>
                        <p className="text-gray-500 text-xs">
                          Cita:{" "}
                          {review.appointmentDate?.toDate
                            ? review.appointmentDate
                                .toDate()
                                .toLocaleDateString("es-ES")
                            : new Date(
                                review.appointmentDate
                              ).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {renderStars(review.rating)}
                      <p className="text-xs text-gray-500 mt-1">
                        {review.createdAt?.toDate
                          ? review.createdAt
                              .toDate()
                              .toLocaleDateString("es-ES")
                          : new Date(review.createdAt).toLocaleDateString(
                              "es-ES"
                            )}
                      </p>
                    </div>
                  </div>

                  {review.comment && (
                    <div className="mb-4">
                      <p className="text-gray-700 italic">"{review.comment}"</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {Object.entries(review.aspects).map(([aspect, rating]) => (
                      <div key={aspect} className="text-center">
                        <div className="text-xs font-medium text-gray-600 mb-1">
                          {getAspectName(aspect)}
                        </div>
                        {renderStars(rating, null, "h-3 w-3")}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm text-gray-600">
                        {review.wouldRecommend
                          ? "Recomendaría este doctor"
                          : "No recomendaría este doctor"}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-amber-600">
                      {review.rating}/5 estrellas
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 text-center">
                <StarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No tienes reseñas aún
                </h3>
                <p className="text-gray-600 mb-6">
                  Después de tus citas médicas, podrás calificar tu experiencia
                  aquí.
                </p>
              </div>
            )}
          </div>

          {/* New Review Modal */}
          {showNewReviewModal && selectedAppointment && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Escribir Reseña
                  </h3>
                  <button
                    onClick={closeReviewModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Doctor Info */}
                <div className="flex items-center mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="h-12 w-12 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center mr-4">
                    <span className="text-sm font-bold text-white">
                      {selectedAppointment.doctorName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {selectedAppointment.doctorName}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {selectedAppointment.doctorSpecialty || "No especificado"}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {selectedAppointment.date?.toDate
                        ? selectedAppointment.date
                            .toDate()
                            .toLocaleDateString("es-ES")
                        : new Date(selectedAppointment.date).toLocaleDateString(
                            "es-ES"
                          )}
                    </p>
                  </div>
                </div>

                {/* Overall Rating */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Calificación General *
                  </label>
                  <div className="flex items-center space-x-2">
                    {renderStars(
                      newReview.rating,
                      handleRatingChange,
                      "h-8 w-8"
                    )}
                    <span className="text-gray-600 ml-2">
                      {newReview.rating > 0 && `${newReview.rating}/5`}
                    </span>
                  </div>
                </div>

                {/* Aspect Ratings */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Calificación por Aspectos
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(newReview.aspects).map(
                      ([aspect, rating]) => (
                        <div
                          key={aspect}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-gray-600">
                            {getAspectName(aspect)}
                          </span>
                          {renderStars(rating, (r) =>
                            handleAspectRatingChange(aspect, r)
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Comment */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comentario (Opcional)
                  </label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) =>
                      setNewReview((prev) => ({
                        ...prev,
                        comment: e.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    placeholder="Comparte tu experiencia con este doctor..."
                  />
                </div>

                {/* Recommendation */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Recomendarías este doctor?
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="recommend"
                        checked={newReview.wouldRecommend === true}
                        onChange={() =>
                          setNewReview((prev) => ({
                            ...prev,
                            wouldRecommend: true,
                          }))
                        }
                        className="mr-2 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-gray-700">Sí</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="recommend"
                        checked={newReview.wouldRecommend === false}
                        onChange={() =>
                          setNewReview((prev) => ({
                            ...prev,
                            wouldRecommend: false,
                          }))
                        }
                        className="mr-2 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-gray-700">No</span>
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeReviewModal}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    className="px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all duration-200"
                  >
                    Publicar Reseña
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PatientLayout>
    </ProtectedPatientRoute>
  );
}
