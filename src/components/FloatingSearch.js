import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAllDoctors } from "../lib/doctorsService";
import { getAllSpecialties } from "../lib/specialtiesService";
import { getDoctorRank } from "../lib/subscriptionUtils";
import { formatDoctorName } from "../lib/dataUtils";

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-5 h-5"
  >
    <path
      fillRule="evenodd"
      d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
      clipRule="evenodd"
    />
  </svg>
);

const FilterIcon = ({ path }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-4 h-4 mr-2 text-amber-500"
  >
    <path d={path} />
  </svg>
);

const DoctorSkeleton = () => (
  <div className="animate-pulse bg-white rounded-xl p-4 border border-gray-100">
    <div className="flex gap-4">
      <div className="w-40 h-40 bg-gray-200 rounded-lg"></div>
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  </div>
);

const DoctorResult = ({ doctor }) => (
  <Link href={`/doctores/${doctor.slug}`} passHref legacyBehavior>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-4 border border-gray-100 hover:border-amber-200 transition-all cursor-pointer"
    >
    <div className="flex gap-4">
      <img
        src={doctor.photoURL || doctor.imagen || "/img/doctor-1.jpg"}
        alt={doctor.nombre}
        className="w-20 h-20 object-cover rounded-lg"
        onError={(e) => {
          e.target.src = "/img/doctor-1.jpg";
        }}
      />
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{formatDoctorName(doctor.nombre, doctor.genero)}</h3>
        <p className="text-sm text-gray-600">{doctor.especialidad}</p>
        <div className="flex gap-2 mt-2 flex-wrap">
          {doctor.consultaOnline && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
              Consulta Online
            </span>
          )}
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              getDoctorRank(doctor) === "VIP"
                ? "bg-amber-50 text-amber-700"
                : getDoctorRank(doctor) === "Intermedio"
                ? "bg-blue-50 text-blue-700"
                : "bg-gray-50 text-gray-700"
            }`}
          >
            {getDoctorRank(doctor)}
          </span>
          {doctor.ageGroup && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
              {doctor.ageGroup === "menores"
                ? "Solo Menores"
                : doctor.ageGroup === "adultos"
                ? "Solo Adultos"
                : "Menores y Adultos"}
            </span>
          )}
        </div>
        {doctor.prepagas && doctor.prepagas.length > 0 && (
          <div className="mt-2">
            <div className="flex flex-wrap gap-1">
              {doctor.prepagas.slice(0, 3).map((prepaga, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded"
                >
                  {prepaga}
                </span>
              ))}
              {doctor.prepagas.length > 3 && (
                <span className="inline-block px-2 py-0.5 bg-gray-50 text-gray-600 text-xs font-medium rounded">
                  +{doctor.prepagas.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </motion.div>
  </Link>
);

const SpecialtyResult = ({ specialty }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100 hover:border-amber-200 transition-all cursor-pointer"
    onClick={() => (window.location.href = `/especialidades/${specialty.title.toLowerCase().replace(/\s+/g, '-')}`)}
  >
    <div className="flex gap-4">
      <img
        src={specialty.imageUrl || "/img/doctor-1.jpg"}
        alt={specialty.title}
        className="w-20 h-20 object-cover rounded-lg"
        onError={(e) => {
          e.target.src = "/img/doctor-1.jpg";
        }}
      />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            Especialidad
          </span>
        </div>
        <h3 className="font-semibold text-gray-900">{specialty.title}</h3>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{specialty.description}</p>
        {specialty.isActive !== false && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 mt-2">
            Disponible
          </span>
        )}
      </div>
    </div>
  </motion.div>
);

const SearchFilters = ({ filters, isVisible }) => (
  <motion.div
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: isVisible ? "auto" : 0, opacity: isVisible ? 1 : 0 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className="flex flex-wrap gap-3 md:gap-4 mt-4 md:mt-6 overflow-hidden"
  >
    {filters.map((filter) => (
      <div key={filter.id} className="space-y-1.5 md:space-y-2 w-full sm:w-auto xl:flex-1">
        <label className="flex items-center text-xs md:text-sm font-medium text-gray-700">
          <FilterIcon
            path={
              filter.iconPath ||
              "M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3 16a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z"
            }
          />
          {filter.label}
        </label>
        <select
          value={filter.value}
          onChange={(e) => filter.setter(e.target.value)}
          className="w-full rounded-lg border border-gray-200 py-2 md:py-2.5 pl-2 md:pl-3 pr-6 md:pr-8 text-sm md:text-base text-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
        >
          <option value="">Todos</option>
          {filter.options.map((opt) => (
            <option
              key={typeof opt === "string" ? opt : opt.value}
              value={typeof opt === "string" ? opt : opt.value}
            >
              {typeof opt === "string" ? opt : opt.label}
            </option>
          ))}
        </select>
      </div>
    ))}
  </motion.div>
);

const SearchModal = ({
  isOpen,
  onClose,
  search: parentSearch,
  setSearch: setParentSearch,
  filters,
}) => {
  const [modalSearch, setModalSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [doctoresData, setDoctoresData] = useState([]);
  const [specialtiesData, setSpecialtiesData] = useState([]);

  // Load doctors and specialties data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [doctors, specialties] = await Promise.all([
          getAllDoctors(),
          getAllSpecialties()
        ]);
        
        // Only show verified doctors
        const verifiedDoctors = doctors.filter(
          (doctor) => doctor.verified === true
        );
        
        // Only show active specialties
        const activeSpecialties = specialties.filter(
          (specialty) => specialty.isActive !== false
        );
        
        setDoctoresData(verifiedDoctors);
        setSpecialtiesData(activeSpecialties);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setModalSearch("");
      setSearchResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (modalSearch.trim().length >= 3 && (doctoresData.length > 0 || specialtiesData.length > 0)) {
        setIsSearching(true);
        
        const searchTerm = modalSearch.toLowerCase();
        
        // Search doctors
        const doctorResults = doctoresData.filter(
          (d) =>
            d.nombre.toLowerCase().includes(searchTerm) ||
            d.especialidad.toLowerCase().includes(searchTerm) ||
            (d.prepagas &&
              d.prepagas.some((prepaga) =>
                prepaga.toLowerCase().includes(searchTerm)
              )) ||
            (d.ageGroup &&
              ((d.ageGroup === "menores" &&
                searchTerm.includes("menor")) ||
                (d.ageGroup === "adultos" &&
                  searchTerm.includes("adult")) ||
                (d.ageGroup === "ambos" &&
                  (searchTerm.includes("ambos") ||
                    searchTerm.includes("todo")))))
        );

        // Search specialties
        const specialtyResults = specialtiesData.filter(
          (s) =>
            s.title.toLowerCase().includes(searchTerm) ||
            s.description.toLowerCase().includes(searchTerm)
        );

        // Combine results with specialties first, then doctors
        const combinedResults = [
          ...specialtyResults.map(s => ({ ...s, type: 'specialty' })),
          ...doctorResults.map(d => ({ ...d, type: 'doctor' }))
        ];

        setTimeout(() => {
          setSearchResults(combinedResults);
          setIsSearching(false);
        }, 500);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [modalSearch, doctoresData, specialtiesData]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl mt-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Buscar Especialista
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="relative">
                <motion.input
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                  type="text"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Buscar por nombre, especialidad o prepaga..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <SearchIcon />
                </div>
              </div>

              <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {modalSearch.trim().length > 0 &&
                modalSearch.trim().length < 3 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      Ingresa al menos 3 caracteres para buscar
                    </p>
                  </div>
                ) : isSearching ? (
                  <>
                    <DoctorSkeleton />
                    <DoctorSkeleton />
                    <DoctorSkeleton />
                  </>
                ) : modalSearch.trim().length >= 3 ? (
                  searchResults.length > 0 ? (
                    <>
                      {searchResults.some(r => r.type === 'specialty') && (
                        <div className="mb-4">
                          <h3 className="text-sm font-medium text-gray-700 mb-2 px-2">
                            Especialidades
                          </h3>
                          {searchResults
                            .filter(r => r.type === 'specialty')
                            .map((specialty) => (
                              <SpecialtyResult key={`specialty-${specialty.id}`} specialty={specialty} />
                            ))}
                        </div>
                      )}
                      {searchResults.some(r => r.type === 'doctor') && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-2 px-2">
                            Doctores
                          </h3>
                          {searchResults
                            .filter(r => r.type === 'doctor')
                            .map((doctor) => (
                              <DoctorResult key={`doctor-${doctor.id}`} doctor={doctor} />
                            ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        No se encontraron resultados
                      </p>
                    </div>
                  )
                ) : null}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const FloatingSearch = ({ search, setSearch, filters }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchBarRect, setSearchBarRect] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si estamos en móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      // Solo aplicar el comportamiento de scroll en desktop
      if (isMobile) return;
      
      if (!isScrolled && scrollPosition > 600) {
        const searchBar = document.querySelector("#searchBar");
        if (searchBar) {
          setSearchBarRect(searchBar.getBoundingClientRect());
        }
        setIsScrolled(true);
      } else if (isScrolled && scrollPosition <= 300) {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isScrolled, isMobile]);

  return (
    <>
      <motion.div layout className="z-50 relative">
        <motion.div layout id="searchBar" className="container mx-auto mb-12 px-6 lg:px-8">
          <div className="p-4 md:p-6 bg-white shadow-2xl rounded-xl ring-1 ring-slate-200/50">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, especialidad o prepaga..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon />
              </div>
            </div>

            <SearchFilters filters={filters} isVisible={isMobile ? true : !isScrolled} />
          </div>
        </motion.div>

        {/* Floating bubble - solo en desktop */}
        {!isMobile && (
          <motion.button
            layout
            onClick={() => setIsModalOpen(true)}
            className="fixed bottom-8 right-8 bg-amber-500 text-white p-4 rounded-full shadow-lg hover:bg-amber-600 z-40"
            initial={{ scale: 0, y: 100 }}
            animate={{
              scale: isScrolled ? 1 : 0,
              y: isScrolled ? 0 : 100,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <SearchIcon />
          </motion.button>
        )}
      </motion.div>

      <SearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        search={search}
        setSearch={setSearch}
        filters={filters}
      />
    </>
  );
};

export default FloatingSearch;
