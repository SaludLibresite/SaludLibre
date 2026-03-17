'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const GENDERS = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'other', label: 'Otro' },
  { value: 'not_specified', label: 'Prefiero no decir' },
];

export default function PatientRegisterPage() {
  const { signup, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    insuranceProvider: '',
    insuranceNumber: '',
    allergies: '',
    currentMedications: '',
    medicalHistory: '',
    referralCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validateStep1(): boolean {
    setError('');
    if (!form.name.trim()) { setError('Ingresá tu nombre completo'); return false; }
    if (!form.email.trim()) { setError('Ingresá tu email'); return false; }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return false; }
    if (form.password !== form.confirmPassword) { setError('Las contraseñas no coinciden'); return false; }
    if (!form.phone.trim()) { setError('Ingresá tu teléfono'); return false; }
    if (!form.dateOfBirth) { setError('Ingresá tu fecha de nacimiento'); return false; }
    if (!form.gender) { setError('Seleccioná tu género'); return false; }
    return true;
  }

  function goToStep2() {
    if (validateStep1()) setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userCredential = await signup(form.email, form.password);
      const token = await userCredential.getIdToken();

      await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          dateOfBirth: form.dateOfBirth,
          gender: form.gender,
          address: form.address.trim(),
          registrationMethod: 'email',
          allergies: form.allergies.trim(),
          currentMedications: form.currentMedications.trim(),
          medicalHistory: form.medicalHistory.trim(),
          insuranceProvider: form.insuranceProvider.trim(),
          insuranceNumber: form.insuranceNumber.trim(),
          emergencyContactName: form.emergencyContactName.trim(),
          emergencyContactPhone: form.emergencyContactPhone.trim(),
          referralCode: form.referralCode.trim(),
        }),
      });

      router.push('/paciente/dashboard');
    } catch {
      setError('Error al crear la cuenta. El email puede estar en uso.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    try {
      await loginWithGoogle();
      router.push('/paciente/dashboard');
    } catch {
      setError('Error al registrarse con Google');
    }
  }

  const inputClass = 'block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20';

  return (
    <div className="min-h-[85vh] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-800 via-green-700 to-emerald-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Creá tu cuenta</h2>
          <p className="text-lg text-white/70 mb-8 max-w-md">
            Registrate gratis y empezá a gestionar tu salud de forma digital, simple y segura.
          </p>

          {/* Step indicator */}
          <div className="flex items-center gap-4 mb-8">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-white' : 'text-white/40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-white text-green-700' : 'bg-white/20'}`}>1</div>
              <span className="text-sm font-medium">Datos personales</span>
            </div>
            <div className={`w-8 h-px ${step >= 2 ? 'bg-white' : 'bg-white/20'}`} />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-white' : 'text-white/40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-white text-green-700' : 'bg-white/20'}`}>2</div>
              <span className="text-sm font-medium">Info adicional</span>
            </div>
          </div>

          <div className="space-y-3 text-white/60 text-sm">
            <p>Tu información está protegida y nunca será compartida sin tu consentimiento.</p>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <Link href="/" className="inline-block">
              <img src="/img/logo.png" alt="SaludLibre" width={48} height={48} className="mx-auto" />
            </Link>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Registrate como paciente</h1>
            <p className="mt-1 text-sm text-gray-500">
              {step === 1 ? 'Completá tus datos personales' : 'Información médica (opcional)'}
            </p>
          </div>

          {/* Mobile step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6 lg:hidden">
            <div className={`w-3 h-3 rounded-full ${step === 1 ? 'bg-green-600' : 'bg-green-200'}`} />
            <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-green-600' : 'bg-gray-200'}`} />
            <div className={`w-3 h-3 rounded-full ${step === 2 ? 'bg-green-600' : 'bg-green-200'}`} />
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-100">
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                <span>{error}</span>
              </div>
            )}

            {step === 1 && (
              <>
                <button onClick={handleGoogle}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:border-gray-300">
                  <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Registrarse con Google
                </button>

                <div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-gray-200" /><span className="text-xs text-gray-400">o completá el formulario</span><div className="h-px flex-1 bg-gray-200" /></div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre completo <span className="text-red-500">*</span></label>
                    <input type="text" required value={form.name} onChange={(e) => update('name', e.target.value)}
                      className={inputClass} placeholder="Juan Pérez" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                    <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)}
                      className={inputClass} placeholder="tu@email.com" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contraseña <span className="text-red-500">*</span></label>
                      <div className="mt-1 relative">
                        <input type={showPassword ? 'text' : 'password'} required value={form.password} onChange={(e) => update('password', e.target.value)}
                          className={`${inputClass} pr-10`} placeholder="Min. 6 caracteres" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {showPassword
                              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                            }
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Confirmar <span className="text-red-500">*</span></label>
                      <input type="password" required value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)}
                        className={inputClass} placeholder="••••••••" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Teléfono <span className="text-red-500">*</span></label>
                      <input type="tel" required value={form.phone} onChange={(e) => update('phone', e.target.value)}
                        className={inputClass} placeholder="+54 11 1234-5678" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fecha de nacimiento <span className="text-red-500">*</span></label>
                      <input type="date" required value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)}
                        className={inputClass} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Género <span className="text-red-500">*</span></label>
                    <select value={form.gender} onChange={(e) => update('gender', e.target.value)}
                      className={inputClass}>
                      <option value="">Seleccionar...</option>
                      {GENDERS.map((g) => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))}
                    </select>
                  </div>

                  <button type="button" onClick={goToStep2}
                    className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition hover:bg-green-700 shadow-sm">
                    Continuar
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                  Estos campos son opcionales. Podés completarlos ahora o después desde tu perfil.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Dirección</label>
                  <input type="text" value={form.address} onChange={(e) => update('address', e.target.value)}
                    className={inputClass} placeholder="Av. Corrientes 1234, CABA" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contacto de emergencia</label>
                    <input type="text" value={form.emergencyContactName} onChange={(e) => update('emergencyContactName', e.target.value)}
                      className={inputClass} placeholder="Nombre" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tel. emergencia</label>
                    <input type="tel" value={form.emergencyContactPhone} onChange={(e) => update('emergencyContactPhone', e.target.value)}
                      className={inputClass} placeholder="+54 11 0000-0000" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Obra social / Prepaga</label>
                    <input type="text" value={form.insuranceProvider} onChange={(e) => update('insuranceProvider', e.target.value)}
                      className={inputClass} placeholder="Ej: OSDE, Swiss Medical" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">N° de afiliado</label>
                    <input type="text" value={form.insuranceNumber} onChange={(e) => update('insuranceNumber', e.target.value)}
                      className={inputClass} placeholder="N° de afiliado" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Alergias</label>
                  <textarea value={form.allergies} onChange={(e) => update('allergies', e.target.value)}
                    className={`${inputClass} resize-none`} rows={2} placeholder="Ej: Penicilina, Ibuprofeno..." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Medicamentos actuales</label>
                  <textarea value={form.currentMedications} onChange={(e) => update('currentMedications', e.target.value)}
                    className={`${inputClass} resize-none`} rows={2} placeholder="Ej: Losartán 50mg, Metformina..." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Antecedentes médicos</label>
                  <textarea value={form.medicalHistory} onChange={(e) => update('medicalHistory', e.target.value)}
                    className={`${inputClass} resize-none`} rows={2} placeholder="Ej: Hipertensión, Diabetes tipo 2..." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Código de referido</label>
                  <input type="text" value={form.referralCode} onChange={(e) => update('referralCode', e.target.value)}
                    className={inputClass} placeholder="Si te lo dio un médico" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                    Volver
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50 shadow-sm">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Creando cuenta...
                      </span>
                    ) : 'Crear Cuenta'}
                  </button>
                </div>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-gray-500">
              ¿Ya tenés cuenta?{' '}
              <Link href="/paciente/login" className="font-medium text-green-600 hover:underline">Iniciá sesión</Link>
            </p>

            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                ¿Sos médico?{' '}
                <Link href="/auth/register" className="text-[#4dbad9] hover:underline font-medium">Registrate acá</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
