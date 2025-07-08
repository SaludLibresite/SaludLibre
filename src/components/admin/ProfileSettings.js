import { useState, useEffect, useRef } from "react";
import { UserIcon, CameraIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import { getDoctorByUserId, updateDoctor } from "../../lib/doctorsService";
import { storage } from "../../lib/firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import GoogleMapsLocationPicker from "./GoogleMapsLocationPicker";

export default function ProfileSettings() {
  const { currentUser } = useAuth();
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const signatureInputRef = useRef(null);
  const stampInputRef = useRef(null);
  const [profile, setProfile] = useState({
    nombre: "",
    email: "",
    telefono: "",
    especialidad: "",
    descripcion: "",
    horario: "",
    genero: "",
    ubicacion: "",
    latitude: null,
    longitude: null,
    formattedAddress: "",
    consultaOnline: false,
    rango: "Normal",
    ageGroup: "ambos", // New field: menores, adultos, ambos
    photoURL: "",
    galleryImages: [],
    signatureURL: "",
    stampURL: "",
    workingHours: {
      monday: { start: "09:00", end: "17:00", enabled: true },
      tuesday: { start: "09:00", end: "17:00", enabled: true },
      wednesday: { start: "09:00", end: "17:00", enabled: true },
      thursday: { start: "09:00", end: "17:00", enabled: true },
      friday: { start: "09:00", end: "17:00", enabled: true },
      saturday: { start: "09:00", end: "13:00", enabled: false },
      sunday: { start: "09:00", end: "13:00", enabled: false },
    },
  });

  const [doctorId, setDoctorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [uploadingStamp, setUploadingStamp] = useState(false);
  const [message, setMessage] = useState("");

  // Load doctor profile on component mount
  useEffect(() => {
    async function loadDoctorProfile() {
      if (!currentUser) return;

      try {
        const doctorData = await getDoctorByUserId(currentUser.uid);
        if (doctorData) {
          setDoctorId(doctorData.id);
          setProfile((prevProfile) => ({
            ...prevProfile,
            ...doctorData,
          }));
        }
      } catch (error) {
        console.error("Error loading doctor profile:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDoctorProfile();
  }, [currentUser]);

  const [activeTab, setActiveTab] = useState("Personal");

  const handleInputChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleWorkingHoursChange = (day, field, value) => {
    setProfile((prev) => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value,
        },
      },
    }));
  };

  const handleLocationSelect = (locationData) => {
    setProfile((prev) => ({
      ...prev,
      latitude: locationData.lat,
      longitude: locationData.lng,
      formattedAddress: locationData.address,
      // Keep the old ubicacion field for backward compatibility
      ubicacion: locationData.address,
    }));
  };

  const handlePhotoUpload = async (file) => {
    if (!file || !currentUser) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage("Por favor selecciona un archivo de imagen válido");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage("La imagen no puede superar los 5MB");
      return;
    }

    try {
      setUploadingPhoto(true);
      setMessage("");

      // Create a reference to the file location in Firebase Storage
      const fileName = `profile-photos/${currentUser.uid}/${Date.now()}-${
        file.name
      }`;
      const storageRef = ref(storage, fileName);

      // Delete old photo if exists
      if (profile.photoURL) {
        try {
          // Extract the path from the URL for deletion
          const url = new URL(profile.photoURL);
          const pathParts = url.pathname.split("/o/")[1];
          if (pathParts) {
            const oldPhotoPath = decodeURIComponent(pathParts.split("?")[0]);
            const oldPhotoRef = ref(storage, oldPhotoPath);
            await deleteObject(oldPhotoRef);
          }
        } catch (error) {
          console.log("Old photo not found or couldn't be deleted:", error);
        }
      }

      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update profile state
      setProfile((prev) => ({
        ...prev,
        photoURL: downloadURL,
      }));

      // Save to database if doctorId exists
      if (doctorId) {
        await updateDoctor(doctorId, { photoURL: downloadURL });
      }

      setMessage("Foto subida correctamente");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error uploading photo:", error);
      setMessage("Error al subir la foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  const handleGalleryUpload = async (files) => {
    if (!files || files.length === 0 || !currentUser) return;

    // Validate total images limit (max 10)
    const currentImages = profile.galleryImages || [];
    if (currentImages.length + files.length > 10) {
      setMessage("Máximo 10 imágenes permitidas en la galería");
      return;
    }

    try {
      setUploadingGallery(true);
      setMessage("");

      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type and size
        if (!file.type.startsWith("image/")) {
          throw new Error(`${file.name} no es un archivo de imagen válido`);
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} supera el límite de 5MB`);
        }

        // Upload to Firebase Storage
        const fileName = `gallery/${currentUser.uid}/${Date.now()}-${
          file.name
        }`;
        const storageRef = ref(storage, fileName);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // Update profile state
      const newGalleryImages = [...currentImages, ...uploadedUrls];
      setProfile((prev) => ({
        ...prev,
        galleryImages: newGalleryImages,
      }));

      // Save to database if doctorId exists
      if (doctorId) {
        await updateDoctor(doctorId, { galleryImages: newGalleryImages });
      }

      setMessage(`${uploadedUrls.length} imagen(es) subida(s) correctamente`);
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error uploading gallery images:", error);
      setMessage(`Error al subir imágenes: ${error.message}`);
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleRemoveGalleryImage = async (imageUrl, index) => {
    try {
      setMessage("");

      // Remove from Firebase Storage
      try {
        const url = new URL(imageUrl);
        const pathParts = url.pathname.split("/o/")[1];
        if (pathParts) {
          const imagePath = decodeURIComponent(pathParts.split("?")[0]);
          const imageRef = ref(storage, imagePath);
          await deleteObject(imageRef);
        }
      } catch (error) {
        console.log(
          "Image not found in storage or couldn't be deleted:",
          error
        );
      }

      // Update profile state
      const newGalleryImages = profile.galleryImages.filter(
        (_, i) => i !== index
      );
      setProfile((prev) => ({
        ...prev,
        galleryImages: newGalleryImages,
      }));

      // Save to database if doctorId exists
      if (doctorId) {
        await updateDoctor(doctorId, { galleryImages: newGalleryImages });
      }

      setMessage("Imagen eliminada correctamente");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error removing gallery image:", error);
      setMessage("Error al eliminar la imagen");
    }
  };

  const handleGalleryFileChange = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleGalleryUpload(files);
    }
  };

  const handleSignatureUpload = async (file) => {
    if (!file || !currentUser) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage(
        "Por favor selecciona un archivo de imagen válido para la firma"
      );
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage("La imagen de la firma no puede superar los 2MB");
      return;
    }

    try {
      setUploadingSignature(true);
      setMessage("");

      // Create a reference to the file location in Firebase Storage
      const fileName = `signatures/${currentUser.uid}/${Date.now()}-${
        file.name
      }`;
      const storageRef = ref(storage, fileName);

      // Delete old signature if exists
      if (profile.signatureURL) {
        try {
          const url = new URL(profile.signatureURL);
          const pathParts = url.pathname.split("/o/")[1];
          if (pathParts) {
            const oldPath = decodeURIComponent(pathParts.split("?")[0]);
            const oldRef = ref(storage, oldPath);
            await deleteObject(oldRef);
          }
        } catch (error) {
          console.log("Old signature not found or couldn't be deleted:", error);
        }
      }

      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update profile state
      setProfile((prev) => ({
        ...prev,
        signatureURL: downloadURL,
      }));

      // Save to database if doctorId exists
      if (doctorId) {
        await updateDoctor(doctorId, { signatureURL: downloadURL });
      }

      setMessage("Firma subida correctamente");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error uploading signature:", error);
      setMessage("Error al subir la firma");
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleStampUpload = async (file) => {
    if (!file || !currentUser) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage(
        "Por favor selecciona un archivo de imagen válido para el sello"
      );
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage("La imagen del sello no puede superar los 2MB");
      return;
    }

    try {
      setUploadingStamp(true);
      setMessage("");

      // Create a reference to the file location in Firebase Storage
      const fileName = `stamps/${currentUser.uid}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, fileName);

      // Delete old stamp if exists
      if (profile.stampURL) {
        try {
          const url = new URL(profile.stampURL);
          const pathParts = url.pathname.split("/o/")[1];
          if (pathParts) {
            const oldPath = decodeURIComponent(pathParts.split("?")[0]);
            const oldRef = ref(storage, oldPath);
            await deleteObject(oldRef);
          }
        } catch (error) {
          console.log("Old stamp not found or couldn't be deleted:", error);
        }
      }

      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update profile state
      setProfile((prev) => ({
        ...prev,
        stampURL: downloadURL,
      }));

      // Save to database if doctorId exists
      if (doctorId) {
        await updateDoctor(doctorId, { stampURL: downloadURL });
      }

      setMessage("Sello subido correctamente");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error uploading stamp:", error);
      setMessage("Error al subir el sello");
    } finally {
      setUploadingStamp(false);
    }
  };

  const handleSignatureFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleSignatureUpload(file);
    }
  };

  const handleStampFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleStampUpload(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!doctorId) return;

    try {
      setSaving(true);
      setMessage("");

      // Remove workingHours from profile data for now since it's not in the main doctor schema
      const { workingHours, ...doctorData } = profile;

      await updateDoctor(doctorId, doctorData);
      setMessage("Perfil actualizado correctamente");

      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage("Error al guardar el perfil");
    } finally {
      setSaving(false);
    }
  };

  const tabs = ["Personal", "Profesional", "Galería", "Horarios", "Seguridad"];

  const dayNames = {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    sunday: "Domingo",
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Configuración del Perfil
        </h2>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? "border-blue-500 text-amber-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.includes("Error")
                ? "bg-red-50 text-red-800"
                : "bg-green-50 text-green-800"
            }`}
          >
            {message}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeTab === "Personal" && (
              <div className="space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                      {profile.photoURL ? (
                        <img
                          src={profile.photoURL}
                          alt="Foto de perfil"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-12 w-12 text-gray-600" />
                      )}
                    </div>
                    <button
                      onClick={handlePhotoClick}
                      disabled={uploadingPhoto}
                      className="absolute bottom-0 right-0 bg-amber-600 text-white p-2 rounded-full hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {uploadingPhoto ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <CameraIcon className="h-4 w-4" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Foto de Perfil
                    </h3>
                    <p className="text-sm text-gray-500">
                      Haz clic en el ícono de cámara para actualizar tu foto de
                      perfil
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Formatos soportados: JPG, PNG. Tamaño máximo: 5MB
                    </p>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={profile.nombre}
                      onChange={(e) =>
                        handleInputChange("nombre", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={profile.telefono}
                      onChange={(e) =>
                        handleInputChange("telefono", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Género
                    </label>
                    <select
                      value={profile.genero}
                      onChange={(e) =>
                        handleInputChange("genero", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación del Consultorio
                  </label>
                  <p className="text-sm text-gray-600 mb-4">
                    Selecciona la ubicación exacta de tu consultorio en el mapa.
                    Esto ayudará a los pacientes a encontrarte más fácilmente.
                  </p>
                  <GoogleMapsLocationPicker
                    initialLocation={
                      profile.latitude && profile.longitude
                        ? {
                            lat: profile.latitude,
                            lng: profile.longitude,
                            address:
                              profile.formattedAddress || profile.ubicacion,
                          }
                        : null
                    }
                    onLocationSelect={handleLocationSelect}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción Profesional
                  </label>
                  <textarea
                    value={profile.descripcion}
                    onChange={(e) =>
                      handleInputChange("descripcion", e.target.value)
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Describe tu experiencia profesional y especialidades..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={profile.consultaOnline}
                    onChange={(e) =>
                      handleInputChange("consultaOnline", e.target.checked)
                    }
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Ofrezco consultas online
                  </label>
                </div>
              </div>
            )}

            {activeTab === "Profesional" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Especialidad
                    </label>
                    <select
                      value={profile.especialidad}
                      onChange={(e) =>
                        handleInputChange("especialidad", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="">Selecciona tu especialidad</option>
                      <option value="Cardiología">Cardiología</option>
                      <option value="Dermatología">Dermatología</option>
                      <option value="Endocrinología">Endocrinología</option>
                      <option value="Gastroenterología">
                        Gastroenterología
                      </option>
                      <option value="Ginecología">Ginecología</option>
                      <option value="Medicina General">Medicina General</option>
                      <option value="Neurología">Neurología</option>
                      <option value="Odontología">Odontología</option>
                      <option value="Oftalmología">Oftalmología</option>
                      <option value="Pediatría">Pediatría</option>
                      <option value="Psiquiatría">Psiquiatría</option>
                      <option value="Traumatología">Traumatología</option>
                      <option value="Urología">Urología</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rango
                    </label>
                    <select
                      value={profile.rango}
                      onChange={(e) =>
                        handleInputChange("rango", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Intermedio">Intermedio</option>
                      <option value="VIP">VIP</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grupo de Edad que Atiende
                    </label>
                    <select
                      value={profile.ageGroup}
                      onChange={(e) =>
                        handleInputChange("ageGroup", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="ambos">Menores y Adultos</option>
                      <option value="menores">Solo Menores (Pediatría)</option>
                      <option value="adultos">Solo Adultos</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Especifica qué grupo de edad atiendes en tu consulta
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horarios de atención
                  </label>
                  <input
                    type="text"
                    value={profile.horario}
                    onChange={(e) =>
                      handleInputChange("horario", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Ej: Lunes a Viernes, 9:00 AM - 5:00 PM"
                  />
                </div>

                {/* Signature and Stamp Section */}
                <div className="mt-8">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Firma y Sello Profesional
                  </h4>
                  <p className="text-sm text-gray-600 mb-6">
                    Sube tu firma y sello profesional para ser incluidos
                    automáticamente en las recetas médicas.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Signature Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Firma Digital
                      </label>
                      <div className="flex flex-col items-center justify-center border-2 border-gray-300 border-dashed rounded-lg p-6 hover:border-amber-400 transition-colors">
                        {profile.signatureURL ? (
                          <div className="text-center">
                            <img
                              src={profile.signatureURL}
                              alt="Firma"
                              className="max-h-20 max-w-full object-contain mb-3"
                            />
                            <p className="text-sm text-gray-600 mb-3">
                              Firma actual
                            </p>
                            <button
                              onClick={() => signatureInputRef.current?.click()}
                              disabled={uploadingSignature}
                              className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50"
                            >
                              {uploadingSignature
                                ? "Subiendo..."
                                : "Cambiar Firma"}
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <CameraIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              Sube tu firma
                            </p>
                            <p className="text-xs text-gray-500 mb-4">
                              PNG, JPG hasta 2MB
                            </p>
                            <button
                              onClick={() => signatureInputRef.current?.click()}
                              disabled={uploadingSignature}
                              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                            >
                              {uploadingSignature
                                ? "Subiendo..."
                                : "Seleccionar Archivo"}
                            </button>
                          </div>
                        )}
                      </div>
                      <input
                        ref={signatureInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureFileChange}
                        className="hidden"
                      />
                    </div>

                    {/* Stamp Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sello Profesional
                      </label>
                      <div className="flex flex-col items-center justify-center border-2 border-gray-300 border-dashed rounded-lg p-6 hover:border-amber-400 transition-colors">
                        {profile.stampURL ? (
                          <div className="text-center">
                            <img
                              src={profile.stampURL}
                              alt="Sello"
                              className="max-h-20 max-w-full object-contain mb-3"
                            />
                            <p className="text-sm text-gray-600 mb-3">
                              Sello actual
                            </p>
                            <button
                              onClick={() => stampInputRef.current?.click()}
                              disabled={uploadingStamp}
                              className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50"
                            >
                              {uploadingStamp ? "Subiendo..." : "Cambiar Sello"}
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <CameraIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              Sube tu sello
                            </p>
                            <p className="text-xs text-gray-500 mb-4">
                              PNG, JPG hasta 2MB
                            </p>
                            <button
                              onClick={() => stampInputRef.current?.click()}
                              disabled={uploadingStamp}
                              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                            >
                              {uploadingStamp
                                ? "Subiendo..."
                                : "Seleccionar Archivo"}
                            </button>
                          </div>
                        )}
                      </div>
                      <input
                        ref={stampInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleStampFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Galería" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Galería de Trabajo
                  </h3>
                  <span className="text-sm text-gray-500">
                    {profile.galleryImages?.length || 0}/10 imágenes
                  </span>
                </div>

                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleGalleryFileChange}
                    className="hidden"
                    id="gallery-upload"
                    disabled={
                      uploadingGallery ||
                      (profile.galleryImages?.length || 0) >= 10
                    }
                  />
                  <label
                    htmlFor="gallery-upload"
                    className={`cursor-pointer ${
                      uploadingGallery ||
                      (profile.galleryImages?.length || 0) >= 10
                        ? "cursor-not-allowed opacity-50"
                        : ""
                    }`}
                  >
                    <div className="mx-auto h-12 w-12 text-gray-400">
                      {uploadingGallery ? (
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
                      ) : (
                        <svg
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-900">
                        {uploadingGallery
                          ? "Subiendo imágenes..."
                          : "Subir imágenes a la galería"}
                      </p>
                      <p className="text-sm text-gray-500">
                        PNG, JPG hasta 5MB cada una. Máximo 10 imágenes.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Gallery Grid */}
                {profile.galleryImages && profile.galleryImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {profile.galleryImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Galería ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          onClick={() =>
                            handleRemoveGalleryImage(imageUrl, index)
                          }
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
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
                    ))}
                  </div>
                )}

                {profile.galleryImages &&
                  profile.galleryImages.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        No hay imágenes en la galería aún.
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Sube imágenes de tu trabajo para mostrar a los
                        pacientes.
                      </p>
                    </div>
                  )}
              </div>
            )}

            {activeTab === "Horarios" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Horarios de Trabajo
                </h3>
                <div className="space-y-4">
                  {Object.entries(profile.workingHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center space-x-4">
                      <div className="w-24">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={hours.enabled}
                            onChange={(e) =>
                              handleWorkingHoursChange(
                                day,
                                "enabled",
                                e.target.checked
                              )
                            }
                            className="mr-2"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {dayNames[day]}
                          </span>
                        </label>
                      </div>
                      {hours.enabled && (
                        <>
                          <input
                            type="time"
                            value={hours.start}
                            onChange={(e) =>
                              handleWorkingHoursChange(
                                day,
                                "start",
                                e.target.value
                              )
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                          <span className="text-gray-500">a</span>
                          <input
                            type="time"
                            value={hours.end}
                            onChange={(e) =>
                              handleWorkingHoursChange(
                                day,
                                "end",
                                e.target.value
                              )
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "Seguridad" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Cambiar Contraseña
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contraseña Actual
                      </label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmar Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving || !doctorId}
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    "Guardar Cambios"
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
