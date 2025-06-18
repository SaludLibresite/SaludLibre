import React, { useState, useEffect } from "react";
import NavBar from "../../components/NavBar";
import FloatingSearch from "../../components/FloatingSearch";
import LoaderComponent from "../../components/doctoresPage/LoaderComponent";
import RankSection from "../../components/doctoresPage/RankSection";
import PaginationControls from "../../components/doctoresPage/PaginationControls";
import { getAllDoctors } from "../../lib/doctorsService";

// Constants
const DOCTORS_PER_PAGE = 20;

export default function DoctoresPage() {
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("");
  const [selectedGenero, setSelectedGenero] = useState("");
  const [selectedConsultaOnline, setSelectedConsultaOnline] = useState("");
  const [selectedRango, setSelectedRango] = useState("");
  const [selectedUbicacion, setSelectedUbicacion] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [doctoresData, setDoctoresData] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load doctors from Firebase
  useEffect(() => {
    async function loadDoctors() {
      try {
        setInitialLoading(true);
        const doctors = await getAllDoctors();
        // Only show verified doctors or add a verification flag check
        // const verifiedDoctors = doctors.filter(
        //   (doctor) => doctor.verified !== false
        // );
        // setDoctoresData(verifiedDoctors);

        // TEMPORAL: Mostrar todos los doctores para desarrollo
        // Cambiar a verifiedDoctors cuando esté en producción
        setDoctoresData(doctors);
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
  const generos = [...new Set(doctoresData.map((d) => d.genero))].sort();
  const rangos = ["VIP", "Intermedio", "Normal"];
  const ubicaciones = [...new Set(doctoresData.map((d) => d.ubicacion))].sort();

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
      id: "rango",
      label: "Rango",
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
  ];

  const filteredDoctors = doctoresData.filter((d) => {
    const searchMatch =
      d.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      d.especialidad?.toLowerCase().includes(search.toLowerCase());
    const categoriaMatch = categoria === "" || d.especialidad === categoria;
    const generoMatch = selectedGenero === "" || d.genero === selectedGenero;
    const consultaOnlineMatch =
      selectedConsultaOnline === "" ||
      (selectedConsultaOnline === "true" && d.consultaOnline) ||
      (selectedConsultaOnline === "false" && !d.consultaOnline);
    const rangoMatch = selectedRango === "" || d.rango === selectedRango;
    const ubicacionMatch =
      selectedUbicacion === "" || d.ubicacion === selectedUbicacion;

    return (
      searchMatch &&
      categoriaMatch &&
      generoMatch &&
      consultaOnlineMatch &&
      rangoMatch &&
      ubicacionMatch
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
    selectedRango,
    selectedUbicacion,
  ]);

  const totalPages = Math.ceil(filteredDoctors.length / DOCTORS_PER_PAGE);
  const startIndex = (currentPage - 1) * DOCTORS_PER_PAGE;
  const endIndex = startIndex + DOCTORS_PER_PAGE;
  const currentDoctors = filteredDoctors.slice(startIndex, endIndex);

  const vipDoctors = currentDoctors.filter((d) => d.rango === "VIP");
  const intermedioDoctors = currentDoctors.filter(
    (d) => d.rango === "Intermedio"
  );
  const normalDoctors = currentDoctors.filter(
    (d) => d.rango === "Normal" || !d.rango
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    categoria,
    selectedGenero,
    selectedConsultaOnline,
    selectedRango,
    selectedUbicacion,
  ]);

  // Show initial loading screen
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100">
        <NavBar
          links={[
            { href: "/", label: "Inicio" },
            { href: "/doctores", label: "Doctores" },
            { href: "/beneficios", label: "Beneficios" },
          ]}
          button={{ text: "Iniciar Sesión", href: "/auth/login" }}
        />
        <div className="container mx-auto px-6 py-24">
          <LoaderComponent />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100">
      <NavBar
        links={[
          { href: "/", label: "Inicio" },
          { href: "/doctores", label: "Doctores" },
          { href: "/beneficios", label: "Beneficios" },
        ]}
        button={{ text: "Iniciar Sesión", href: "/auth/login" }}
      />

      <main className="pb-24">
        {/* Hero Section */}
        <div className="relative">
          {/* Content */}
          <div className="mx-auto max-w-7xl px-6 pt-8 pb-4 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              {/* Main heading */}
              <h1 className="mb-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Encuentra tu especialista médico
              </h1>
              <p className="text-lg text-slate-600">
                {doctoresData.length > 0
                  ? `${doctoresData.length} profesionales de la salud disponibles`
                  : "Cargando profesionales..."}
              </p>
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
                <a
                  href="/auth/register"
                  className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Registrarse como Doctor
                </a>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
