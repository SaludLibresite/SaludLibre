import React from "react";

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}) {
  return (
    <div className="flex justify-center items-center gap-2 mt-12">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
          ${
            currentPage === 1
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-sm hover:shadow"
          }`}
      >
        Anterior
      </button>

      <div className="flex items-center gap-1">
        {[...Array(totalPages)].map((_, idx) => (
          <button
            key={idx + 1}
            onClick={() => onPageChange(idx + 1)}
            className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200
              ${
                currentPage === idx + 1
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-sm hover:shadow"
              }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
          ${
            currentPage === totalPages
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-sm hover:shadow"
          }`}
      >
        Siguiente
      </button>
    </div>
  );
}
