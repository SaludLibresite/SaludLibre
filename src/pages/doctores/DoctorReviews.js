import usersReview from "../../data/usersReview.json";

export default function DoctorReviews({ reviews }) {
  return (
    <div className="bg-white rounded-xl shadow p-5 w-full my-4">
      <h3 className="font-bold text-lg mb-3 text-blue-800">Reseñas de pacientes</h3>
      <div className="flex flex-col gap-4">
        {reviews.map((r, i) => (
          <div key={i} className="flex gap-4 items-start bg-slate-50 rounded-lg p-4 shadow">
            <img src={r.photo} alt={r.name} className="w-12 h-12 rounded-full object-cover border-2 border-blue-100" />
            <div className="flex-1">
              <div className="flex gap-2 items-center mb-1">
                <span className="font-semibold text-blue-700">{r.name}</span>
                <span className="text-yellow-400 text-base">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                <span className="text-xs text-slate-400 ml-2">{r.date}</span>
              </div>
              <p className="text-slate-600 text-sm">{r.comment}</p>
            </div>
          </div>
        ))}
        {reviews.length === 0 && <div className="text-slate-400 text-center">Sin reseñas aún.</div>}
      </div>
    </div>
  );
} 