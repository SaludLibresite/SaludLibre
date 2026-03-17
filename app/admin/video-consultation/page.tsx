'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import SubscriptionGuard from '@/components/guards/SubscriptionGuard';
import { useAuth } from '@/components/providers/AuthProvider';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminVideoConsultationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [roomName, setRoomName] = useState('');
  const [creating, setCreating] = useState(false);

  async function createRoom() {
    if (!user) return;
    setCreating(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/video/rooms', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roomName || `sala-${Date.now()}` }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/video/join/${data.room?.name ?? roomName}`);
      }
    } catch { /* */ } finally { setCreating(false); }
  }

  return (
    <AdminLayout>
      <SubscriptionGuard feature="video-consultation">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Video Consulta</h1>
          <p className="mt-1 text-sm text-gray-500">Creá salas de videoconsulta para tus pacientes</p>

          <div className="mt-8 rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#4dbad9]/10">
                <svg className="h-10 w-10 text-[#4dbad9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Iniciar videoconsulta</h3>
              <p className="mt-2 text-sm text-gray-500">
                Creá una sala y compartí el enlace con tu paciente para comenzar una consulta por video.
              </p>

              <div className="mt-6 space-y-3">
                <input
                  type="text"
                  placeholder="Nombre de la sala (opcional)"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#4dbad9] focus:ring-2 focus:ring-[#4dbad9]/20"
                />
                <button
                  onClick={createRoom}
                  disabled={creating}
                  className="w-full rounded-xl bg-[#4dbad9] py-3 text-sm font-semibold text-white transition hover:bg-[#3da8c5] disabled:opacity-50"
                >
                  {creating ? 'Creando sala...' : 'Crear Sala'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </SubscriptionGuard>
    </AdminLayout>
  );
}
