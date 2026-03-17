'use client';

import PatientLayout from '@/components/layout/PatientLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  doctorId: string;
  doctorName: string;
  rating: number;
  comment: string;
  date: string;
}

export default function PatientReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // New review form
  const [showForm, setShowForm] = useState(false);
  const [doctorId, setDoctorId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/reviews?mine=true', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews ?? []);
        }
      } catch { /* */ } finally { setLoading(false); }
    })();
  }, [user]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !doctorId.trim()) return;
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, rating, comment }),
      });
      if (res.ok) {
        toast.success('Reseña enviada');
        setShowForm(false);
        setDoctorId(''); setRating(5); setComment('');
        // Reload
        const reloadRes = await fetch('/api/reviews?mine=true', { headers: { Authorization: `Bearer ${token}` } });
        if (reloadRes.ok) { const data = await reloadRes.json(); setReviews(data.reviews ?? []); }
      } else toast.error('Error al enviar reseña');
    } catch { toast.error('Error al enviar reseña'); } finally { setSubmitting(false); }
  }

  function Stars({ count }: { count: number }) {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <svg key={s} className={`h-4 w-4 ${s <= count ? 'text-[#e8ad0f]' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  }

  return (
    <PatientLayout>
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Reseñas</h1>
            <p className="mt-1 text-sm text-gray-500">Opiniones que dejaste a tus doctores</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-xl bg-[#4dbad9] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3da8c5]"
          >
            {showForm ? 'Cancelar' : 'Nueva Reseña'}
          </button>
        </div>

        {/* New review form */}
        {showForm && (
          <form onSubmit={submitReview} className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Escribir Reseña</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">ID del Doctor</label>
                <input
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  required
                  placeholder="ID del doctor"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#4dbad9] focus:ring-2 focus:ring-[#4dbad9]/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Calificación</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s} type="button" onClick={() => setRating(s)}
                      className="p-0.5"
                    >
                      <svg className={`h-8 w-8 transition ${s <= rating ? 'text-[#e8ad0f]' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Comentario</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#4dbad9] focus:ring-2 focus:ring-[#4dbad9]/20"
                />
              </div>
              <button
                type="submit" disabled={submitting}
                className="rounded-xl bg-[#4dbad9] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3da8c5] disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Enviar Reseña'}
              </button>
            </div>
          </form>
        )}

        {/* Reviews list */}
        <div className="mt-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />)}
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
              <p className="text-gray-500">No dejaste reseñas todavía</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Dr. {r.doctorName}</p>
                      <Stars count={r.rating} />
                    </div>
                    <p className="text-xs text-gray-400">{r.date}</p>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PatientLayout>
  );
}
