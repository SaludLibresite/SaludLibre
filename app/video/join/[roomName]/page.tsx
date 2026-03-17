'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useEffect, useState } from 'react';

export default function VideoJoinPage() {
  const params = useParams();
  const { user } = useAuth();
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const roomName = params.roomName as string;

  useEffect(() => {
    if (!roomName) return;
    (async () => {
      try {
        const headers: Record<string, string> = {};
        if (user) {
          const token = await user.getIdToken();
          headers.Authorization = `Bearer ${token}`;
        }
        const res = await fetch(`/api/video/rooms/${encodeURIComponent(roomName)}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setRoomUrl(data.url ?? data.room?.url);
        } else {
          const errData = await res.json().catch(() => null);
          const reason = errData?.error;
          if (res.status === 401) {
            setError('Necesitás iniciar sesión para acceder a la sala');
          } else if (reason === 'Room not found') {
            setError('Sala no encontrada o expirada');
          } else if (reason === 'Room is no longer active') {
            setError('La sala ya finalizó');
          } else if (reason === 'Not authorized for this room') {
            setError('No tenés acceso a esta sala');
          } else {
            setError(reason || 'Sala no encontrada o expirada');
          }
        }
      } catch {
        setError('Error al conectar con la sala');
      } finally {
        setLoading(false);
      }
    })();
  }, [roomName, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#4dbad9] border-t-transparent" />
          <p className="mt-4 text-lg text-white">Conectando a la sala...</p>
        </div>
      </div>
    );
  }

  if (error || !roomUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">No se puede acceder a la sala</h2>
          <p className="mt-2 text-sm text-gray-500">{error || 'La sala no existe o ha expirado.'}</p>
          <a href="/" className="mt-6 inline-block rounded-xl bg-[#4dbad9] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#3da8c5]">
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-900">
      {/* Header bar */}
      <div className="flex shrink-0 items-center justify-between bg-gray-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 text-white">
            <img src="/img/logo.png" alt="SaludLibre" className="h-8" />
          </a>
          <span className="text-sm text-gray-400">Sala: {roomName}</span>
        </div>
        <a
          href="/"
          className="rounded-lg border border-gray-600 px-3 py-1.5 text-sm text-gray-300 transition hover:bg-gray-700"
        >
          Salir
        </a>
      </div>

      {/* Video iframe */}
      <div className="relative min-h-0 flex-1">
        <iframe
          src={roomUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="absolute inset-0 h-full w-full border-0"
          title="Video consulta"
        />
      </div>
    </div>
  );
}
