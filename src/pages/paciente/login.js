import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  updatePassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import {
  doc,
  updateDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { useUserStore } from "../../store/userStore";
import { canAccessPanel } from "../../lib/userTypeService";
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function PatientLogin() {
  const router = useRouter();
  const { userType, loading: userStoreLoading } = useUserStore();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Redirect if user is already logged in and can access this panel
  useEffect(() => {
    if (!userStoreLoading && userType) {
      if (canAccessPanel(userType, "patient")) {
        router.push("/paciente/dashboard");
      } else if (userType === "doctor") {
        // Doctor trying to access patient login
        setMessage("Esta cuenta es de doctor. Redirigiendo al panel médico...");
        setTimeout(() => {
          router.push("/admin");
        }, 2000);
      } else if (userType === "superadmin") {
        // Superadmin trying to access patient login
        setMessage("Esta cuenta es de administrador. Redirigiendo al panel de administración...");
        setTimeout(() => {
          router.push("/superadmin");
        }, 2000);
      }
    }
  }, [userType, userStoreLoading, router]);

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

  const validateLogin = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El email no es válido";
    }

    if (!formData.password.trim()) {
      newErrors.password = "La contraseña es requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordChange = () => {
    const newErrors = {};

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = "La nueva contraseña es requerida";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "La contraseña debe tener al menos 6 caracteres";
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirme la nueva contraseña";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateLogin()) {
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;
      setCurrentUser(user);

      // Check if this is a patient and if they need to change password
      const patientsQuery = query(
        collection(db, "patients"),
        where("userId", "==", user.uid)
      );
      const patientsSnapshot = await getDocs(patientsQuery);

      if (!patientsSnapshot.empty) {
        const patientData = patientsSnapshot.docs[0].data();

        if (patientData.temporaryPassword) {
          setNeedsPasswordChange(true);
          setMessage("Debe cambiar su contraseña temporal por su seguridad");
          return;
        }
        
        // User is a valid patient, redirect will be handled by useEffect
        // Wait a moment for user type detection
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } else {
        // User exists in auth but not as a patient
        setMessage("Esta cuenta no está registrada como paciente. Verificando tipo de usuario...");
        
        // Wait for user type detection, useEffect will handle redirection
        setTimeout(() => {
          setLoading(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error logging in:", error);

      let errorMessage = "Error al iniciar sesión";

      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No existe una cuenta con este email";
          break;
        case "auth/wrong-password":
          errorMessage = "Contraseña incorrecta";
          break;
        case "auth/invalid-email":
          errorMessage = "Email inválido";
          break;
        case "auth/user-disabled":
          errorMessage = "Esta cuenta ha sido deshabilitada";
          break;
        case "auth/too-many-requests":
          errorMessage = "Demasiados intentos fallidos. Intente más tarde";
          break;
        default:
          errorMessage = error.message || "Error al iniciar sesión";
      }

      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!validatePasswordChange()) {
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      // Update password in Firebase Auth
      await updatePassword(currentUser, formData.newPassword);

      // Update patient document to mark password as changed
      const patientsQuery = query(
        collection(db, "patients"),
        where("userId", "==", currentUser.uid)
      );
      const patientsSnapshot = await getDocs(patientsQuery);

      if (!patientsSnapshot.empty) {
        const patientDoc = patientsSnapshot.docs[0];
        await updateDoc(doc(db, "patients", patientDoc.id), {
          temporaryPassword: false,
          passwordChangedAt: new Date(),
        });
      }

      setMessage("Contraseña actualizada exitosamente");

      // Redirect to patient dashboard after password change
      setTimeout(() => {
        router.push("/paciente/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error updating password:", error);
      setMessage("Error al actualizar la contraseña: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setMessage("");

      const provider = new GoogleAuthProvider();
      provider.addScope("email");
      provider.addScope("profile");

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if this user exists as a patient
      const patientsQuery = query(
        collection(db, "patients"),
        where("userId", "==", user.uid)
      );
      const patientsSnapshot = await getDocs(patientsQuery);

      if (patientsSnapshot.empty) {
        // User doesn't exist as a patient, wait for user type detection
        setMessage(
          "Verificando tipo de usuario..."
        );
        // Wait for user type detection, useEffect will handle redirection
        setTimeout(() => {
          setGoogleLoading(false);
        }, 2000);
        return;
      }

      const patientData = patientsSnapshot.docs[0].data();

      // Check if account is active
      if (!patientData.isActive) {
        setMessage("Su cuenta está desactivada. Contacte con su doctor.");
        setGoogleLoading(false);
        return;
      }

      // Successful login, wait for user type detection and redirection
      setTimeout(() => {
        setGoogleLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error with Google sign in:", error);

      let errorMessage = "Error al iniciar sesión con Google";

      switch (error.code) {
        case "auth/popup-blocked":
          errorMessage =
            "Popup bloqueado. Por favor permita popups para este sitio";
          break;
        case "auth/popup-closed-by-user":
          errorMessage = "Inicio de sesión cancelado por el usuario";
          break;
        case "auth/account-exists-with-different-credential":
          errorMessage =
            "Ya existe una cuenta con este email usando un método diferente";
          break;
        default:
          errorMessage = error.message || "Error al iniciar sesión con Google";
      }

      setMessage(errorMessage);
    } finally {
      setGoogleLoading(false);
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
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {needsPasswordChange
                ? "Cambiar Contraseña"
                : "Portal de Pacientes"}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {needsPasswordChange ? (
                "Por seguridad, debe actualizar su contraseña temporal"
              ) : (
                <>
                  O{" "}
                  <Link
                    href="/paciente/register"
                    className="font-medium text-amber-600 hover:text-amber-500 transition-colors"
                  >
                    crea tu cuenta de paciente aquí
                  </Link>
                </>
              )}
            </p>
          </div>

          <div className="mt-8">
            {/* Message */}
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg border ${
                  message.includes("Error")
                    ? "bg-red-50 text-red-700 border-red-200"
                    : message.includes("Debe cambiar")
                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                    : "bg-green-50 text-green-700 border-green-200"
                }`}
              >
                <div className="flex items-center">
                  {message.includes("Error") ||
                  message.includes("Debe cambiar") ? (
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                  ) : null}
                  <span>{message}</span>
                </div>
              </div>
            )}

            {!needsPasswordChange ? (
              /* Login Form */
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                      className={`appearance-none block w-full pl-10 pr-4 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="tu@email.com"
                      disabled={loading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      className={`appearance-none block w-full pl-10 pr-12 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 ${
                        errors.password ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Su contraseña"
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
                    <p className="text-red-500 text-sm mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <Link
                      href="/contacto"
                      className="font-medium text-amber-600 hover:text-amber-500 transition-colors"
                    >
                      ¿Problemas para acceder?
                    </Link>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
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
                        Iniciando sesión...
                      </div>
                    ) : (
                      "Iniciar Sesión"
                    )}
                  </button>
                </div>

                {/* Google Sign In */}
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-2 text-gray-500">
                        O continúa con
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading || loading}
                    className="mt-4 w-full flex justify-center items-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {googleLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Iniciando sesión...
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
                        Iniciar sesión con Google
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-6 text-center">
                  <span className="text-sm text-gray-600">
                    ¿No tienes cuenta?{" "}
                  </span>
                  <Link
                    href="/paciente/register"
                    className="text-sm font-medium text-amber-600 hover:text-amber-500 transition-colors"
                  >
                    Regístrate como paciente
                  </Link>
                </div>
              </form>
            ) : (
              /* Password Change Form */
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div className="text-center mb-6">
                  <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                    <LockClosedIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Cambiar Contraseña Temporal
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Por su seguridad, debe crear una nueva contraseña
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={(e) =>
                        handleInputChange("newPassword", e.target.value)
                      }
                      className={`appearance-none block w-full pl-10 pr-12 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 ${
                        errors.newPassword
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Mínimo 6 caracteres"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.newPassword}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      className={`appearance-none block w-full pl-10 pr-12 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 ${
                        errors.confirmPassword
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Repita la nueva contraseña"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
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

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
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
                      Actualizando...
                    </div>
                  ) : (
                    "Actualizar Contraseña"
                  )}
                </button>
              </form>
            )}

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

            <div className="mt-4 text-center">
              <Link
                href="/auth/login"
                className="text-sm text-gray-600 hover:text-amber-600 transition-colors"
              >
                ¿Eres doctor? Panel médico →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho - Hero Section (solo visible en desktop) */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500">
          {/* Overlay pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/90 to-cyan-600/90"></div>

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
              Tu Salud
              <br />
              <span className="text-cyan-100">Nuestra Prioridad</span>
            </h1>

            {/* Descripción */}
            <p className="text-xl text-cyan-50 mb-8 leading-relaxed max-w-md">
              Accede a tu historial médico, agenda citas y mantén un seguimiento
              integral de tu salud.
            </p>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center text-cyan-50">
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
                <span>Historial médico digital</span>
              </div>
              <div className="flex items-center text-cyan-50">
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
                <span>Citas online con tus doctores</span>
              </div>
              <div className="flex items-center text-cyan-50">
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
                <span>Recordatorios de medicación</span>
              </div>
              <div className="flex items-center text-cyan-50">
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
                <span>Acceso 24/7 desde cualquier dispositivo</span>
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
