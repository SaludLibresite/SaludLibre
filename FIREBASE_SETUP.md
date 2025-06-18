# Configuración de Firebase para MedicosAR

## Pasos para configurar Firebase

### 1. Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Crear un proyecto"
3. Nombra tu proyecto (ej: "medicos-ar")
4. Habilita Google Analytics (opcional)
5. Espera a que se cree el proyecto

### 2. Configurar Authentication

1. En el panel de Firebase, ve a "Authentication" > "Get started"
2. Ve a la pestaña "Sign-in method"
3. Habilita "Email/Password"
4. Configura el dominio autorizado (localhost para desarrollo)

### 3. Configurar Firestore Database

1. Ve a "Firestore Database" > "Create database"
2. Selecciona "Start in test mode" (por ahora)
3. Elige una ubicación (ej: "south-america-east1")

### 4. Configurar Storage (opcional para imágenes)

1. Ve a "Storage" > "Get started"
2. Acepta las reglas por defecto

### 5. Obtener configuración del proyecto

1. Ve a "Project Settings" (icono de engrane)
2. En la sección "Your apps", haz clic en el icono web (</>)
3. Registra tu app con un nombre
4. Copia la configuración que aparece

### 6. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id_aqui
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id_aqui
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id_aqui
```

### 7. Configurar reglas de Firestore

Ve a "Firestore Database" > "Rules" y reemplaza con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura de doctores a todos (para la página pública)
    match /doctors/{document} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // Pacientes - solo el doctor que los creó puede acceder
    match /patients/{document} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.doctorUserId ||
         isDocumentOwner(request.auth.uid, resource.data.doctorId));
      allow create: if request.auth != null;
    }

    // Citas - lectura pública para crear citas, escritura solo para el doctor
    match /appointments/{document} {
      allow read: if true;
      allow create: if true; // Permitir que cualquiera pueda crear una cita
      allow update, delete: if request.auth != null &&
        isDocumentOwner(request.auth.uid, resource.data.doctorId);
    }

    // Función helper para verificar si un usuario es propietario de un documento
    function isDocumentOwner(userId, doctorId) {
      return exists(/databases/$(database)/documents/doctors/$(doctorId)) &&
             get(/databases/$(database)/documents/doctors/$(doctorId)).data.userId == userId;
    }

    // Otras colecciones solo para usuarios autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 8. Inicializar datos (opcional)

Puedes migrar los datos existentes del archivo JSON a Firestore ejecutando un script de migración.

## Estructura de datos en Firestore

### Colección: `doctors`

```javascript
{
  userId: "firebase_user_id",
  nombre: "Dr. Juan Pérez",
  slug: "juan-perez-cardiologo-1234567890",
  rango: "VIP", // "VIP", "Intermedio", "Normal"
  imagen: "img/doctor-1.jpg",
  descripcion: "Cardiólogo especialista...",
  especialidad: "Cardiología",
  telefono: "1234567890",
  email: "doctor@ejemplo.com",
  horario: "Lunes a Viernes, 9:00 AM - 5:00 PM",
  genero: "Masculino", // "Masculino", "Femenino", "Otro"
  consultaOnline: true,
  ubicacion: "Palermo",
  verified: false, // true cuando se verifique el profesional
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Funcionalidades implementadas

✅ **Autenticación**

- Registro de doctores
- Login/Logout
- Protección de rutas admin

✅ **Gestión de perfiles**

- Crear perfil de doctor al registrarse
- Editar perfil desde admin
- Visualización en página pública

✅ **Páginas implementadas**

- `/beneficios` - Página de beneficios para atraer doctores
- `/auth/login` - Página de login
- `/auth/register` - Página de registro con 2 pasos
- `/admin` - Dashboard protegido
- `/admin/profile` - Edición de perfil
- `/doctores` - Lista de doctores (consume Firebase)
- `/doctores/[slug]` - Perfil individual de doctor

## Próximos pasos

1. Configurar las variables de entorno
2. Migrar datos existentes (opcional)
3. Configurar reglas de seguridad más específicas
4. Implementar verificación de doctores
5. Añadir carga de imágenes a Storage
6. Implementar sistema de citas
7. Añadir notificaciones

## Comandos útiles

```bash
# Instalar dependencias
pnpm install

# Ejecutar en modo desarrollo
pnpm dev

# Build para producción
pnpm build
```
