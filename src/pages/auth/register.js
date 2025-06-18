import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { createDoctor, generateSlug } from "../../lib/doctorsService";
import {
  validateReferralCode,
  registerReferral,
} from "../../lib/referralsService";
import {
  EyeIcon,
  EyeSlashIcon,
  UserPlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function Register() {
  const [formData, setFormData] = useState({
    // Auth data
    email: "",
    password: "",
    confirmPassword: "",
    // Personal data
    nombre: "",
    telefono: "",
    // Professional data
    especialidad: "",
    descripcion: "",
    horario: "",
    genero: "",
    ubicacion: "",
    consultaOnline: false,
    rango: "Normal",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [referralCode, setReferralCode] = useState("");
  const [referralInfo, setReferralInfo] = useState(null);
  const [validatingReferral, setValidatingReferral] = useState(false);
  const [referralError, setReferralError] = useState("");

  const { signup } = useAuth();
  const router = useRouter();

  // Check for referral code in URL with improved detection
  useEffect(() => {
    const { ref, referral, code } = router.query;
    const referralFromUrl = ref || referral || code;

    if (referralFromUrl) {
      const cleanCode = referralFromUrl.toString().toUpperCase().trim();
      setReferralCode(cleanCode);
      validateReferral(cleanCode);
    }
  }, [router.query]);

  const validateReferral = async (code) => {
    if (!code || code.length < 4) {
      setReferralInfo(null);
      setReferralError("");
      return;
    }

    try {
      setValidatingReferral(true);
      setReferralError("");

      const referrerInfo = await validateReferralCode(code);
      if (referrerInfo) {
        setReferralInfo(referrerInfo);
      } else {
        setReferralInfo(null);
        setReferralError("Código de referencia no válido");
      }
    } catch (error) {
      console.error("Error validating referral:", error);
      setReferralInfo(null);
      setReferralError("Error al validar el código");
    } finally {
      setValidatingReferral(false);
    }
  };

  const especialidades = [
    "Cardiología",
    "Dermatología",
    "Endocrinología",
    "Gastroenterología",
    "Ginecología",
    "Medicina General",
    "Neurología",
    "Odontología",
    "Oftalmología",
    "Pediatría",
    "Psiquiatría",
    "Traumatología",
    "Urología",
  ];

  const ubicaciones = [
    "Palermo",
    "Recoleta",
    "Belgrano",
    "San Telmo",
    "Puerto Madero",
    "Villa Crespo",
    "Caballito",
    "Barracas",
    "La Boca",
    "Retiro",
  ];

  function handleInputChange(field, value) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function validateStep1() {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError("Todos los campos son obligatorios");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return false;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return false;
    }

    return true;
  }

  function validateStep2() {
    if (
      !formData.nombre ||
      !formData.especialidad ||
      !formData.telefono ||
      !formData.genero ||
      !formData.ubicacion
    ) {
      setError("Todos los campos son obligatorios");
      return false;
    }
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (step === 1) {
      if (!validateStep1()) return;
      setError("");
      setStep(2);
      return;
    }

    if (!validateStep2()) return;

    try {
      setError("");
      setLoading(true);

      // Create user account
      const userCredential = await signup(formData.email, formData.password);
      const user = userCredential.user;

      // Create doctor profile
      const doctorData = {
        userId: user.uid,
        nombre: formData.nombre,
        slug: generateSlug(formData.nombre, formData.especialidad),
        rango: formData.rango,
        imagen: "img/doctor-1.jpg", // Default image
        descripcion:
          formData.descripcion || `${formData.especialidad} especialista`,
        especialidad: formData.especialidad,
        telefono: formData.telefono,
        email: formData.email,
        horario: formData.horario || "Lunes a Viernes, 9:00 AM - 5:00 PM",
        genero: formData.genero,
        consultaOnline: formData.consultaOnline,
        ubicacion: formData.ubicacion,
        verified: false,
      };

      await createDoctor(doctorData);

      // Register referral if there's a valid referral code
      if (referralInfo) {
        try {
          await registerReferral(referralInfo.id, user.uid, {
            firstName: formData.nombre.split(" ")[0],
            lastName: formData.nombre.split(" ").slice(1).join(" ") || "",
            email: formData.email,
            specialty: formData.especialidad,
          });
        } catch (referralError) {
          console.error("Error registering referral:", referralError);
          // Don't block registration if referral fails
        }
      }

      router.push("/admin");
    } catch (error) {
      setError("Error al crear la cuenta. Intenta nuevamente.");
      console.error("Registration error:", error);
    }

    setLoading(false);
  }

  const handleReferralCodeChange = (e) => {
    const code = e.target.value.toUpperCase().trim();
    setReferralCode(code);

    // Debounce validation
    if (code.length >= 4) {
      setTimeout(() => validateReferral(code), 500);
    } else {
      setReferralInfo(null);
      setReferralError("");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Formulario */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Logo mobile */}
          <div className="lg:hidden mb-8">
            <img className="h-12 w-auto mx-auto" src="/logo.png" alt="Logo" />
          </div>

          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 shadow-lg">
              <UserPlusIcon className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 text-center">
              Únete como profesional
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-amber-600 hover:text-amber-500 transition-colors"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>

          {/* Progress indicator */}
          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center">
              <div
                className={`rounded-full h-10 w-10 flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  step >= 1
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-md"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                1
              </div>
              <span className="ml-3 text-sm font-medium text-gray-900">
                Cuenta
              </span>
            </div>
            <div className="flex-1 mx-6 h-2 bg-gray-200 rounded-full">
              <div
                className={`h-2 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all duration-500 ${
                  step >= 2 ? "w-full" : "w-0"
                }`}
              />
            </div>
            <div className="flex items-center">
              <div
                className={`rounded-full h-10 w-10 flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  step >= 2
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-md"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                2
              </div>
              <span className="ml-3 text-sm font-medium text-gray-900">
                Perfil
              </span>
            </div>
          </div>

          <div className="mt-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        {error}
                      </h3>
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Correo Electrónico *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                      placeholder="doctor@ejemplo.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Contraseña *
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        className="appearance-none block w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-amber-600 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Confirmar Contraseña *
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleInputChange("confirmPassword", e.target.value)
                        }
                        className="appearance-none block w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                        placeholder="Repite tu contraseña"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-amber-600 transition-colors"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Referral Code Section - Mejorado */}
                  <div className="border-t pt-6">
                    <label
                      htmlFor="referralCode"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Código de Referencia
                      <span className="text-gray-500 font-normal">
                        {" "}
                        (Opcional)
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        id="referralCode"
                        name="referralCode"
                        type="text"
                        value={referralCode}
                        onChange={handleReferralCodeChange}
                        className={`appearance-none block w-full px-4 py-3 pr-12 border rounded-lg placeholder-gray-400 focus:outline-none transition-all duration-200 ${
                          referralInfo
                            ? "border-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            : referralError
                            ? "border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        }`}
                        placeholder="Ej: ABC1234"
                        maxLength={8}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {validatingReferral ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-600"></div>
                        ) : referralInfo ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : referralError ? (
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                        ) : null}
                      </div>
                    </div>

                    {validatingReferral && (
                      <p className="mt-2 text-sm text-amber-600 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600 mr-2"></div>
                        Validando código...
                      </p>
                    )}

                    {referralInfo && (
                      <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                        <div className="flex items-start">
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-green-800">
                              ¡Código válido!
                            </p>
                            <p className="text-sm text-green-700 mt-1">
                              Referido por:{" "}
                              <strong>
                                {referralInfo.firstName} {referralInfo.lastName}
                              </strong>
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              {referralInfo.specialty}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {referralError && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                        {referralError}
                      </p>
                    )}

                    {!referralCode && (
                      <p className="mt-2 text-xs text-gray-500">
                        Si te invitó otro doctor, ingresa su código para obtener
                        beneficios especiales
                      </p>
                    )}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <label
                      htmlFor="nombre"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Nombre Completo *
                    </label>
                    <input
                      id="nombre"
                      name="nombre"
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={(e) =>
                        handleInputChange("nombre", e.target.value)
                      }
                      className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                      placeholder="Dr. Juan Pérez"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="especialidad"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Especialidad *
                    </label>
                    <select
                      id="especialidad"
                      name="especialidad"
                      required
                      value={formData.especialidad}
                      onChange={(e) =>
                        handleInputChange("especialidad", e.target.value)
                      }
                      className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                    >
                      <option value="">Selecciona tu especialidad</option>
                      {especialidades.map((esp) => (
                        <option key={esp} value={esp}>
                          {esp}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="telefono"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Teléfono *
                      </label>
                      <input
                        id="telefono"
                        name="telefono"
                        type="tel"
                        required
                        value={formData.telefono}
                        onChange={(e) =>
                          handleInputChange("telefono", e.target.value)
                        }
                        className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                        placeholder="11 1234-5678"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="genero"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Género *
                      </label>
                      <select
                        id="genero"
                        name="genero"
                        required
                        value={formData.genero}
                        onChange={(e) =>
                          handleInputChange("genero", e.target.value)
                        }
                        className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                      >
                        <option value="">Seleccionar</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="ubicacion"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Ubicación *
                    </label>
                    <select
                      id="ubicacion"
                      name="ubicacion"
                      required
                      value={formData.ubicacion}
                      onChange={(e) =>
                        handleInputChange("ubicacion", e.target.value)
                      }
                      className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                    >
                      <option value="">Selecciona tu ubicación</option>
                      {ubicaciones.map((ubi) => (
                        <option key={ubi} value={ubi}>
                          {ubi}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="descripcion"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Descripción Profesional
                    </label>
                    <textarea
                      id="descripcion"
                      name="descripcion"
                      rows={3}
                      value={formData.descripcion}
                      onChange={(e) =>
                        handleInputChange("descripcion", e.target.value)
                      }
                      className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                      placeholder="Describe tu experiencia y especialidades..."
                    />
                  </div>

                  <div className="flex items-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <input
                      id="consultaOnline"
                      name="consultaOnline"
                      type="checkbox"
                      checked={formData.consultaOnline}
                      onChange={(e) =>
                        handleInputChange("consultaOnline", e.target.checked)
                      }
                      className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="consultaOnline"
                      className="ml-3 block text-sm font-medium text-amber-800"
                    >
                      Ofrezco consultas online
                    </label>
                  </div>
                </>
              )}

              <div className="flex justify-between space-x-4">
                {step === 2 && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex justify-center py-3 px-6 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200"
                  >
                    ← Anterior
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`group relative ${
                    step === 1 ? "w-full" : "flex-1"
                  } flex justify-center py-3 px-6 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creando cuenta...
                    </div>
                  ) : step === 1 ? (
                    "Continuar →"
                  ) : (
                    "Crear Cuenta"
                  )}
                </button>
              </div>

              <div className="text-center">
                <span className="text-sm text-gray-600">
                  ¿Ya tienes cuenta?{" "}
                </span>
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-amber-600 hover:text-amber-500 transition-colors"
                >
                  Inicia sesión aquí
                </Link>
              </div>
            </form>

            <div className="mt-8 text-center">
              <Link
                href="/"
                className="inline-flex items-center text-sm text-gray-600 hover:text-amber-600 transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho - Hero Section (solo visible en desktop) */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500">
          {/* Overlay pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/90 to-yellow-600/90"></div>

          {/* Background image overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
            style={{
              backgroundImage: "url('/img/doctor-2.jpg')",
            }}
          ></div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center h-full px-12 xl:px-16">
            {/* Logo */}
            <div className="mb-8">
              <img className="h-16 w-auto" src="/logo.png" alt="Logo" />
            </div>

            {/* Título principal */}
            <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
              Únete a nuestra
              <br />
              <span className="text-amber-100">comunidad médica</span>
            </h1>

            {/* Descripción */}
            <p className="text-xl text-amber-50 mb-8 leading-relaxed max-w-md">
              Crea tu perfil profesional, gestiona pacientes y haz crecer tu
              consulta con las mejores herramientas.
            </p>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center text-amber-50">
                <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span>Perfil profesional completo</span>
              </div>
              <div className="flex items-center text-amber-50">
                <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span>Gestión integral de pacientes</span>
              </div>
              <div className="flex items-center text-amber-50">
                <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span>Sistema de referencias y recompensas</span>
              </div>
              <div className="flex items-center text-amber-50">
                <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span>Consultas online y presenciales</span>
              </div>
            </div>

            {/* Referral Benefits */}
            {referralInfo && (
              <div className="mt-8 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-2">
                  🎉 ¡Invitación especial!
                </h3>
                <p className="text-amber-100 text-sm">
                  {referralInfo.firstName} {referralInfo.lastName} te invitó a
                  unirte. Obtendrás beneficios exclusivos al completar tu
                  registro.
                </p>
              </div>
            )}

            {/* Decorative elements */}
            <div className="absolute bottom-12 right-12 opacity-10">
              <svg
                className="w-24 h-24 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
