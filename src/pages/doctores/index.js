import React, { useState, useEffect } from "react";
import NavBar from "../../components/NavBar";
import FloatingSearch from "../../components/FloatingSearch";
import LoaderComponent from "../../components/doctoresPage/LoaderComponent";
import RankSection from "../../components/doctoresPage/RankSection";
import PaginationControls from "../../components/doctoresPage/PaginationControls";
import NearbyDoctorsButton from "../../components/doctoresPage/NearbyDoctorsButton";
import DoctorsMapModal from "../../components/doctoresPage/DoctorsMapModal";
import MapToggleButton from "../../components/doctoresPage/MapToggleButton";
import { LoadScript } from '@react-google-maps/api';
import { getAllDoctors } from "../../lib/doctorsService";
import { getDoctorRank } from "../../lib/subscriptionUtils";
import { normalizeGenderArray, normalizeGenero } from "../../lib/dataUtils";
import Link from "next/link";
import Footer from "../../components/Footer";
import { useRouter } from "next/router";
import { getBarrioFilterOptions, filterDoctorsByBarrio } from "../../lib/barriosUtils";

// Constants
const DOCTORS_PER_PAGE = 20;

export default function DoctoresPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("");
  const [selectedGenero, setSelectedGenero] = useState("");
  const [selectedConsultaOnline, setSelectedConsultaOnline] = useState("");
  const [selectedRango, setSelectedRango] = useState("");
  const [selectedBarrio, setSelectedBarrio] = useState("");
  const [selectedPrepaga, setSelectedPrepaga] = useState("");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [doctoresData, setDoctoresData] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [nearbyDoctors, setNearbyDoctors] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showingNearby, setShowingNearby] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  // Read search parameter from URL
  useEffect(() => {
    if (router.isReady && router.query.search) {
      setSearch(router.query.search);
    }
  }, [router.isReady, router.query.search]);

  // Load doctors from Firebase
  useEffect(() => {
    async function loadDoctors() {
      try {
        setInitialLoading(true);
        const doctors = await getAllDoctors();
        // Only show verified doctors
        const verifiedDoctors = doctors.filter(
          (doctor) => doctor.verified === true
        );
        
        // Debug logging for location data
        console.log('Doctors loaded:', {
          total: doctors.length,
          verified: verifiedDoctors.length,
          withLocation: verifiedDoctors.filter(d => d.latitude && d.longitude).length,
          sampleDoctorWithLocation: verifiedDoctors.find(d => d.latitude && d.longitude),
          sampleDoctorWithoutLocation: verifiedDoctors.find(d => !d.latitude || !d.longitude)
        });
        
        setDoctoresData(verifiedDoctors);
      } catch (error) {
        console.error("Error loading doctors:", error);
        setDoctoresData([]);
      } finally {
        setInitialLoading(false);
      }
    }

    loadDoctors();
  }, []);

  // Create filters from loaded data
  const categorias = [
    ...new Set(doctoresData.map((d) => d.especialidad)),
  ].sort();
  
  // Use utility function to normalize gender values
  const generos = normalizeGenderArray(doctoresData.map((d) => d.genero));
  const rangos = [
    { value: "VIP", label: "Plan Plus (Premium)" },
    { value: "Intermedio", label: "Plan Medium" }, 
    { value: "Normal", label: "Plan Free (Básico)" }
  ];
  // Get barrio filter options instead of individual locations
  const barrioOptions = getBarrioFilterOptions(doctoresData);
  const prepagas = [
    ...new Set(doctoresData.flatMap((d) => d.prepagas || [])),
  ].sort();

  const filters = [
    {
      id: "categoria",
      label: "Especialidad",
      value: categoria,
      setter: setCategoria,
      options: categorias,
    },
    {
      id: "genero",
      label: "Género",
      value: selectedGenero,
      setter: setSelectedGenero,
      options: generos,
    },
    {
      id: "consultaOnline",
      label: "Consulta Online",
      value: selectedConsultaOnline,
      setter: setSelectedConsultaOnline,
      options: [
        { value: "true", label: "Sí" },
        { value: "false", label: "No" },
      ],
    },
    {
      id: "ageGroup",
      label: "Grupo de Edad",
      value: selectedAgeGroup,
      setter: setSelectedAgeGroup,
      options: [
        { value: "menores", label: "Solo Menores" },
        { value: "adultos", label: "Solo Adultos" },
        { value: "ambos", label: "Menores y Adultos" },
      ],
      iconPath:
        "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    },
    {
      id: "rango",
      label: "Plan de Suscripción",
      value: selectedRango,
      setter: setSelectedRango,
      options: rangos,
    },
    {
      id: "barrio",
      label: "Zona/Barrio",
      value: selectedBarrio,
      setter: setSelectedBarrio,
      options: barrioOptions,
    },
    {
      id: "prepaga",
      label: "Prepaga",
      value: selectedPrepaga,
      setter: setSelectedPrepaga,
      options: prepagas,
      iconPath:
        "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    },
  ];

  // Handler for nearby doctors
  const handleNearbyDoctorsFound = (doctors, location) => {
    setNearbyDoctors(doctors);
    setUserLocation(location);
    setShowingNearby(true);
    // Reset filters when showing nearby results
    setSearch("");
    setCategoria("");
    setSelectedGenero("");
    setSelectedConsultaOnline("");
    setSelectedAgeGroup("");
    setSelectedRango("");
    setSelectedUbicacion("");
    setSelectedPrepaga("");
    setCurrentPage(1);
  };

  const handleResetToAllDoctors = () => {
    setNearbyDoctors(null);
    setUserLocation(null);
    setShowingNearby(false);
    setCurrentPage(1);
  };

  // Map functionality
  const handleToggleMap = () => {
    setIsMapOpen(!isMapOpen);
  };

  const handleCloseMap = () => {
    setIsMapOpen(false);
  };

  // Use nearby doctors if available, otherwise use filtered doctors
  const doctorsToShow = showingNearby ? nearbyDoctors : doctoresData;

  // Filter by barrio if selected
  let doctorsFilteredByBarrio = doctorsToShow;
  if (selectedBarrio && selectedBarrio !== "") {
    doctorsFilteredByBarrio = filterDoctorsByBarrio(doctorsToShow, selectedBarrio);
  }

  const filteredDoctors = doctorsFilteredByBarrio.filter((d) => {
    const searchMatch =
      d.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      d.especialidad?.toLowerCase().includes(search.toLowerCase());
    const categoriaMatch = categoria === "" || d.especialidad === categoria;
    
    // Use utility function to normalize doctor's gender for comparison
    const generoMatch = selectedGenero === "" || normalizeGenero(d.genero) === selectedGenero;
    
    const consultaOnlineMatch =
      selectedConsultaOnline === "" ||
      (selectedConsultaOnline === "true" && d.consultaOnline) ||
      (selectedConsultaOnline === "false" && !d.consultaOnline);
    const ageGroupMatch =
      selectedAgeGroup === "" ||
      d.ageGroup === selectedAgeGroup ||
      (!d.ageGroup && selectedAgeGroup === "ambos"); // Default to "ambos" for doctors without ageGroup set
    
    // Usar la nueva función para obtener el rango
    const doctorRank = getDoctorRank(d);
    const rangoMatch = selectedRango === "" || doctorRank === selectedRango;
    
    const prepagaMatch =
      selectedPrepaga === "" ||
      (d.prepagas && d.prepagas.includes(selectedPrepaga));

    return (
      searchMatch &&
      categoriaMatch &&
      generoMatch &&
      consultaOnlineMatch &&
      ageGroupMatch &&
      rangoMatch &&
      prepagaMatch
    );
  });

  const handlePageChange = (newPage) => {
    setIsLoading(true);
    setCurrentPage(newPage);
    setTimeout(() => setIsLoading(false), 300);
  };

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [
    search,
    categoria,
    selectedGenero,
    selectedConsultaOnline,
    selectedAgeGroup,
    selectedRango,
    selectedBarrio,
    selectedPrepaga,
  ]);

  // Ordenar los doctores filtrados: primero todos los premium (VIP), luego intermedio, luego normal
  const sortedFilteredDoctors = filteredDoctors.sort((a, b) => {
    const rankA = getDoctorRank(a);
    const rankB = getDoctorRank(b);
    
    // Definir el orden de prioridad: VIP (premium) primero, luego Intermedio, luego Normal
    const rankOrder = { "VIP": 0, "Intermedio": 1, "Normal": 2 };
    
    return rankOrder[rankA] - rankOrder[rankB];
  });

  const totalPages = Math.ceil(sortedFilteredDoctors.length / DOCTORS_PER_PAGE);
  const startIndex = (currentPage - 1) * DOCTORS_PER_PAGE;
  const endIndex = startIndex + DOCTORS_PER_PAGE;
  const currentDoctors = sortedFilteredDoctors.slice(startIndex, endIndex);

  const vipDoctors = currentDoctors.filter((d) => getDoctorRank(d) === "VIP");
  const intermedioDoctors = currentDoctors.filter(
    (d) => getDoctorRank(d) === "Intermedio"
  );
  const normalDoctors = currentDoctors.filter(
    (d) => getDoctorRank(d) === "Normal"
  );

  // Count doctors with location data
  const doctorsWithLocation = sortedFilteredDoctors.filter(doctor => 
    doctor.latitude && doctor.longitude && !isNaN(doctor.latitude) && !isNaN(doctor.longitude)
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    categoria,
    selectedGenero,
    selectedConsultaOnline,
    selectedAgeGroup,
    selectedRango,
    selectedBarrio,
    selectedPrepaga,
  ]);

  // Show initial loading screen
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-cyan-100">
        <NavBar />
        <div className="container mx-auto px-6 py-24">
          <LoaderComponent />
        </div>
      </div>
    );
  }

  return (
    <LoadScript 
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
      libraries={['places']}
      loadingElement={<div>Cargando Google Maps...</div>}
    >
      <div>
        <NavBar />

        <main className="pb-24">
        {/* Compact Hero Section */}
        <div className="relative bg-gradient-to-br from-cyan-50/30 via-white to-blue-50/20">
          {/* Content */}
          <div className="mx-auto max-w-7xl px-6 pt-8 pb-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Title and main info - more compact */}
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
                  {showingNearby ? "Doctores cerca de ti" : "Especialistas médicos"}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                    <span>{doctoresData.length > 0 ? `${doctoresData.length} profesionales` : "Cargando..."}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Consulta online disponible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Múltiples ubicaciones</span>
                  </div>
                </div>
              </div>

              {/* Action buttons - more prominent */}
              <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
                {showingNearby && nearbyDoctors ? (
                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-100 text-cyan-800 rounded-lg text-sm font-medium">
                      <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                      {nearbyDoctors.length} doctores en 25km
                    </div>
                    <NearbyDoctorsButton onReset={handleResetToAllDoctors} />
                  </div>
                ) : (
                  <NearbyDoctorsButton onNearbyDoctorsFound={handleNearbyDoctorsFound} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search Component */}
        <FloatingSearch
          search={search}
          setSearch={setSearch}
          filters={filters}
        />

        {/* Results Section */}
        <div className="space-y-20 container mx-auto px-6 lg:px-8">
          {isLoading ? (
            <LoaderComponent />
          ) : sortedFilteredDoctors.length > 0 ? (
            <div className="space-y-16">
              {vipDoctors.length > 0 && (
                <div
                  className="animate-fadeIn"
                  style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
                >
                  <RankSection doctors={vipDoctors} index={0} />
                </div>
              )}
              {intermedioDoctors.length > 0 && (
                <div
                  className="animate-fadeIn"
                  style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
                >
                  <RankSection doctors={intermedioDoctors} index={1} />
                </div>
              )}
              {normalDoctors.length > 0 && (
                <div
                  className="animate-fadeIn"
                  style={{ animationDelay: '0.5s', animationFillMode: 'both' }}
                >
                  <RankSection doctors={normalDoctors} index={2} />
                </div>
              )}

              {totalPages > 1 && (
                <div
                  className="animate-fadeIn pt-8"
                  style={{ animationDelay: '0.7s', animationFillMode: 'both' }}
                >
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-24 px-4">
              <div className="relative mb-8">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full opacity-60"></div>
                  </div>
                </div>
              </div>

              <h3 className="text-3xl font-bold text-slate-800 mb-4">
                {doctoresData.length === 0
                  ? "No hay doctores registrados aún"
                  : "No se encontraron doctores"}
              </h3>

              <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
                {doctoresData.length === 0
                  ? "Sé el primero en registrarte como profesional de la salud y forma parte de nuestra comunidad médica."
                  : "Intenta ajustar los filtros de búsqueda o amplía tu área de búsqueda para encontrar el especialista que necesitas."}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {doctoresData.length === 0 ? (
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center gap-3 px-8 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <div className="w-4 h-4 bg-white rounded-full opacity-80"></div>
                    Registrarse como Doctor
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setSearch("");
                        setCategoria("");
                        setSelectedGenero("");
                        setSelectedConsultaOnline("");
                        setSelectedAgeGroup("");
                        setSelectedRango("");
                        setSelectedBarrio("");
                        setSelectedPrepaga("");
                        setCurrentPage(1);
                      }}
                      className="inline-flex items-center gap-3 px-6 py-3 border border-cyan-200 text-cyan-700 bg-cyan-50 hover:bg-cyan-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 rounded-xl font-medium transition-all duration-300"
                    >
                      <div className="w-3 h-3 border-2 border-cyan-500 rounded-full animate-spin border-t-transparent"></div>
                      Limpiar filtros
                    </button>
                    <Link
                      href="/auth/register"
                      className="inline-flex items-center gap-3 px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <div className="w-4 h-4 bg-white rounded-full opacity-80"></div>
                      Unirse como Doctor
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Map Modal */}
      <DoctorsMapModal
        isOpen={isMapOpen}
        onClose={handleCloseMap}
        doctors={sortedFilteredDoctors}
        userLocation={userLocation}
      />

      {/* Map Toggle Button */}
      <MapToggleButton
        onClick={handleToggleMap}
        isMapOpen={isMapOpen}
        doctorsCount={doctorsWithLocation.length}
      />

      <Footer />
    </div>
    </LoadScript>
  );
}
