import React, { useState, useEffect } from "react";
import NavBar from "../../components/NavBar";
import FloatingSearch from "../../components/FloatingSearch";
import LoaderComponent from "../../components/doctoresPage/LoaderComponent";
import RankSection from "../../components/doctoresPage/RankSection";
import PaginationControls from "../../components/doctoresPage/PaginationControls";
import NearbyDoctorsButton from "../../components/doctoresPage/NearbyDoctorsButton";
import DoctorsMapPanel from "../../components/doctoresPage/DoctorsMapPanel";
import MapToggleButton from "../../components/doctoresPage/MapToggleButton";
import { getAllDoctors } from "../../lib/doctorsService";
import { getDoctorRank } from "../../lib/subscriptionUtils";
import { normalizeGenderArray, normalizeGenero } from "../../lib/dataUtils";
import Link from "next/link";
import Footer from "../../components/Footer";
import { useRouter } from "next/router";

// Constants
const DOCTORS_PER_PAGE = 20;

export default function DoctoresPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("");
  const [selectedGenero, setSelectedGenero] = useState("");
  const [selectedConsultaOnline, setSelectedConsultaOnline] = useState("");
  const [selectedRango, setSelectedRango] = useState("");
  const [selectedUbicacion, setSelectedUbicacion] = useState("");
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
  const ubicaciones = [...new Set(doctoresData.map((d) => d.ubicacion))].sort();
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
      id: "ubicacion",
      label: "Ubicación",
      value: selectedUbicacion,
      setter: setSelectedUbicacion,
      options: ubicaciones,
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

  const filteredDoctors = doctorsToShow.filter((d) => {
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
    
    const ubicacionMatch =
      selectedUbicacion === "" || d.ubicacion === selectedUbicacion;
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
      ubicacionMatch &&
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
    selectedUbicacion,
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
    selectedUbicacion,
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
    <div>
      <NavBar />

      <main className="pb-24">
        {/* Enhanced Hero Section */}
        <div className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-white to-blue-50/30"></div>

          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-100/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          {/* Content */}
          <div className="relative mx-auto max-w-7xl px-6 pt-12 pb-8 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              {/* Main heading with gradient */}
              <h1 className="mb-8 text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-cyan-700 to-blue-600 sm:text-5xl lg:text-6xl">
                {showingNearby
                  ? "Doctores cerca de ti"
                  : "Encuentra tu especialista médico"}
              </h1>

              {/* Subtitle with better styling */}
              <p className="mb-8 text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                {showingNearby
                  ? "Profesionales de la salud cerca de tu ubicación actual"
                  : "Conecta con los mejores especialistas médicos disponibles en la plataforma"}
              </p>

              {showingNearby && nearbyDoctors ? (
                <div className="mb-6 space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100/80 text-cyan-800 rounded-full text-sm font-medium">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                    {nearbyDoctors.length} doctores encontrados en un radio de 25km
                  </div>
                  <div className="flex justify-center">
                    <NearbyDoctorsButton onReset={handleResetToAllDoctors} />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <div className="flex items-center gap-2 text-lg text-slate-600">
                      <span className="text-2xl">👨‍⚕️</span>
                      <span className="font-medium">
                        {doctoresData.length > 0
                          ? `${doctoresData.length} profesionales disponibles`
                          : "Cargando profesionales..."}
                      </span>
                    </div>
                    {doctoresData.length > 0 && (
                      <div className="h-6 w-px bg-slate-300 hidden sm:block"></div>
                    )}
                    <div className="flex justify-center">
                      <NearbyDoctorsButton
                        onNearbyDoctorsFound={handleNearbyDoctorsFound}
                      />
                    </div>
                  </div>

                  {/* Stats badges */}
                  {doctoresData.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-3 mt-6">
                      <div className="px-3 py-1 bg-gradient-to-r from-cyan-100 to-cyan-200 text-cyan-800 rounded-full text-sm font-medium border border-cyan-200/50">
                        Especialidades médicas
                      </div>
                      <div className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-full text-sm font-medium border border-blue-200/50">
                        Consulta online
                      </div>
                      <div className="px-3 py-1 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 rounded-full text-sm font-medium border border-purple-200/50">
                        Ubicaciones múltiples
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                <div className="text-8xl mb-4 opacity-20">🩺</div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-full flex items-center justify-center">
                    <div className="text-4xl opacity-60">🔍</div>
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
                    <span>👨‍⚕️</span>
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
                        setSelectedUbicacion("");
                        setSelectedPrepaga("");
                        setCurrentPage(1);
                      }}
                      className="inline-flex items-center gap-3 px-6 py-3 border border-cyan-200 text-cyan-700 bg-cyan-50 hover:bg-cyan-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 rounded-xl font-medium transition-all duration-300"
                    >
                      <span>🔄</span>
                      Limpiar filtros
                    </button>
                    <Link
                      href="/auth/register"
                      className="inline-flex items-center gap-3 px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <span>👨‍⚕️</span>
                      Unirse como Doctor
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Map Panel */}
      <DoctorsMapPanel
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
  );
}
