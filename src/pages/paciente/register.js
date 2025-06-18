import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
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
} from "@heroicons/react/24/outline";

export default function PatientRegister() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const validateStep1 = () => {
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

    if (!formData.phone.trim()) {
      newErrors.phone = "El teléfono es requerido";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "La fecha de nacimiento es requerida";
    }

    if (!formData.gender) {
      newErrors.gender = "El género es requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.address.trim()) {
      newErrors.address = "La dirección es requerida";
    }

    if (!formData.emergencyContact.trim()) {
      newErrors.emergencyContact = "El contacto de emergencia es requerido";
    }

    if (!formData.emergencyPhone.trim()) {
      newErrors.emergencyPhone = "El teléfono de emergencia es requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};

    if (!formData.doctorId) {
      newErrors.doctorId = "Debe seleccionar un doctor";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    let isValid = false;

    switch (step) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
    }

    if (isValid) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) {
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

      // Create patient document in Firestore
      const patientData = {
        ...formData,
        userId: userCredential.user.uid,
        userType: "patient",
        temporaryPassword: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        medicalHistory: formData.medicalHistory
          ? [
              {
                id: Date.now(),
                date: new Date(),
                notes: formData.medicalHistory,
                type: "initial_registration",
              },
            ]
          : [],
      };

      // Remove password fields before saving to Firestore
      delete patientData.password;
      delete patientData.confirmPassword;

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

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Información Personal
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono *
            </label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                  errors.phone ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="+54 11 1234-5678"
                disabled={loading}
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Nacimiento *
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  handleInputChange("dateOfBirth", e.target.value)
                }
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                  errors.dateOfBirth ? "border-red-500" : "border-gray-300"
                }`}
                disabled={loading}
              />
            </div>
            {errors.dateOfBirth && (
              <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Género *
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleInputChange("gender", e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                errors.gender ? "border-red-500" : "border-gray-300"
              }`}
              disabled={loading}
            >
              <option value="">Seleccionar género</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
            {errors.gender && (
              <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Información de Contacto y Médica
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección *
            </label>
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                  errors.address ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Av. Corrientes 1234, CABA"
                disabled={loading}
              />
            </div>
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contacto de Emergencia *
              </label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) =>
                  handleInputChange("emergencyContact", e.target.value)
                }
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                  errors.emergencyContact ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="María Pérez"
                disabled={loading}
              />
              {errors.emergencyContact && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.emergencyContact}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono de Emergencia *
              </label>
              <input
                type="tel"
                value={formData.emergencyPhone}
                onChange={(e) =>
                  handleInputChange("emergencyPhone", e.target.value)
                }
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                  errors.emergencyPhone ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="+54 11 9876-5432"
                disabled={loading}
              />
              {errors.emergencyPhone && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.emergencyPhone}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Obra Social/Prepaga
              </label>
              <input
                type="text"
                value={formData.insuranceProvider}
                onChange={(e) =>
                  handleInputChange("insuranceProvider", e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                placeholder="OSDE, Swiss Medical, etc."
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Afiliado
              </label>
              <input
                type="text"
                value={formData.insuranceNumber}
                onChange={(e) =>
                  handleInputChange("insuranceNumber", e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                placeholder="123456789"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alergias
            </label>
            <input
              type="text"
              value={formData.allergies}
              onChange={(e) => handleInputChange("allergies", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              placeholder="Penicilina, polen, etc."
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medicaciones Actuales
            </label>
            <input
              type="text"
              value={formData.currentMedications}
              onChange={(e) =>
                handleInputChange("currentMedications", e.target.value)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              placeholder="Losartán 50mg, Aspirina, etc."
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Historial Médico Relevante
            </label>
            <textarea
              value={formData.medicalHistory}
              onChange={(e) =>
                handleInputChange("medicalHistory", e.target.value)
              }
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              placeholder="Describa cualquier condición médica relevante..."
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Selección de Doctor
        </h3>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableDoctors.map((doctor) => (
            <div
              key={doctor.id}
              onClick={() => {
                setSelectedDoctor(doctor);
                handleInputChange("doctorId", doctor.id);
              }}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                selectedDoctor?.id === doctor.id
                  ? "border-amber-500 bg-amber-50"
                  : "border-gray-200 hover:border-amber-300 hover:bg-amber-25"
              }`}
            >
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center mr-4">
                  <span className="text-lg font-bold text-white">
                    {doctor.nombre
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "DR"}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {doctor.nombre}
                  </h4>
                  <p className="text-gray-600 text-sm">{doctor.especialidad}</p>
                  <p className="text-gray-500 text-xs">{doctor.ubicacion}</p>
                </div>
                {selectedDoctor?.id === doctor.id && (
                  <CheckCircleIcon className="h-6 w-6 text-amber-600" />
                )}
              </div>
            </div>
          ))}
        </div>

        {errors.doctorId && (
          <p className="text-red-500 text-sm mt-2">{errors.doctorId}</p>
        )}
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <CheckCircleIcon className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        ¡Registro Exitoso!
      </h3>
      <p className="text-gray-600 mb-4">
        Su cuenta ha sido creada correctamente. Será redirigido al dashboard en
        unos segundos.
      </p>
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 mx-auto"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
      <div className="min-h-screen flex">
        {/* Left side - Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-2xl">
            {/* Header */}
            <div className="text-center mb-8">
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

            {/* Progress indicator */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                {[1, 2, 3].map((stepNumber) => (
                  <div key={stepNumber} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step >= stepNumber
                          ? "bg-amber-600 text-white"
                          : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      {stepNumber}
                    </div>
                    {stepNumber < 3 && (
                      <div
                        className={`w-12 h-0.5 ml-4 ${
                          step > stepNumber ? "bg-amber-600" : "bg-gray-300"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
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

              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderSuccess()}

              {/* Form actions */}
              {step < 4 && (
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() =>
                      step > 1
                        ? setStep(step - 1)
                        : router.push("/paciente/login")
                    }
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    disabled={loading}
                  >
                    {step > 1 ? "Anterior" : "Volver al Login"}
                  </button>

                  <button
                    type="button"
                    onClick={step === 3 ? handleSubmit : handleNextStep}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Procesando...
                      </div>
                    ) : step === 3 ? (
                      "Completar Registro"
                    ) : (
                      "Siguiente"
                    )}
                  </button>
                </div>
              )}
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
            </div>
          </div>
        </div>

        {/* Right side - Hero */}
        <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-amber-600 via-yellow-600 to-orange-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative h-full flex items-center justify-center p-12">
            <div className="text-center text-white">
              <h2 className="text-4xl font-bold mb-6">
                Tu Salud, Nuestra Prioridad
              </h2>
              <p className="text-xl mb-8 text-amber-100">
                Únete a miles de pacientes que confían en nuestra plataforma
              </p>
              <div className="grid grid-cols-2 gap-6 text-left">
                <div className="bg-white bg-opacity-20 p-4 rounded-lg backdrop-blur-sm">
                  <h3 className="font-semibold mb-2">📅 Citas Online</h3>
                  <p className="text-sm text-amber-100">
                    Agenda tus consultas de manera rápida y sencilla
                  </p>
                </div>
                <div className="bg-white bg-opacity-20 p-4 rounded-lg backdrop-blur-sm">
                  <h3 className="font-semibold mb-2">📋 Historial Digital</h3>
                  <p className="text-sm text-amber-100">
                    Accede a tu historial médico desde cualquier lugar
                  </p>
                </div>
                <div className="bg-white bg-opacity-20 p-4 rounded-lg backdrop-blur-sm">
                  <h3 className="font-semibold mb-2">💊 Recetas Digitales</h3>
                  <p className="text-sm text-amber-100">
                    Descarga y gestiona tus prescripciones médicas
                  </p>
                </div>
                <div className="bg-white bg-opacity-20 p-4 rounded-lg backdrop-blur-sm">
                  <h3 className="font-semibold mb-2">🔔 Recordatorios</h3>
                  <p className="text-sm text-amber-100">
                    Nunca olvides una cita o medicación importante
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
