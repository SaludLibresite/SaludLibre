import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Autocomplete from "react-google-autocomplete";
import { useAuth } from "../../../context/AuthContext";
import { getDoctorById, updateDoctor } from '../../../lib/doctorsService';
import { getAllSpecialties } from '../../../lib/specialtiesService';
import { storage } from '../../../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import SuperAdminLayout from '../../../components/superadmin/SuperAdminLayout';

// Lista de emails autorizados como superadmin
const SUPERADMIN_EMAILS = ["juan@jhernandez.mx"];

export default function EditDoctorPage() {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser, loading: authLoading } = useAuth();
  const fileInputRef = useRef(null);
  
  const [doctor, setDoctor] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    especialidad: '',
    dni: '',
    telefono: '',
    descripcion: '',
    experiencia: '',
    graduacion: '',
    universidad: '',
    slug: '',
    photoURL: ''
  });
  const [locationData, setLocationData] = useState({
    formattedAddress: '',
    latitude: null,
    longitude: null
  });
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Authentication check
  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        router.push("/superadmin");
        return;
      }

      if (!SUPERADMIN_EMAILS.includes(currentUser.email)) {
        router.push("/superadmin");
        return;
      }
    }
  }, [currentUser, authLoading, router]);

  // Load doctor data
  useEffect(() => {
    const loadDoctor = async () => {
      if (!id || !currentUser || !SUPERADMIN_EMAILS.includes(currentUser.email)) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const doctorData = await getDoctorById(id);
        
        if (!doctorData) {
          setError('Doctor no encontrado');
          return;
        }
        
        setDoctor(doctorData);
        
        // Initialize form data
        setFormData({
          nombre: doctorData.nombre || '',
          email: doctorData.email || '',
          especialidad: doctorData.especialidad || '',
          dni: doctorData.dni || '',
          telefono: doctorData.telefono || '',
          descripcion: doctorData.descripcion || '',
          experiencia: doctorData.experiencia || '',
          graduacion: doctorData.graduacion || '',
          universidad: doctorData.universidad || '',
          slug: doctorData.slug || '',
          photoURL: doctorData.photoURL || ''
        });
        
        // Initialize location data
        setLocationData({
          formattedAddress: doctorData.formattedAddress || doctorData.ubicacion || '',
          latitude: doctorData.latitude || null,
          longitude: doctorData.longitude || null
        });
      } catch (err) {
        console.error('Error loading doctor:', err);
        setError('Error al cargar los datos del doctor');
      } finally {
        setLoading(false);
      }
    };

    loadDoctor();
  }, [id, currentUser]);

  // Load specialties
  useEffect(() => {
    const loadSpecialties = async () => {
      try {
        const allSpecialties = await getAllSpecialties();
        const activeSpecialties = allSpecialties.filter(s => s.isActive !== false);
        setSpecialties(activeSpecialties);
      } catch (error) {
        console.error('Error loading specialties:', error);
      }
    };

    if (currentUser && SUPERADMIN_EMAILS.includes(currentUser.email)) {
      loadSpecialties();
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Photo upload handler
  const handlePhotoUpload = async (file) => {
    if (!file || !id) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage({ type: 'error', text: 'Por favor seleccioná un archivo de imagen válido' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'La imagen no puede superar los 5MB' });
      return;
    }

    try {
      setUploadingPhoto(true);
      setMessage({ type: '', text: '' });

      // Create a reference to the file location in Firebase Storage
      const fileName = `profile-photos/doctor-${id}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, fileName);

      // Delete old photo if exists
      if (formData.photoURL) {
        try {
          const url = new URL(formData.photoURL);
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

      // Update form state
      setFormData(prev => ({
        ...prev,
        photoURL: downloadURL,
      }));

      // Save to database immediately
      await updateDoctor(id, { photoURL: downloadURL });

      setMessage({ type: 'success', text: 'Foto subida correctamente' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error("Error uploading photo:", error);
      setMessage({ type: 'error', text: 'Error al subir la foto' });
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

  const handleRemovePhoto = async () => {
    if (!formData.photoURL || !id) return;
    
    if (!confirm('¿Estás seguro de que querés eliminar la foto?')) return;

    try {
      setUploadingPhoto(true);
      
      // Delete from storage
      try {
        const url = new URL(formData.photoURL);
        const pathParts = url.pathname.split("/o/")[1];
        if (pathParts) {
          const photoPath = decodeURIComponent(pathParts.split("?")[0]);
          const photoRef = ref(storage, photoPath);
          await deleteObject(photoRef);
        }
      } catch (error) {
        console.log("Photo not found in storage:", error);
      }

      // Update form state
      setFormData(prev => ({
        ...prev,
        photoURL: '',
      }));

      // Save to database
      await updateDoctor(id, { photoURL: '' });

      setMessage({ type: 'success', text: 'Foto eliminada correctamente' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error("Error removing photo:", error);
      setMessage({ type: 'error', text: 'Error al eliminar la foto' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate required fields
      if (!formData.nombre.trim()) {
        alert('El nombre es requerido');
        setSaving(false);
        return;
      }

      if (!formData.email.trim()) {
        alert('El email es requerido');
        setSaving(false);
        return;
      }

      if (!formData.especialidad) {
        alert('La especialidad es requerida');
        setSaving(false);
        return;
      }

      // Prepare update data
      const updateData = {};
      Object.keys(formData).forEach(key => {
        if (key !== 'ubicacion' && formData[key] && String(formData[key]).trim() !== '') {
          updateData[key] = String(formData[key]).trim();
        }
      });

      // Always include required fields
      updateData.nombre = formData.nombre.trim();
      updateData.email = formData.email.trim();
      updateData.especialidad = formData.especialidad;

      // Add location data
      if (locationData.formattedAddress) {
        updateData.formattedAddress = locationData.formattedAddress;
        updateData.ubicacion = locationData.formattedAddress;
      }

      if (locationData.latitude !== null && locationData.longitude !== null) {
        updateData.latitude = locationData.latitude;
        updateData.longitude = locationData.longitude;
      }

      await updateDoctor(id, updateData);

      setMessage({ type: 'success', text: 'Doctor actualizado exitosamente' });
      setTimeout(() => {
        router.push('/superadmin/doctors');
      }, 1500);
    } catch (error) {
      console.error('Error updating doctor:', error);
      setMessage({ type: 'error', text: 'Error al actualizar el doctor: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-600">Cargando datos del doctor...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <SuperAdminLayout>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold text-red-800 mb-2">{error}</h2>
            <Link 
              href="/superadmin/doctors"
              className="inline-flex items-center text-red-600 hover:text-red-700 font-medium mt-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver a la lista de doctores
            </Link>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/superadmin/doctors"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Editar Doctor</h1>
              <p className="text-sm text-gray-500">ID: {id}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {doctor?.verified && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verificado
              </span>
            )}
            {doctor?.subscriptionPlan && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                Plan: {doctor.subscriptionPlan}
              </span>
            )}
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Left Column - Photo */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Foto de Perfil
                </h2>
                
                <div className="flex flex-col items-center">
                  {/* Photo Preview */}
                  <div 
                    onClick={handlePhotoClick}
                    className="relative w-48 h-48 rounded-full overflow-hidden bg-gray-100 cursor-pointer group border-4 border-gray-200 hover:border-blue-400 transition-colors"
                  >
                    {formData.photoURL ? (
                      <img
                        src={formData.photoURL}
                        alt={formData.nombre || 'Doctor'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {uploadingPhoto ? (
                        <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* Action Buttons */}
                  <div className="mt-4 flex flex-col gap-2 w-full">
                    <button
                      type="button"
                      onClick={handlePhotoClick}
                      disabled={uploadingPhoto}
                      className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center font-medium"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      {uploadingPhoto ? 'Subiendo...' : 'Subir Foto'}
                    </button>
                    
                    {formData.photoURL && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        disabled={uploadingPhoto}
                        className="w-full px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center font-medium border border-red-200"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar Foto
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-4 text-center">
                    Formatos: JPG, PNG, GIF<br />
                    Tamaño máximo: 5MB
                  </p>
                </div>

                {/* Quick Info */}
                {doctor && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Información Rápida</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Creado:</span>
                        <span className="text-gray-900">
                          {doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString('es-AR') : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Última actualización:</span>
                        <span className="text-gray-900">
                          {doctor.updatedAt ? new Date(doctor.updatedAt).toLocaleDateString('es-AR') : 'N/A'}
                        </span>
                      </div>
                      {doctor.subscriptionExpiresAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Suscripción expira:</span>
                          <span className="text-gray-900">
                            {new Date(doctor.subscriptionExpiresAt).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Form Fields */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Basic Information Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Información Básica
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      placeholder="Dr. Juan Pérez"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      DNI
                    </label>
                    <input
                      type="text"
                      name="dni"
                      value={formData.dni}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      placeholder="12345678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      placeholder="doctor@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      placeholder="+54 11 1234-5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Especialidad <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="especialidad"
                      value={formData.especialidad}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    >
                      <option value="">Seleccionar especialidad</option>
                      {specialties.map(specialty => (
                        <option key={specialty.id} value={specialty.title}>
                          {specialty.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slug (URL amigable)
                    </label>
                    <div className="flex items-center">
                      <span className="text-gray-500 text-sm mr-2">saludlibre.com/doctores/</span>
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                        placeholder="dr-juan-perez"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Ubicación del Consultorio
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <Autocomplete
                    apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                    onPlaceSelected={(place) => {
                      if (place.geometry) {
                        setLocationData({
                          formattedAddress: place.formatted_address,
                          latitude: place.geometry.location.lat(),
                          longitude: place.geometry.location.lng()
                        });
                      }
                    }}
                    options={{
                      types: ['address'],
                      componentRestrictions: { country: 'ar' },
                    }}
                    defaultValue={doctor?.formattedAddress || doctor?.ubicacion || ''}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    placeholder="Comenzá a escribir una dirección..."
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    💡 Escribí la dirección y seleccioná una opción del menú desplegable
                  </p>
                  
                  {locationData.latitude && locationData.longitude && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-green-800">Ubicación guardada</p>
                          <p className="text-sm text-green-700 mt-1">{locationData.formattedAddress}</p>
                          <p className="text-xs text-green-600 mt-1">
                            Coordenadas: {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Information Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Información Profesional
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Años de Experiencia
                    </label>
                    <input
                      type="number"
                      name="experiencia"
                      value={formData.experiencia}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      placeholder="5"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Año de Graduación
                    </label>
                    <input
                      type="number"
                      name="graduacion"
                      value={formData.graduacion}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      placeholder="2015"
                      min="1950"
                      max={new Date().getFullYear()}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Universidad
                    </label>
                    <input
                      type="text"
                      name="universidad"
                      value={formData.universidad}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      placeholder="Universidad de Buenos Aires"
                    />
                  </div>

                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción Profesional
                    </label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleInputChange}
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
                      placeholder="Breve descripción sobre la práctica médica, especialización, áreas de interés, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <p className="text-sm text-gray-500">
                    <span className="text-red-500">*</span> Campos requeridos
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/superadmin/doctors"
                      className="px-6 py-3 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors text-center font-medium"
                    >
                      Cancelar
                    </Link>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
                    >
                      {saving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Guardar Cambios
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </SuperAdminLayout>
  );
}
