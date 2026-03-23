'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const GMAP_LIBRARIES: ('places')[] = ['places'];

/* ─── Types ─── */
type EntityType = 'centro_medico' | 'farmacia' | 'laboratorio';

interface EntityLocation {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

interface Entity {
  id: string;
  type: EntityType;
  name: string;
  slug: string;
  email: string;
  phone: string;
  description: string;
  profileImage: string;
  schedule: string;
  location: EntityLocation;
  website: string;
  verified: boolean;
}

const TYPE_LABELS: Record<EntityType, string> = {
  centro_medico: 'Centro Médico',
  farmacia: 'Farmacia',
  laboratorio: 'Laboratorio',
};

const TYPE_GRADIENTS: Record<EntityType, string> = {
  centro_medico: 'from-blue-600 via-blue-700 to-blue-900',
  farmacia: 'from-emerald-600 via-emerald-700 to-emerald-900',
  laboratorio: 'from-purple-600 via-purple-700 to-purple-900',
};

const TYPE_ACCENT: Record<EntityType, string> = {
  centro_medico: '#3b82f6',
  farmacia: '#10b981',
  laboratorio: '#8b5cf6',
};

const TYPE_ICONS: Record<EntityType, string> = {
  centro_medico: '🏥',
  farmacia: '💊',
  laboratorio: '🔬',
};

/* ─── Component ─── */
export default function EntityProfile() {
  const { slug } = useParams<{ slug: string }>();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries: GMAP_LIBRARIES,
  });

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/entities/${slug}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setEntity(data.entity);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [slug]);

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#4dbad9]" />
      </div>
    );
  }

  /* ─── Not found ─── */
  if (!entity) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Entidad no encontrada</h2>
        <Link href="/doctores" className="text-[#4dbad9] hover:underline">Volver al listado</Link>
      </div>
    );
  }

  const accent = TYPE_ACCENT[entity.type] ?? '#4dbad9';
  const hasLocation = entity.location?.latitude && entity.location?.longitude;

  return (
    <div className="min-h-screen bg-[var(--color-surface-elevated)]">
      {/* ─── Hero ─── */}
      <div className={`bg-gradient-to-br ${TYPE_GRADIENTS[entity.type] ?? 'from-[#011d2f] via-[#0a3a5c] to-[#0d4a6f]'}`}>
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-10 sm:px-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end">
            {/* Avatar */}
            <div className="relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-[3px] border-white/20 bg-white shadow-xl sm:h-36 sm:w-36">
              {entity.profileImage ? (
                <img
                  src={entity.profileImage}
                  alt={entity.name}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`flex h-full w-full items-center justify-center text-4xl${entity.profileImage ? ' hidden' : ''}`}>
                {TYPE_ICONS[entity.type] ?? '🏢'}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-3xl font-bold text-white">{entity.name}</h1>
                {entity.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-0.5 text-[11px] font-medium text-green-300">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Verificado
                  </span>
                )}
              </div>

              <p className="mt-1 text-lg font-medium text-white/80">
                {TYPE_ICONS[entity.type]} {TYPE_LABELS[entity.type]}
              </p>

              {/* Meta chips */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {entity.location?.formattedAddress && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-gray-300">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {entity.location.formattedAddress}
                  </span>
                )}
              </div>
            </div>

            {/* CTA buttons — desktop */}
            <div className="hidden shrink-0 flex-col gap-2 sm:flex">
              {entity.phone && (
                <a
                  href={`https://wa.me/${entity.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, me contacto desde SaludLibre por ${entity.name}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-600"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /></svg>
                  WhatsApp
                </a>
              )}
              {entity.phone && (
                <a
                  href={`tel:${entity.phone}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/20 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-white/30"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Llamar
                </a>
              )}
            </div>
          </div>

          {/* Mobile CTA */}
          <div className="mt-5 flex gap-2 sm:hidden">
            {entity.phone && (
              <a
                href={`https://wa.me/${entity.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, me contacto desde SaludLibre por ${entity.name}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl bg-emerald-500 py-3 text-center text-sm font-semibold text-white shadow transition hover:bg-emerald-600"
              >
                WhatsApp
              </a>
            )}
            {entity.phone && (
              <a href={`tel:${entity.phone}`} className="rounded-xl bg-white/20 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-white/30">
                📞
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ─── Content: 2 columns ─── */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content (2/3) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Description */}
            {entity.description && (
              <section className="rounded-2xl bg-[var(--color-surface)] p-6 shadow-sm ring-1 ring-[var(--color-border)]">
                <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--color-text-primary)]">
                  <svg className="h-5 w-5" style={{ color: accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                  Acerca de {entity.name}
                </h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {entity.description}
                </p>
              </section>
            )}

            {/* Map */}
            {hasLocation && isLoaded && (
              <section className="overflow-hidden rounded-2xl bg-[var(--color-surface)] shadow-sm ring-1 ring-[var(--color-border)]">
                <div className="p-6 pb-0">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--color-text-primary)]">
                    <svg className="h-5 w-5" style={{ color: accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    Ubicación
                  </h3>
                  {entity.location.formattedAddress && (
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{entity.location.formattedAddress}</p>
                  )}
                </div>
                <div className="mt-4 h-72">
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={{ lat: entity.location.latitude, lng: entity.location.longitude }}
                    zoom={15}
                    options={{ disableDefaultUI: true, zoomControl: true, styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }] }}
                  >
                    <Marker position={{ lat: entity.location.latitude, lng: entity.location.longitude }} />
                  </GoogleMap>
                </div>
                <div className="p-4 pt-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${entity.location.latitude},${entity.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                    style={{ color: accent }}
                  >
                    Abrir en Google Maps
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-3-4.5h6m0 0v6m0-6L9.75 20.25" />
                    </svg>
                  </a>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-6">
            {/* Schedule */}
            {entity.schedule && (
              <section className="rounded-2xl bg-[var(--color-surface)] p-6 shadow-sm ring-1 ring-[var(--color-border)]">
                <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--color-text-primary)]">
                  <svg className="h-5 w-5" style={{ color: accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Horarios de atención
                </h3>
                <p className="mt-3 whitespace-pre-line text-sm text-[var(--color-text-secondary)]">{entity.schedule}</p>
              </section>
            )}

            {/* Contact */}
            <section className="rounded-2xl bg-[var(--color-surface)] p-6 shadow-sm ring-1 ring-[var(--color-border)]">
              <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--color-text-primary)]">
                <svg className="h-5 w-5" style={{ color: accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                Contacto
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-[var(--color-text-secondary)]">
                {entity.phone && (
                  <li className="flex items-center gap-3">
                    <svg className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    <a href={`tel:${entity.phone}`} className="hover:underline">{entity.phone}</a>
                  </li>
                )}
                {entity.email && (
                  <li className="flex items-center gap-3">
                    <svg className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    <a href={`mailto:${entity.email}`} className="hover:underline">{entity.email}</a>
                  </li>
                )}
                {entity.website && (
                  <li className="flex items-center gap-3">
                    <svg className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                    </svg>
                    <a href={entity.website.startsWith('http') ? entity.website : `https://${entity.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {entity.website.replace(/^https?:\/\//, '')}
                    </a>
                  </li>
                )}
                {entity.location?.formattedAddress && (
                  <li className="flex items-start gap-3">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span>{entity.location.formattedAddress}</span>
                  </li>
                )}
              </ul>
            </section>

            {/* Info notice — no appointments */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <span className="text-xl">ℹ️</span>
                <div>
                  <p className="text-sm font-medium text-amber-800">Información</p>
                  <p className="mt-1 text-xs text-amber-600">
                    Esta entidad no gestiona turnos a través de SaludLibre. Para agendar un turno, contactá directamente por teléfono o WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back link */}
      <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <Link href="/doctores" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-muted)] transition hover:text-[var(--color-text-primary)]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Volver al listado
        </Link>
      </div>
    </div>
  );
}
