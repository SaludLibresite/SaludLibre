import React, { useState, useEffect } from "react";
import NavBar from "../../components/NavBar";
import FloatingSearch from "../../components/FloatingSearch";
import LoaderComponent from "../../components/doctoresPage/LoaderComponent";
import RankSection from "../../components/doctoresPage/RankSection";
import PaginationControls from "../../components/doctoresPage/PaginationControls";
import NearbyDoctorsButton from "../../components/doctoresPage/NearbyDoctorsButton";
import { getAllDoctors } from "../../lib/doctorsService";
import { getDoctorRank } from "../../lib/subscriptionUtils";
import { normalizeGenderArray, normalizeGenero } from "../../lib/dataUtils";
import { getActiveZones, groupDoctorsByZones } from "../../lib/zonesService";
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
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedPrepaga, setSelectedPrepaga] = useState("");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [doctoresData, setDoctoresData] = useState([]);
  const [zones, setZones] = useState([]);
  const [doctorsByZone, setDoctorsByZone] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [nearbyDoctors, setNearbyDoctors] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showingNearby, setShowingNearby] = useState(false);

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

        // Load zones and group doctors by zones
        try {
          const activeZones = await getActiveZones();
          setZones(activeZones);
          
          const groupedDoctors = await groupDoctorsByZones(verifiedDoctors);
          setDoctorsByZone(groupedDoctors);
        } catch (zoneError) {
          console.error("Error loading zones:", zoneError);
          // If zones fail to load, we'll still show all doctors
          setZones([]);
          setDoctorsByZone({});
        }
      } catch (error) {
        console.error("Error loading doctors:", error);
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
  
  // Use zones for location filter, fallback to individual locations if zones not available
  const zoneOptions = zones.length > 0 
    ? zones.map(zone => ({ value: zone.name, label: `${zone.name} (${doctorsByZone[zone.name]?.length || 0} doctores)` }))
    : [];
  
  // Fallback to individual locations if no zones are available
  const ubicaciones = zones.length === 0 
    ? [...new Set(doctoresData.map((d) => d.ubicacion))].sort()
    : [];
    
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
    // Conditionally show zone or individual location filter
    ...(zones.length > 0 ? [{
      id: "zone",
      label: "Zona",
      value: selectedZone,
      setter: setSelectedZone,
      options: zoneOptions,
    }] : [{
      id: "ubicacion",
      label: "Ubicación",
      value: selectedUbicacion,
      setter: setSelectedUbicacion,
      options: ubicaciones,
    }]),
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
    setSelectedZone("");
    setSelectedPrepaga("");
    setCurrentPage(1);
  };

  const handleResetToAllDoctors = () => {
    setNearbyDoctors(null);
    setUserLocation(null);
    setShowingNearby(false);
    setCurrentPage(1);
  };

  const handleResetAllFilters = () => {
    setSearch("");
    setCategoria("");
    setSelectedGenero("");
    setSelectedConsultaOnline("");
    setSelectedAgeGroup("");
    setSelectedRango("");
    setSelectedUbicacion("");
    setSelectedZone("");
    setSelectedPrepaga("");
    setCurrentPage(1);
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
    
    // Zone or location match based on what's available
    let locationMatch = true;
    if (zones.length > 0 && selectedZone !== "") {
      // Use zone-based filtering
      locationMatch = doctorsByZone[selectedZone]?.some(zoneDoctor => zoneDoctor.id === d.id) || false;
    } else if (zones.length === 0 && selectedUbicacion !== "") {
      // Fallback to individual location filtering
      locationMatch = d.ubicacion === selectedUbicacion;
    }
    
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
      locationMatch &&
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

  const totalPages = Math.ceil(filteredDoctors.length / DOCTORS_PER_PAGE);
  const startIndex = (currentPage - 1) * DOCTORS_PER_PAGE;
  const endIndex = startIndex + DOCTORS_PER_PAGE;
  const currentDoctors = filteredDoctors.slice(startIndex, endIndex);

  const vipDoctors = currentDoctors.filter((d) => getDoctorRank(d) === "VIP");
  const intermedioDoctors = currentDoctors.filter(
    (d) => getDoctorRank(d) === "Intermedio"
  );
  const normalDoctors = currentDoctors.filter(
    (d) => getDoctorRank(d) === "Normal"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100">
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
        {/* Hero Section */}
        <div className="relative">
          {/* Content */}
          <div className="mx-auto max-w-7xl px-6 pt-8 pb-4 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              {/* Main heading */}
              <h1 className="mb-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {showingNearby
                  ? "Doctores cerca de tu ubicación"
                  : "Encuentra tu especialista médico"}
              </h1>

              {showingNearby && nearbyDoctors ? (
                <div className="mb-4">
                  <p className="text-lg text-slate-600 mb-2">
                    {nearbyDoctors.length} doctores encontrados en un radio de
                    25km
                  </p>
                  <div className="flex justify-center">
                    <NearbyDoctorsButton onReset={handleResetToAllDoctors} />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-lg text-slate-600">
                    {doctoresData.length > 0
                      ? `${doctoresData.length} profesionales de la salud disponibles`
                      : "Cargando profesionales..."}
                  </p>
                  <div className="flex justify-center">
                    <NearbyDoctorsButton
                      onNearbyDoctorsFound={handleNearbyDoctorsFound}
                    />
                  </div>
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
          onResetFilters={handleResetAllFilters}
        />

        {/* Results Section */}
        <div className="space-y-16 container mx-auto">
          {isLoading ? (
            <LoaderComponent />
          ) : filteredDoctors.length > 0 ? (
            <>
              {vipDoctors.length > 0 && (
                <RankSection doctors={vipDoctors} index={0} />
              )}
              {intermedioDoctors.length > 0 && (
                <RankSection doctors={intermedioDoctors} index={1} />
              )}
              {normalDoctors.length > 0 && (
                <RankSection doctors={normalDoctors} index={2} />
              )}

              {totalPages > 1 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          ) : (
            <div className="text-center py-20 px-4">
              <div className="text-7xl mb-8 opacity-50">🩺</div>
              <h3 className="text-3xl font-semibold text-slate-800 mb-3">
                {doctoresData.length === 0
                  ? "No hay doctores registrados aún"
                  : "No se encontraron doctores"}
              </h3>
              <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
                {doctoresData.length === 0
                  ? "Sé el primero en registrarte como profesional de la salud."
                  : "Intenta ajustar los filtros de búsqueda para encontrar el especialista que necesitas."}
              </p>
              {doctoresData.length === 0 && (
                <Link
                  href="/auth/register"
                  className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Registrarse como Doctor
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
