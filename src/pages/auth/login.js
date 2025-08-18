import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { useUserStore } from "../../store/userStore";
import { canAccessPanel } from "../../lib/userTypeService";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  
  // Estados para el modal de recuperar contraseña
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, resetPassword, loginWithGoogle } = useAuth();
  const { userType, loading: userStoreLoading } = useUserStore();
  const router = useRouter();

  const isSuperAdminAccess = router.query.message === "superadmin";

  // Redirect if user is already logged in and can access this panel
  useEffect(() => {
    // Only redirect if user is already logged in when page loads
    // Don't interfere with login process
    if (!userStoreLoading && userType && !loading && !googleLoading) {
      const requiredType = isSuperAdminAccess ? "superadmin" : "doctor";
      if (canAccessPanel(userType, requiredType)) {
        if (isSuperAdminAccess) {
          router.push("/superadmin");
        } else {
          router.push("/admin");
        }
      } else if (userType === "patient") {
        // Patient trying to access doctor login
        setError("Esta cuenta es de paciente. Redirigiendo al portal de pacientes...");
        setTimeout(() => {
          router.push("/paciente/dashboard");
        }, 2000);
      }
    }
  }, [userType, userStoreLoading, isSuperAdminAccess, router, loading, googleLoading]);

  // Detect referral codes from URL
  useEffect(() => {
    const { ref, referral, code } = router.query;
    const referralFromUrl = ref || referral || code;

    if (referralFromUrl) {
      const cleanCode = referralFromUrl.toString().toUpperCase().trim();
      setReferralCode(cleanCode);
    }
  }, [router.query]);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);
      
      // Login user
      await login(email, password);
      
      // Redirect immediately after successful login
      if (isSuperAdminAccess) {
        router.push("/superadmin");
      } else {
        router.push("/admin");
      }
      
    } catch (error) {
      setError("Error al iniciar sesión. Verifica tus credenciales.");
      console.error("Login error:", error);
      setLoading(false);
    }
  }

  // Function to handle redirect to register with referral code
  const handleRegisterRedirect = () => {
    if (referralCode) {
      router.push(`/auth/register?ref=${referralCode}`);
    } else {
      router.push("/auth/register");
    }
  };

  // Function to handle password reset
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    try {
      setResetError("");
      setResetMessage("");
      setResetLoading(true);
      await resetPassword(resetEmail);
      setResetMessage("Revisa tu correo electrónico para obtener instrucciones sobre cómo restablecer tu contraseña.");
      setResetEmail("");
    } catch (error) {
      console.error("Password reset error:", error);
      
      switch (error.code) {
        case "auth/user-not-found":
          setResetError("No existe una cuenta con este correo electrónico.");
          break;
        case "auth/invalid-email":
          setResetError("El correo electrónico no es válido.");
          break;
        case "auth/too-many-requests":
          setResetError("Demasiados intentos. Intenta de nuevo más tarde.");
          break;
        default:
          setResetError("Error al enviar el correo de recuperación. Intenta de nuevo.");
      }
    }
    
    setResetLoading(false);
  };

  // Function to close modal and reset states
  const closeForgotModal = () => {
    setShowForgotModal(false);
    setResetEmail("");
    setResetMessage("");
    setResetError("");
  };

  // Function to handle Google login
  const handleGoogleLogin = async () => {
    try {
      setError("");
      setGoogleLoading(true);
      
      const { result, doctorProfile } = await loginWithGoogle();
      
      // Successful login - redirect immediately
      if (isSuperAdminAccess) {
        router.push("/superadmin");
      } else {
        router.push("/admin");
      }
      
    } catch (error) {
      console.error("Google login error:", error);
      
      if (error.message.includes("ACCOUNT_NOT_FOUND")) {
        setError("No encontramos una cuenta registrada con este correo de Google. Regístrate primero.");
      } else if (error.message.includes("EMAIL_EXISTS_WITH_PASSWORD")) {
        setError("Este correo está registrado con email/contraseña. Usa el login tradicional.");
      } else if (error.code === "auth/popup-closed-by-user") {
        setError("Inicio de sesión cancelado.");
      } else if (error.code === "auth/popup-blocked") {
        setError("El popup fue bloqueado por tu navegador. Permite popups e intenta de nuevo.");
      } else {
        setError("Error al iniciar sesión con Google. Intenta de nuevo.");
      }
      setGoogleLoading(false);
    }
  };  return (
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
              Bienvenido de vuelta
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              O{" "}
              <button
                onClick={handleRegisterRedirect}
                className="font-medium text-amber-600 hover:text-amber-500 transition-colors cursor-pointer underline"
              >
                crea tu cuenta profesional aquí
              </button>
            </p>
          </div>

          <div className="mt-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {referralCode && (
                <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-800">
                        🎁 Código de referencia detectado
                      </h3>
                      <p className="text-sm text-amber-700 mt-1">
                        Tienes el código <strong>{referralCode}</strong>. Si no
                        tienes cuenta, al registrarte obtendrás beneficios
                        especiales.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isSuperAdminAccess && (
                <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-800">
                        🔐 Acceso SuperAdmin
                      </h3>
                      <p className="text-sm text-amber-700 mt-1">
                        Inicia sesión con tu cuenta de superadmin para acceder
                        al panel de gestión.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        {error}
                      </h3>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                  placeholder="doctor@ejemplo.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                    placeholder="Ingresa tu contraseña"
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

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="font-medium text-amber-600 hover:text-amber-500 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
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

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">O continúa con</span>
                </div>
              </div>

              {/* Google Login Button */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading || googleLoading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                >
                  {googleLoading ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500"
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
                      Iniciando con Google...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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
                      Continuar con Google
                    </div>
                  )}
                </button>
              </div>

              <div className="text-center">
                <span className="text-sm text-gray-600">
                  ¿No tienes cuenta?{" "}
                </span>
                <button
                  onClick={handleRegisterRedirect}
                  className="text-sm font-medium text-amber-600 hover:text-amber-500 transition-colors cursor-pointer underline"
                >
                  Regístrate como profesional
                </button>
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
              backgroundImage: "url('/img/doctor-1.jpg')",
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
              Plataforma Médica
              <br />
              <span className="text-amber-100">Profesional</span>
            </h1>

            {/* Descripción */}
            <p className="text-xl text-amber-50 mb-8 leading-relaxed max-w-md">
              Conecta con pacientes, gestiona consultas y haz crecer tu práctica
              médica con nuestra plataforma integral.
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
                <span>Gestión de citas automatizada</span>
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
                <span>Perfil profesional personalizado</span>
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
                <span>Sistema de reseñas y referencias</span>
              </div>
            </div>

            {/* Referral Code Display */}
            {referralCode && (
              <div className="mt-8 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-2">
                  🎁 Código de referencia detectado
                </h3>
                <p className="text-amber-100 text-sm mb-3">
                  Código: <strong className="text-white">{referralCode}</strong>
                </p>
                <button
                  onClick={handleRegisterRedirect}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm"
                >
                  Registrarse con beneficios
                </button>
              </div>
            )}

            {/* Decorative elements */}
            <div className="absolute bottom-12 right-12 opacity-10">
              <svg
                className="w-24 h-24 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Recuperar Contraseña */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
            {/* Botón cerrar */}
            <button
              onClick={closeForgotModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Contenido del modal */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Recuperar Contraseña
              </h3>
              <p className="text-sm text-gray-600">
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </p>
            </div>

            <form onSubmit={handlePasswordReset} className="space-y-4">
              {resetMessage && (
                <div className="rounded-lg bg-green-50 p-3 border border-green-200">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-green-800">
                        ✅ {resetMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {resetError && (
                <div className="rounded-lg bg-red-50 p-3 border border-red-200">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-red-800">
                        {resetError}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  id="resetEmail"
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                  placeholder="doctor@ejemplo.com"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeForgotModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {resetLoading ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      Enviando...
                    </div>
                  ) : (
                    "Enviar"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
