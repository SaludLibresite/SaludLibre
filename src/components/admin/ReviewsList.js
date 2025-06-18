import { StarIcon, CheckBadgeIcon } from "@heroicons/react/24/solid";
import {
  StarIcon as StarOutlineIcon,
  ChatBubbleLeftEllipsisIcon,
} from "@heroicons/react/24/outline";

export default function ReviewsList() {
  // No hay reseñas - lista vacía
  const reviews = [];

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <StarIcon
        key={index}
        className={`h-4 w-4 ${
          index < rating ? "text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100">
      {/* Header */}
      <div className="px-6 py-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Reseñas de Pacientes
            </h2>
          </div>
          {reviews.length > 0 && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {renderStars(Math.round(averageRating))}
              </div>
              <span className="text-sm text-gray-600">
                {averageRating.toFixed(1)} ({reviews.length} reseñas)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Empty State */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
            <StarOutlineIcon className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay reseñas aún
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Las reseñas de pacientes aparecerán aquí una vez que las reciba.
          </p>
          <div className="flex items-center justify-center space-x-1 text-amber-500 mb-4">
            {[...Array(5)].map((_, index) => (
              <StarIcon key={index} className="h-6 w-6" />
            ))}
          </div>
          <p className="text-xs text-gray-400">
            Las reseñas positivas ayudan a atraer más pacientes
          </p>
        </div>
      ) : (
        <>
          {/* Reviews List */}
          <div className="divide-y divide-gray-200">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="p-6 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-sm font-medium text-white">
                        {review.patientName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {review.patientName}
                        </h4>
                        {review.verified && (
                          <CheckBadgeIcon className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {review.date}
                      </span>
                    </div>

                    <div className="flex items-center mt-1">
                      {renderStars(review.rating)}
                    </div>

                    <p className="mt-2 text-sm text-gray-700">
                      {review.comment}
                    </p>

                    <div className="mt-3 flex items-center space-x-4">
                      <button className="text-sm text-amber-600 hover:text-amber-700 transition-colors duration-200">
                        Responder
                      </button>
                      <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200">
                        Reportar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className="px-6 py-4 border-t border-gray-200">
            <button className="w-full text-center text-sm text-amber-600 hover:text-amber-700 font-medium py-2 px-4 rounded-lg hover:bg-amber-50 transition-all duration-200">
              Cargar más reseñas
            </button>
          </div>
        </>
      )}
    </div>
  );
}
