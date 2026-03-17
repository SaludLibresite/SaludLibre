'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

/* ─── Types ─── */
interface DoctorLocation {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

interface DoctorSubscription {
  status: string;
  planId: string;
  planName: string;
  expiresAt: string | null;
}

interface Doctor {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  gender: string;
  specialty: string;
  description: string;
  profileImage: string;
  schedule: string;
  onlineConsultation: boolean;
  location: DoctorLocation;
  verified: boolean;
  subscription: DoctorSubscription;
  professional: {
    profession: string;
    licenseNumber: string;
    officeAddress: string;
  };
  _distance?: number;
}

interface Specialty {
  id: string;
  title: string;
}

/* ─── Helpers ─── */
type Rank = 'vip' | 'plus' | 'normal';

function getDoctorRank(doc: Doctor): Rank {
  const plan = doc.subscription?.planName?.toLowerCase() ?? '';
  const active = doc.subscription?.status === 'active';
  if (!active) return 'normal';
  if (plan.includes('plus')) return 'vip';
  if (plan.includes('medium')) return 'plus';
  return 'normal';
}

function getDrTitle(gender: string): string {
  return gender === 'female' ? 'Dra.' : 'Dr.';
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DOCTORS_PER_PAGE = 20;
const BUENOS_AIRES = { lat: -34.6037, lng: -58.3816 };
const NEARBY_RADIUS_KM = 25;

/* ─── Barrios ─── */
const BARRIOS_MAPPING: Record<string, string[]> = {
  'Palermo': ['Palermo', 'Av. Santa Fe', 'Av. Las Heras', 'Thames', 'Gorriti', 'Honduras', 'Guatemala', 'El Salvador', 'Niceto Vega', 'Humboldt', 'Scalabrini Ortiz'],
  'Recoleta': ['Recoleta', 'Av. Callao', 'Av. Pueyrredón', 'Ayacucho', 'Junín', 'French', 'Juncal', 'Arenales'],
  'Belgrano': ['Belgrano', 'Av. Cabildo', 'Juramento', 'Monroe', 'Cuba', 'Echeverría', 'Sucre'],
  'Núñez': ['Núñez', 'Amenábar', 'Moldes', 'Vuelta de Obligado'],
  'Villa Urquiza': ['Villa Urquiza', 'Av. Triunvirato', 'Bauness', 'Holmberg'],
  'Coghlan': ['Coghlan', 'Teodoro García', 'Freire', 'Olleros'],
  'Saavedra': ['Saavedra', 'García del Río', 'Paroissien', 'Ramsay'],
  'Centro / Microcentro': ['Centro', 'Microcentro', 'Av. Corrientes', 'Av. 9 de Julio', 'Florida', 'Lavalle', 'Maipú', 'San Martín', 'Reconquista', 'Esmeralda', 'Diagonal Norte'],
  'Puerto Madero': ['Puerto Madero', 'Juana Manso', 'Pierina Dealessi'],
  'Retiro': ['Retiro', 'Av. Antártida Argentina', 'Av. Ramos Mejía'],
  'San Nicolás': ['San Nicolás', 'Uruguay', 'Paraná', 'Montevideo'],
  'San Telmo': ['San Telmo', 'Defensa', 'Bolívar', 'Piedras', 'Tacuarí', 'Paseo Colón'],
  'La Boca': ['La Boca', 'Caminito', 'Almirante Brown', 'Brandsen'],
  'Barracas': ['Barracas', 'Montes de Oca', 'California', 'Av. Caseros'],
  'Constitución': ['Constitución', 'Lima', 'Salta', 'Santiago del Estero'],
  'Montserrat': ['Montserrat', 'Av. de Mayo', 'Perú', 'Chacabuco'],
  'Caballito': ['Caballito', 'Av. Rivadavia', 'Av. Acoyte', 'Av. Directorio', 'Primera Junta', 'Emilio Mitre'],
  'Almagro': ['Almagro', 'Av. Estado de Israel', 'Av. Medrano', 'Bulnes', 'Gascón'],
  'Balvanera': ['Balvanera', 'Once', 'Larrea', 'Uriburu', 'Pasteur'],
  'Villa Crespo': ['Villa Crespo', 'Av. Warnes', 'Murillo', 'Camargo', 'Padilla'],
  'Flores': ['Flores', 'Av. Nazca', 'Av. Avellaneda', 'Membrillar', 'Artigas', 'Boyacá'],
  'Floresta': ['Floresta', 'Segurola', 'Bahía Blanca'],
  'Villa Luro': ['Villa Luro', 'Av. General Paz', 'Lope de Vega'],
  'Vicente López': ['Vicente López', 'Olivos', 'La Lucila', 'Munro', 'Villa Adelina', 'Villa Martelli'],
  'San Isidro': ['San Isidro', 'Martínez', 'Acassuso'],
  'Tigre': ['Tigre', 'Don Torcuato', 'El Talar', 'General Pacheco', 'Benavídez'],
  'San Fernando': ['San Fernando', 'Victoria', 'Virreyes'],
  'Escobar': ['Escobar', 'Ingeniero Maschwitz', 'Matheu'],
  'Morón': ['Morón', 'Castelar', 'Ituzaingó', 'Villa Sarmiento', 'El Palomar', 'Haedo'],
  'Tres de Febrero': ['Caseros', 'Ciudadela', 'Loma Hermosa', 'Martín Coronado', 'Santos Lugares'],
  'Hurlingham': ['Hurlingham', 'Villa Tesei', 'William C. Morris'],
  'San Miguel': ['San Miguel', 'Bella Vista', 'Muñiz'],
  'Malvinas Argentinas': ['Grand Bourg', 'Los Polvorines', 'Pablo Nogués', 'Tortuguitas'],
  'Avellaneda': ['Avellaneda', 'Dock Sud', 'Piñeyro', 'Villa Domínico', 'Gerli'],
  'Quilmes': ['Quilmes', 'Bernal', 'Don Bosco', 'Ezpeleta'],
  'Berazategui': ['Berazategui', 'Ranelagh', 'Hudson', 'Pereyra'],
  'Florencio Varela': ['Florencio Varela', 'Bosques'],
  'Lanús': ['Lanús Este', 'Lanús Oeste', 'Remedios de Escalada', 'Monte Chingolo'],
  'Lomas de Zamora': ['Lomas de Zamora', 'Banfield', 'Llavallol', 'Temperley', 'Turdera'],
};

const BARRIO_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Palermo': { lat: -34.5847, lng: -58.4248 },
  'Recoleta': { lat: -34.5875, lng: -58.3975 },
  'Belgrano': { lat: -34.5628, lng: -58.4578 },
  'Núñez': { lat: -34.5453, lng: -58.4639 },
  'Villa Urquiza': { lat: -34.5729, lng: -58.4823 },
  'Coghlan': { lat: -34.5592, lng: -58.4791 },
  'Saavedra': { lat: -34.5469, lng: -58.4832 },
  'Centro / Microcentro': { lat: -34.6037, lng: -58.3816 },
  'Puerto Madero': { lat: -34.6118, lng: -58.3632 },
  'Retiro': { lat: -34.5939, lng: -58.3747 },
  'San Nicolás': { lat: -34.6033, lng: -58.3838 },
  'San Telmo': { lat: -34.6214, lng: -58.3724 },
  'La Boca': { lat: -34.6345, lng: -58.3631 },
  'Barracas': { lat: -34.6454, lng: -58.3831 },
  'Constitución': { lat: -34.6276, lng: -58.3817 },
  'Montserrat': { lat: -34.6128, lng: -58.3764 },
  'Caballito': { lat: -34.6189, lng: -58.4367 },
  'Almagro': { lat: -34.6089, lng: -58.4186 },
  'Balvanera': { lat: -34.6093, lng: -58.4030 },
  'Villa Crespo': { lat: -34.6002, lng: -58.4368 },
  'Flores': { lat: -34.6328, lng: -58.4650 },
  'Floresta': { lat: -34.6308, lng: -58.4846 },
  'Villa Luro': { lat: -34.6426, lng: -58.4988 },
  'Vicente López': { lat: -34.5297, lng: -58.4763 },
  'San Isidro': { lat: -34.4713, lng: -58.5270 },
  'Tigre': { lat: -34.4261, lng: -58.5797 },
  'San Fernando': { lat: -34.4417, lng: -58.5597 },
  'Escobar': { lat: -34.3491, lng: -58.7951 },
  'Morón': { lat: -34.6534, lng: -58.6198 },
  'Tres de Febrero': { lat: -34.6045, lng: -58.5645 },
  'Hurlingham': { lat: -34.5897, lng: -58.6362 },
  'San Miguel': { lat: -34.5436, lng: -58.7105 },
  'Malvinas Argentinas': { lat: -34.4695, lng: -58.6975 },
  'Avellaneda': { lat: -34.6613, lng: -58.3647 },
  'Quilmes': { lat: -34.7206, lng: -58.2636 },
  'Berazategui': { lat: -34.7639, lng: -58.2097 },
  'Florencio Varela': { lat: -34.7954, lng: -58.2759 },
  'Lanús': { lat: -34.7002, lng: -58.3907 },
  'Lomas de Zamora': { lat: -34.7521, lng: -58.3983 },
  'Capital Federal (Otros)': { lat: -34.6037, lng: -58.3816 },
  'GBA (Otros)': { lat: -34.6500, lng: -58.5000 },
};

function extractBarrio(address: string): string {
  if (!address) return 'Otros';
  const norm = address.toLowerCase();
  for (const [barrio, keywords] of Object.entries(BARRIOS_MAPPING)) {
    for (const kw of keywords) {
      if (norm.includes(kw.toLowerCase())) return barrio;
    }
  }
  if (norm.includes('ciudad autónoma') || norm.includes('cdad. autónoma') || norm.includes('capital federal'))
    return 'Capital Federal (Otros)';
  if (norm.includes('provincia de buenos aires') || norm.includes('buenos aires, argentina'))
    return 'GBA (Otros)';
  return 'Otros';
}

function getBarrioOptions(doctors: Doctor[]): { value: string; label: string; count: number }[] {
  const counts: Record<string, number> = {};
  doctors.forEach((d) => {
    const b = extractBarrio(d.location?.formattedAddress);
    counts[b] = (counts[b] ?? 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([barrio, count]) => ({ value: barrio, label: `${barrio} (${count})`, count }));
}

/* ─── Component ─── */
export default function DoctorSearch() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<Doctor | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [specialty, setSpecialty] = useState(searchParams.get('specialty') ?? '');
  const [onlineOnly, setOnlineOnly] = useState(searchParams.get('online') === 'true');
  const [genderFilter, setGenderFilter] = useState(searchParams.get('genero') ?? '');
  const [planFilter, setPlanFilter] = useState(searchParams.get('plan') ?? '');
  const [barrioFilter, setBarrioFilter] = useState(searchParams.get('zona') ?? '');

  // Nearby
  const [showingNearby, setShowingNearby] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState('');

  // Map modal filters
  const [mapBarrioFilter, setMapBarrioFilter] = useState('');
  const [showMapFilters, setShowMapFilters] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/doctors').then((r) => r.json()),
      fetch('/api/specialties').then((r) => r.json()),
    ])
      .then(([docData, specData]) => {
        setAllDoctors(docData.doctors ?? []);
        setSpecialties(specData.specialties ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Barrio options from all doctors
  const barrioOptions = useMemo(() => getBarrioOptions(allDoctors), [allDoctors]);

  // Apply filters + sort by rank
  const filtered = useMemo(() => {
    let result = [...allDoctors];

    // Nearby mode
    if (showingNearby && userLocation) {
      result = result
        .filter((d) => d.location?.latitude && d.location?.longitude)
        .map((d) => ({
          ...d,
          _distance: haversineDistance(userLocation.lat, userLocation.lng, d.location.latitude, d.location.longitude),
        }))
        .filter((d) => d._distance! <= NEARBY_RADIUS_KM)
        .sort((a, b) => a._distance! - b._distance!);
      return result;
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name?.toLowerCase().includes(q) ||
          d.specialty?.toLowerCase().includes(q) ||
          d.location?.formattedAddress?.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q),
      );
    }
    if (specialty) result = result.filter((d) => d.specialty === specialty);
    if (onlineOnly) result = result.filter((d) => d.onlineConsultation);
    if (genderFilter) result = result.filter((d) => d.gender === genderFilter);
    if (planFilter) result = result.filter((d) => getDoctorRank(d) === planFilter);
    if (barrioFilter) result = result.filter((d) => extractBarrio(d.location?.formattedAddress) === barrioFilter);

    const rankOrder: Record<Rank, number> = { vip: 0, plus: 1, normal: 2 };
    result.sort((a, b) => rankOrder[getDoctorRank(a)] - rankOrder[getDoctorRank(b)]);
    return result;
  }, [allDoctors, search, specialty, onlineOnly, genderFilter, planFilter, barrioFilter, showingNearby, userLocation]);

  const totalPages = Math.ceil(filtered.length / DOCTORS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * DOCTORS_PER_PAGE, page * DOCTORS_PER_PAGE);

  const vipDoctors = paginated.filter((d) => getDoctorRank(d) === 'vip');
  const plusDoctors = paginated.filter((d) => getDoctorRank(d) === 'plus');
  const normalDoctors = paginated.filter((d) => getDoctorRank(d) === 'normal');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setShowingNearby(false);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (specialty) params.set('specialty', specialty);
    if (onlineOnly) params.set('online', 'true');
    if (genderFilter) params.set('genero', genderFilter);
    if (planFilter) params.set('plan', planFilter);
    if (barrioFilter) params.set('zona', barrioFilter);
    router.replace(`/doctores?${params.toString()}`, { scroll: false });
  }

  function resetFilters() {
    setSearch('');
    setSpecialty('');
    setOnlineOnly(false);
    setGenderFilter('');
    setPlanFilter('');
    setBarrioFilter('');
    setShowingNearby(false);
    setUserLocation(null);
    setPage(1);
  }

  const findNearby = useCallback(() => {
    if (!navigator.geolocation) { setNearbyError('Tu navegador no soporta geolocalización.'); return; }
    setNearbyLoading(true);
    setNearbyError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setShowingNearby(true);
        setSearch('');
        setSpecialty('');
        setOnlineOnly(false);
        setGenderFilter('');
        setPlanFilter('');
        setBarrioFilter('');
        setPage(1);
        setNearbyLoading(false);
      },
      (err) => {
        const msgs: Record<number, string> = {
          1: 'Permiso de ubicación denegado. Habilitalo en la configuración del navegador.',
          2: 'No se pudo obtener tu ubicación. Intentá de nuevo.',
          3: 'Tiempo de espera agotado. Intentá de nuevo.',
        };
        setNearbyError(msgs[err.code] ?? 'Error obteniendo ubicación.');
        setNearbyLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  const activeFilterCount =
    (specialty ? 1 : 0) + (onlineOnly ? 1 : 0) + (genderFilter ? 1 : 0) + (planFilter ? 1 : 0) + (barrioFilter ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero / Search bar */}
      <div className="bg-gradient-to-r from-[#011d2f] to-[#0a3a5c] py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Encontrá tu especialista</h1>
          <p className="mt-2 text-gray-300">Buscá entre nuestros profesionales verificados</p>

          <form onSubmit={handleSearch} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-white px-4 shadow-md">
              <svg className="h-5 w-5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Nombre, especialidad, zona..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full py-3 text-sm text-gray-900 placeholder-gray-400 outline-none"
              />
            </div>
            <select
              value={specialty}
              onChange={(e) => { setSpecialty(e.target.value); setPage(1); }}
              className="rounded-xl bg-white px-4 py-3 text-sm text-gray-700 shadow-md outline-none"
            >
              <option value="">Todas las especialidades</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.title}>{s.title}</option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-xl bg-[#e8910f] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#d4830d]"
            >
              Buscar
            </button>
          </form>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                showFilters || activeFilterCount ? 'bg-[#4dbad9]/10 text-[#4dbad9]' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4dbad9] text-xs text-white">{activeFilterCount}</span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-gray-600">Limpiar filtros</button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Nearby button */}
            {!showingNearby ? (
              <button
                onClick={findNearby}
                disabled={nearbyLoading}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
              >
                {nearbyLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#4dbad9]" />
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
                Cerca de mí
              </button>
            ) : (
              <button
                onClick={() => { setShowingNearby(false); setUserLocation(null); }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#4dbad9]/10 px-3 py-2 text-sm font-medium text-[#4dbad9] transition hover:bg-[#4dbad9]/20"
              >
                ✕ Ver todos
              </button>
            )}
            <span className="text-sm text-gray-500">{filtered.length} profesionales</span>
            {/* Map modal button */}
            <button
              onClick={() => setShowMapModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow-md"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Ver en Mapa
            </button>
          </div>
        </div>
      </div>

      {/* Nearby error */}
      {nearbyError && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{nearbyError}</div>
        </div>
      )}

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-gray-200 bg-white"
          >
            <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:grid-cols-2 lg:grid-cols-5 sm:px-6 lg:px-8">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Especialidad</label>
                <select value={specialty} onChange={(e) => { setSpecialty(e.target.value); setPage(1); }} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#4dbad9]">
                  <option value="">Todas</option>
                  {specialties.map((s) => (
                    <option key={s.id} value={s.title}>{s.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Género</label>
                <select value={genderFilter} onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#4dbad9]">
                  <option value="">Todos</option>
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Consulta online</label>
                <select value={onlineOnly ? 'true' : ''} onChange={(e) => { setOnlineOnly(e.target.value === 'true'); setPage(1); }} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#4dbad9]">
                  <option value="">Todos</option>
                  <option value="true">Solo consulta online</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Tipo de plan</label>
                <select value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#4dbad9]">
                  <option value="">Todos</option>
                  <option value="vip">Premium (Plus)</option>
                  <option value="plus">Plus (Medium)</option>
                  <option value="normal">Básico (Free)</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Zona / Barrio</label>
                <select value={barrioFilter} onChange={(e) => { setBarrioFilter(e.target.value); setPage(1); }} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#4dbad9]">
                  <option value="">Todas las zonas</option>
                  {barrioOptions.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nearby indicator */}
      {showingNearby && (
        <div className="border-b border-blue-100 bg-blue-50">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 sm:px-6 lg:px-8">
            <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
            <span className="text-sm font-medium text-blue-700">
              Mostrando {filtered.length} profesionales en un radio de {NEARBY_RADIUS_KM} km
            </span>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onReset={resetFilters} />
        ) : (
          <>
            {vipDoctors.length > 0 && (
              <DoctorSection title="Premium" badge="⭐" badgeColor="from-amber-500 to-yellow-400" doctors={vipDoctors} cardVariant="vip" showingNearby={showingNearby} />
            )}
            {plusDoctors.length > 0 && (
              <DoctorSection title="Plus" badge="💎" badgeColor="from-blue-500 to-cyan-400" doctors={plusDoctors} cardVariant="plus" showingNearby={showingNearby} />
            )}
            {normalDoctors.length > 0 && (
              <DoctorSection title="" badge="" badgeColor="" doctors={normalDoctors} cardVariant="normal" showingNearby={showingNearby} />
            )}

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40">
                  ← Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .map((p, idx, arr) => (
                    <span key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-gray-300">…</span>}
                      <button onClick={() => setPage(p)} className={`h-9 w-9 rounded-lg text-sm font-medium transition ${page === p ? 'bg-[#4dbad9] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{p}</button>
                    </span>
                  ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40">
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Map Modal (full-screen) */}
      <AnimatePresence>
        {showMapModal && (
          <DoctorsMapModal
            doctors={filtered}
            allDoctors={allDoctors}
            isLoaded={isLoaded}
            selectedMarker={selectedMarker}
            setSelectedMarker={setSelectedMarker}
            barrioFilter={mapBarrioFilter}
            setBarrioFilter={setMapBarrioFilter}
            showFilters={showMapFilters}
            setShowFilters={setShowMapFilters}
            barrioOptions={barrioOptions}
            userLocation={userLocation}
            onClose={() => setShowMapModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Full-screen Map Modal ─── */
function DoctorsMapModal({
  doctors,
  allDoctors,
  isLoaded,
  selectedMarker,
  setSelectedMarker,
  barrioFilter,
  setBarrioFilter,
  showFilters,
  setShowFilters,
  barrioOptions,
  userLocation,
  onClose,
}: {
  doctors: Doctor[];
  allDoctors: Doctor[];
  isLoaded: boolean;
  selectedMarker: Doctor | null;
  setSelectedMarker: (d: Doctor | null) => void;
  barrioFilter: string;
  setBarrioFilter: (b: string) => void;
  showFilters: boolean;
  setShowFilters: (s: boolean) => void;
  barrioOptions: { value: string; label: string; count: number }[];
  userLocation: { lat: number; lng: number } | null;
  onClose: () => void;
}) {
  const mapDoctors = useMemo(() => {
    return allDoctors.filter((d) => d.location?.latitude && d.location?.longitude);
  }, [allDoctors]);

  const center = useMemo(() => {
    if (barrioFilter && BARRIO_COORDINATES[barrioFilter]) return BARRIO_COORDINATES[barrioFilter];
    if (userLocation) return userLocation;
    if (mapDoctors.length > 0) {
      const avgLat = mapDoctors.reduce((s, d) => s + d.location.latitude, 0) / mapDoctors.length;
      const avgLng = mapDoctors.reduce((s, d) => s + d.location.longitude, 0) / mapDoctors.length;
      return { lat: avgLat, lng: avgLng };
    }
    return BUENOS_AIRES;
  }, [barrioFilter, userLocation, mapDoctors]);

  const zoom = barrioFilter ? 14 : 11;

  if (!isLoaded) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black/40 backdrop-blur-sm"
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 bg-[#011d2f]/95 px-4 py-3 text-white shadow-lg">
        <button onClick={onClose} className="rounded-lg p-2 transition hover:bg-white/10">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 className="flex-1 text-sm font-semibold">Mapa de profesionales</h2>

        {/* Barrio filter in map */}
        <select
          value={barrioFilter}
          onChange={(e) => setBarrioFilter(e.target.value)}
          className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white outline-none backdrop-blur [&>option]:text-gray-900"
        >
          <option value="">Todas las zonas</option>
          {barrioOptions.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${showFilters ? 'bg-[#4dbad9] text-white' : 'bg-white/10 text-white'}`}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          Filtros
        </button>
      </div>

      {/* Map */}
      <div className="relative flex-1">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={zoom}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            scrollwheel: true,
            gestureHandling: 'greedy',
            controlSize: 32,
          }}
        >
          {mapDoctors.map((doc) => (
            <Marker
              key={doc.id}
              position={{ lat: doc.location.latitude, lng: doc.location.longitude }}
              onClick={() => setSelectedMarker(doc)}
              icon={{
                path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                fillColor: getDoctorRank(doc) === 'vip' ? '#f59e0b' : getDoctorRank(doc) === 'plus' ? '#3b82f6' : '#64748b',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 1.5,
                anchor: typeof google !== 'undefined' ? new google.maps.Point(12, 22) : undefined,
              } as google.maps.Symbol}
            />
          ))}

          {/* User location marker */}
          {userLocation && (
            <Marker
              position={userLocation}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#3b82f6',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3,
                scale: 8,
              }}
              zIndex={999}
            />
          )}

          {selectedMarker && (
            <InfoWindow
              position={{ lat: selectedMarker.location.latitude, lng: selectedMarker.location.longitude }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="max-w-[260px] p-1">
                <div className="flex items-start gap-3">
                  {selectedMarker.profileImage && (
                    <img src={selectedMarker.profileImage} alt={selectedMarker.name} className="h-12 w-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{getDrTitle(selectedMarker.gender)} {selectedMarker.name}</p>
                    <p className="text-sm text-[#4dbad9]">{selectedMarker.specialty}</p>
                  </div>
                </div>
                {selectedMarker.location.formattedAddress && <p className="mt-1.5 text-xs text-gray-500">📍 {selectedMarker.location.formattedAddress}</p>}
                <div className="mt-2 flex items-center gap-2">
                  <Link href={`/doctores/${selectedMarker.slug ?? selectedMarker.id}`} className="rounded-lg bg-[#e8910f] px-3 py-1 text-xs font-semibold text-white hover:bg-[#d4830d]">
                    Ver perfil
                  </Link>
                  {selectedMarker.phone && (
                    <a
                      href={`https://wa.me/${selectedMarker.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, me gustaría agendar una consulta.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-green-500 px-3 py-1 text-xs font-semibold text-white hover:bg-green-600"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* Bottom drawer */}
        <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white/95 px-4 py-3 shadow-2xl backdrop-blur">
          <div className="mx-auto max-w-lg">
            <div className="mb-1 flex items-center justify-center">
              <div className="h-1 w-8 rounded-full bg-gray-300" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{mapDoctors.length} profesionales</span>
              {barrioFilter && (
                <button onClick={() => setBarrioFilter('')} className="text-xs text-[#4dbad9] hover:underline">Limpiar zona</button>
              )}
            </div>
            {/* Legend */}
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] text-gray-500"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />Premium</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-gray-500"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" />Plus</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-gray-500"><span className="h-2.5 w-2.5 rounded-full bg-slate-500" />Básico</span>
              {userLocation && <span className="inline-flex items-center gap-1 text-[10px] text-gray-500"><span className="h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-blue-200" />Tu ubicación</span>}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Doctor Section (grouped by plan) ─── */
function DoctorSection({ title, badge, badgeColor, doctors, cardVariant, showingNearby }: { title: string; badge: string; badgeColor: string; doctors: Doctor[]; cardVariant: Rank; showingNearby: boolean }) {
  return (
    <div className="mb-8">
      {title && (
        <div className="mb-4 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${badgeColor} px-3 py-1 text-xs font-semibold text-white shadow-sm`}>
            {badge} {title}
          </span>
        </div>
      )}
      <div className={`grid gap-5 ${cardVariant === 'vip' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
        {doctors.map((doc, i) => (
          <motion.div key={doc.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <DoctorCard doctor={doc} variant={cardVariant} showDistance={showingNearby} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── Doctor Card ─── */
function DoctorCard({ doctor, variant, showDistance }: { doctor: Doctor; variant: Rank; showDistance: boolean }) {
  const title = getDrTitle(doctor.gender);

  const styles = {
    vip: {
      ring: 'ring-2 ring-amber-300/50',
      bg: 'bg-gradient-to-br from-amber-50 via-white to-amber-50/30',
      shadow: 'shadow-xl hover:shadow-2xl',
      nameColor: 'bg-gradient-to-r from-amber-700 to-amber-600 bg-clip-text text-transparent',
      nameSize: 'text-xl lg:text-2xl',
      specBadge: 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800 border border-amber-200/50',
      imgSize: 'h-36 w-36',
      showDesc: true,
      showWhatsApp: true,
      badge: (
        <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-2.5 py-1 text-xs font-bold text-white shadow-md">
          ⭐ PREMIUM
        </span>
      ),
    },
    plus: {
      ring: 'ring-1 ring-blue-200/50',
      bg: 'bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30',
      shadow: 'shadow-lg hover:shadow-xl',
      nameColor: 'text-blue-800',
      nameSize: 'text-lg lg:text-xl',
      specBadge: 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border border-blue-200/50',
      imgSize: 'h-20 w-20',
      showDesc: true,
      showWhatsApp: true,
      badge: (
        <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
          💎 PLUS
        </span>
      ),
    },
    normal: {
      ring: 'ring-1 ring-slate-100',
      bg: 'bg-white',
      shadow: 'shadow-md hover:shadow-lg',
      nameColor: 'text-blue-700',
      nameSize: 'text-base',
      specBadge: 'bg-slate-50 text-slate-700 border border-slate-200',
      imgSize: 'h-14 w-14',
      showDesc: false,
      showWhatsApp: false,
      badge: null,
    },
  } as const;

  const s = styles[variant];

  return (
    <div className={`group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 ${s.ring} ${s.bg} ${s.shadow}`}>
      {s.badge}
      <div className={`flex items-start gap-4 ${variant === 'vip' ? 'flex-col items-center text-center sm:flex-row sm:items-start sm:text-left' : ''}`}>
        {(variant !== 'normal' || doctor.profileImage) && (
          <div className={`shrink-0 overflow-hidden rounded-xl ${s.imgSize}`}>
            {doctor.profileImage ? (
              <img src={doctor.profileImage} alt={doctor.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
            ) : null}
            <div className={`flex h-full w-full items-center justify-center bg-[#4dbad9]/10 text-lg font-bold text-[#4dbad9]${doctor.profileImage ? ' hidden' : ''}`}>
              {doctor.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className={`font-bold ${s.nameSize} ${s.nameColor} leading-tight`}>
            {title} {doctor.name}
          </h3>
          <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${s.specBadge}`}>
            {doctor.specialty}
          </span>
          {doctor.location?.formattedAddress && (
            <p className="mt-1.5 truncate text-xs text-gray-500">📍 {doctor.location.formattedAddress}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {showDistance && doctor._distance != null && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                📍 {doctor._distance.toFixed(1)} km
              </span>
            )}
            {doctor.onlineConsultation && (
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">🖥 Consulta Online</span>
            )}
            {doctor.verified && variant !== 'normal' && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">✓ Verificado</span>
            )}
          </div>
          {s.showDesc && doctor.description && (
            <p className="mt-2 text-sm leading-relaxed text-gray-600 line-clamp-2">{doctor.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {s.showWhatsApp && doctor.phone && (
              <a
                href={`https://wa.me/${doctor.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${title} ${doctor.name}, me gustaría agendar una consulta.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:shadow-md"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.11.546 4.095 1.504 5.82L0 24l6.335-1.652A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.87 0-3.627-.508-5.134-1.392l-.368-.218-3.812.999 1.016-3.712-.239-.379A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                WhatsApp
              </a>
            )}
            {doctor.phone && (
              <a href={`tel:${doctor.phone}`} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:shadow-md">
                📞 Llamar
              </a>
            )}
            <Link
              href={`/doctores/${doctor.slug ?? doctor.id}`}
              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:bg-gray-50 ${
                variant === 'vip' ? 'border-amber-300 text-amber-700' : variant === 'plus' ? 'border-blue-300 text-blue-700' : 'border-slate-200 text-slate-600'
              }`}
            >
              Ver perfil →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Empty State ─── */
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="py-20 text-center">
      <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <h3 className="mt-4 text-lg font-semibold text-gray-700">No se encontraron resultados</h3>
      <p className="mt-1 text-sm text-gray-500">Intentá con otros filtros de búsqueda</p>
      <button onClick={onReset} className="mt-4 rounded-xl bg-[#4dbad9] px-5 py-2 text-sm font-medium text-white hover:bg-[#3da8c5]">Limpiar filtros</button>
    </div>
  );
}
