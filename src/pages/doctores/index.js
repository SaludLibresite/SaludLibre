import React, { useState, useEffect } from "react";
import NavBar from "../../components/NavBar";
import doctoresData from "../../data/doctores.json";
import FloatingSearch from "../../components/FloatingSearch";
import LoaderComponent from "../../components/doctoresPage/LoaderComponent";
import DoctorCard from "../../components/doctoresPage/DoctorCard";
import RankSection from "../../components/doctoresPage/RankSection";
import PaginationControls from "../../components/doctoresPage/PaginationControls";

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
      d.nombre.toLowerCase().includes(search.toLowerCase()) ||
      d.especialidad.toLowerCase().includes(search.toLowerCase());
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100">
      <NavBar
        logo="/images/logo-hospital.png"
        links={[
          { href: "/", label: "Inicio" },
          { href: "/doctores", label: "Doctores" },
        ]}
        button={{ text: "Contacto", onClick: () => alert("Contacto") }}
      />

      <main className="pb-24">
        {/* Hero Section */}
        <div className="relative isolate overflow-hidden">
          {/* Decorative background elements */}
          <div
            className="absolute inset-x-0 top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-amber-300 to-yellow-500 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
            />
          </div>

          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              {/* Decorative element */}
              <div className="mb-8 flex justify-center">
                <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-amber-900 ring-1 ring-amber-900/10 hover:ring-amber-900/20">
                  <span className="absolute inset-0 rounded-full bg-amber-100 opacity-50"></span>
                  Encuentra los mejores especialistas médicos{" "}
                  <a href="#search" className="font-semibold text-amber-600">
                    <span className="absolute inset-0" aria-hidden="true" /> Ver
                    todos <span aria-hidden="true">&rarr;</span>
                  </a>
                </div>
              </div>

              <h1 className="relative z-10 mb-8 text-4xl font-bold tracking-tight sm:text-6xl">
                <span className="sr-only">Encuentra Tu Especialista Ideal</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 animate-gradient-x pb-4">
                  Encuentra Tu
                </span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 animate-gradient-x">
                  Especialista Ideal
                </span>
              </h1>

              {/* Enhanced description with icon */}
              <div className="relative">
                <p className="text-lg leading-8 text-amber-900 sm:text-xl max-w-3xl mx-auto">
                  Explora nuestro directorio médico avanzado con los mejores
                  profesionales de la salud. Encuentra el especialista perfecto
                  para tu atención médica personalizada.
                </p>
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
                No se encontraron doctores
              </h3>
              <p className="text-slate-500 max-w-md mx-auto text-lg">
                Prueba ajustando los filtros o modificando tu búsqueda.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
