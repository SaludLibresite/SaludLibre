import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserPlusIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

export default function PatientRegister() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [referralCode, setReferralCode] = useState("");
  const [referralDoctor, setReferralDoctor] = useState(null);

  const [formData, setFormData] = useState({
    // Paso 1: Información básica
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    dateOfBirth: "",
    gender: "",

    // Paso 2: Información médica y contacto
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    insuranceProvider: "",
    insuranceNumber: "",
    allergies: "",
    currentMedications: "",
    medicalHistory: "",

    // Paso 3: Selección de doctor
    doctorId: "",
    referralCode: "",
  });

  // Check for referral code in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode =
      urlParams.get("ref") ||
      urlParams.get("referral") ||
      urlParams.get("code");

    if (refCode) {
      setReferralCode(refCode);
      setFormData((prev) => ({ ...prev, referralCode: refCode }));
      validateReferralCode(refCode);
    }

    loadAvailableDoctors();
  }, []);

  const loadAvailableDoctors = async () => {
    try {
      const doctorsQuery = query(collection(db, "doctors"));
      const doctorsSnapshot = await getDocs(doctorsQuery);
      const doctors = doctorsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAvailableDoctors(doctors);
    } catch (error) {
      console.error("Error loading doctors:", error);
    }
  };

  const validateReferralCode = async (code) => {
    if (!code) return;

    try {
      // This would validate the referral code with the referralsService
      // For now, we'll just find a doctor with that code
      const doctorsQuery = query(
        collection(db, "doctors"),
        where("referralCode", "==", code.toUpperCase())
      );
      const doctorsSnapshot = await getDocs(doctorsQuery);

      if (!doctorsSnapshot.empty) {
        const doctor = {
          id: doctorsSnapshot.docs[0].id,
          ...doctorsSnapshot.docs[0].data(),
        };
        setReferralDoctor(doctor);
        setSelectedDoctor(doctor);
        setFormData((prev) => ({ ...prev, doctorId: doctor.id }));
      }
    } catch (error) {
      console.error("Error validating referral code:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El email no es válido";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirme su contraseña";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoogleSignUp = async () => {
    try {
      setGoogleLoading(true);
      setMessage("");

      const provider = new GoogleAuthProvider();
      provider.addScope("email");
      provider.addScope("profile");

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user already exists as a patient
      const patientsQuery = query(
        collection(db, "patients"),
        where("userId", "==", user.uid)
      );
      const existingPatient = await getDocs(patientsQuery);

      if (!existingPatient.empty) {
        setMessage("Esta cuenta de Google ya está registrada como paciente");
        return;
      }

      // Create patient document with minimal data from Google
      const patientData = {
        name: user.displayName || "",
        email: user.email,
        phone: user.phoneNumber || "",
        profilePhoto: user.photoURL,
        userId: user.uid,
        userType: "patient",
        temporaryPassword: false,
        isActive: true,
        registrationMethod: "google",
        dataComplete: false, // Flag to show completion modal in dashboard
        doctorId: selectedDoctor?.id || "",
        referralCode: referralCode,
        googleInfo: {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          phoneNumber: user.phoneNumber,
          emailVerified: user.emailVerified,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, "patients"), patientData);

      setMessage("¡Registro con Google exitoso! Redirigiendo al dashboard...");

      setTimeout(() => {
        router.push("/paciente/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error with Google sign up:", error);

      let errorMessage = "Error al registrarse con Google";

      switch (error.code) {
        case "auth/account-exists-with-different-credential":
          errorMessage =
            "Ya existe una cuenta con este email usando un método diferente";
          break;
        case "auth/popup-blocked":
          errorMessage =
            "Popup bloqueado. Por favor permita popups para este sitio";
          break;
        case "auth/popup-closed-by-user":
          errorMessage = "Registro cancelado por el usuario";
          break;
        default:
          errorMessage = error.message || "Error al registrarse con Google";
      }

      setMessage(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Update user profile
      await updateProfile(userCredential.user, {
        displayName: formData.name,
      });

      // Create patient document
      const patientData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || "",
        dateOfBirth: formData.dateOfBirth || "",
        gender: formData.gender || "",
        userId: userCredential.user.uid,
        userType: "patient",
        temporaryPassword: false,
        isActive: true,
        registrationMethod: "email",
        dataComplete: !!(formData.phone && formData.dateOfBirth && formData.gender), // Check if basic data is complete
        doctorId: selectedDoctor?.id || "",
        referralCode: referralCode,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, "patients"), patientData);

      setMessage("¡Registro exitoso! Redirigiendo al dashboard...");

      setTimeout(() => {
        router.push("/paciente/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error registering patient:", error);

      let errorMessage = "Error al registrar la cuenta";

      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "Este email ya está registrado";
          break;
        case "auth/weak-password":
          errorMessage = "La contraseña es muy débil";
          break;
        default:
          errorMessage = error.message || "Error al registrar la cuenta";
      }

      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Logo mobile */}
            <div className="lg:hidden mb-6">
              <img className="h-12 w-auto mx-auto" src="/logo.png" alt="Logo" />
            </div>

            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <UserPlusIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Registro de Paciente
            </h1>
            <p className="text-gray-600 mt-2">
              Únete a nuestra plataforma médica
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
            {/* Message */}
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg border ${
                  message.includes("Error")
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-green-50 text-green-700 border-green-200"
                }`}
              >
                <div className="flex items-center">
                  {message.includes("Error") ? (
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                  ) : (
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                  )}
                  <span>{message}</span>
                </div>
              </div>
            )}

            {/* Referral Doctor Display */}
            {referralDoctor && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-amber-600 mr-2" />
                  <span className="text-amber-800 font-medium">
                    Doctor recomendado por código de referencia
                  </span>
                </div>
                <div className="mt-2 flex items-center">
                  <div className="h-10 w-10 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-white">
                      {referralDoctor.nombre
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "DR"}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {referralDoctor.nombre}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {referralDoctor.especialidad}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Google Sign Up Button */}
            <div className="mb-6">
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={googleLoading || loading}
                className="w-full flex justify-center items-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mb-4"
              >
                {googleLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Registrando con Google...
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Registrarse con Google
                  </>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">
                    O registrarse con email
                  </span>
                </div>
              </div>
            </div>

            {/* Manual Registration Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Juan Pérez"
                    disabled={loading}
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="juan@email.com"
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña *
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Mínimo 6 caracteres"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña *
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                      errors.confirmPassword ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Repita la contraseña"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Optional fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      placeholder="+54 11 1234-5678"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Nacimiento
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        handleInputChange("dateOfBirth", e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Género
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                  disabled={loading}
                >
                  <option value="">Seleccionar género</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || googleLoading}
                className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Registrando...
                  </div>
                ) : (
                  "Crear Cuenta"
                )}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600">
              ¿Ya tienes una cuenta?{" "}
              <Link
                href="/paciente/login"
                className="text-amber-600 hover:text-amber-500 font-medium"
              >
                Iniciar sesión
              </Link>
            </p>
            <div className="mt-4">
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

      {/* Right side - Hero */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500">
          {/* Overlay pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/90 to-cyan-600/90"></div>

          {/* Background image overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
            style={{
              backgroundImage: "url('/img/doctor-3.jpg')",
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
              Tu Salud,
              <br />
              <span className="text-cyan-100">Nuestra Prioridad</span>
            </h1>

            {/* Descripción */}
            <p className="text-xl text-cyan-50 mb-8 leading-relaxed max-w-md">
              Únete a miles de pacientes que confían en nuestra plataforma
              médica integral
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white">Citas Online</h3>
                </div>
                <p className="text-sm text-cyan-100">
                  Agenda consultas de manera rápida y sencilla
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path
                        fillRule="evenodd"
                        d="M4 5a2 2 0 012-2v1a2 2 0 002 2h2a2 2 0 002-2V3a2 2 0 012 2v6h-3a2 2 0 100 4h3v2a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm8 5H8v2h4v-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white">
                    Historial Digital
                  </h3>
                </div>
                <p className="text-sm text-cyan-100">
                  Tu historial médico siempre disponible
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white">
                    Recetas Digitales
                  </h3>
                </div>
                <p className="text-sm text-cyan-100">
                  Gestiona tus prescripciones fácilmente
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white">Recordatorios</h3>
                </div>
                <p className="text-sm text-cyan-100">
                  Nunca olvides citas o medicación
                </p>
              </div>
            </div>

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
