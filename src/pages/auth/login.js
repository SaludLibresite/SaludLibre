import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  const { login } = useAuth();
  const router = useRouter();

  const isSuperAdminAccess = router.query.message === "superadmin";

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
      await login(email, password);

      // Redirigir al superadmin si viene desde allí, sino al admin normal
      if (isSuperAdminAccess) {
        router.push("/superadmin");
      } else {
        router.push("/admin");
      }
    } catch (error) {
      setError("Error al iniciar sesión. Verifica tus credenciales.");
      console.error("Login error:", error);
    }

    setLoading(false);
  }

  // Function to handle redirect to register with referral code
  const handleRegisterRedirect = () => {
    if (referralCode) {
      router.push(`/auth/register?ref=${referralCode}`);
    } else {
      router.push("/auth/register");
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
                  <Link
                    href="/auth/forgot-password"
                    className="font-medium text-amber-600 hover:text-amber-500 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
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
    </div>
  );
}
