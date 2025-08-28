# Sistema de Creación de Pacientes con Firebase Auth y Resend

## 📋 Descripción General
y
Este sistema permite a los doctores crear cuentas de pacientes automáticamente en Firebase Auth, almacenar sus datos en Firestore, y enviar emails de bienvenida con credenciales temporales usando Resend.

## 🏗️ Arquitectura del Sistema

```
Doctor crea paciente → API /api/patients/create → Firebase Admin SDK →
Firestore → Resend Email → Paciente recibe credenciales
```

### Componentes Principales:

1. **API Route**: `/src/pages/api/patients/create.js`
2. **Firebase Admin SDK**: `/src/lib/firebase-admin.js`
3. **Patient Service**: `/src/lib/patientsService.js` (actualizado)
4. **Patient Login**: `/src/pages/paciente/login.js`
5. **Patient Dashboard**: `/src/pages/paciente/dashboard.js`
6. **Email Templates**: HTML integrado en API route

## 🔧 Configuración Requerida

### 1. Variables de Entorno

Crea o actualiza tu archivo `.env.local` con las siguientes variables:

```env
# Firebase Configuration (existing)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (NEW - Required for server-side operations)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id

# Resend Email Configuration (NEW - Required for emails)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL="MédicsAR <noreply@email.jhernandez.mx>"

# Application Configuration (NEW - Optional)
NEXT_PUBLIC_APP_URL=https://medicos-ar.vercel.app
```

### 2. Configuración de Firebase Admin SDK

#### Paso 1: Generar Cuenta de Servicio

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Configuración del proyecto** (icono engrane)
4. Pestaña **Cuentas de servicio**
5. Clic en **Generar nueva clave privada**
6. Descarga el archivo JSON

#### Paso 2: Extraer Variables del JSON

Del archivo descargado, extrae estos valores para tu `.env.local`:

```json
{
  "type": "service_account",
  "project_id": "tu-project-id", // → FIREBASE_PROJECT_ID
  "private_key_id": "key-id", // → FIREBASE_PRIVATE_KEY_ID
  "private_key": "-----BEGIN PRIVATE...", // → FIREBASE_PRIVATE_KEY
  "client_email": "firebase-adminsdk...", // → FIREBASE_CLIENT_EMAIL
  "client_id": "123456789" // → FIREBASE_CLIENT_ID
}
```

### 3. Configuración de Resend

#### Paso 1: Crear Cuenta en Resend

1. Ve a [Resend.com](https://resend.com)
2. Crea una cuenta
3. Ve a **API Keys** en el dashboard
4. Crea una nueva API key

#### Paso 2: Configurar Dominio

1. Ve a **Domains** en Resend dashboard
2. Agrega `email.jhernandez.mx` como dominio
3. Configura los registros DNS requeridos
4. Verifica el dominio

## 📧 Sistema de Emails

### Template de Bienvenida

El sistema envía emails con:

- **Diseño profesional** con colores amber/yellow
- **Credenciales de acceso** (email + contraseña temporal)
- **Instrucciones de seguridad** para cambio de contraseña
- **Enlaces directos** al portal de pacientes
- **Información del doctor** que creó la cuenta

### Características del Email:

- ✅ Responsive design
- ✅ Compatibilidad con clientes de email
- ✅ Branding consistente con MédicsAR
- ✅ Información de seguridad clara
- ✅ Enlaces de acción prominentes

## 🔐 Flujo de Autenticación de Pacientes

### 1. Creación de Cuenta

```
Doctor → Formulario → API → Firebase Auth User → Firestore → Email
```

### 2. Primer Login

```
Paciente → Login → Detección de contraseña temporal → Formulario de cambio → Dashboard
```

### 3. Seguridad

- Contraseñas temporales de 12 caracteres
- Forzar cambio en primer login
- Flag `temporaryPassword` en Firestore
- Validación de email y contraseña

## 🏥 Funcionalidades del Portal de Pacientes

### Página de Login (`/paciente/login`)

- Autenticación con email/contraseña
- Detección automática de contraseñas temporales
- Formulario de cambio de contraseña integrado
- Validación en tiempo real
- Manejo de errores detallado

### Dashboard (`/paciente/dashboard`)

- Información personal del paciente
- Datos del doctor asignado
- Estadísticas de citas y historial
- Panel de funcionalidades futuras
- Logout seguro

## 🔄 Proceso de Creación Paso a Paso

1. **Doctor accede al panel admin** (`/admin/patients`)
2. **Clic en "Agregar Paciente"** o usar modal
3. **Completa formulario** con datos del paciente
4. **Sistema procesa la creación**:
   - Valida datos del doctor (autenticación)
   - Genera contraseña temporal segura
   - Crea usuario en Firebase Auth
   - Guarda datos en Firestore con referencias al doctor
   - Envía email de bienvenida con credenciales
5. **Paciente recibe email** con instrucciones de acceso
6. **Primer login del paciente**:
   - Ingresa credenciales temporales
   - Sistema detecta contraseña temporal
   - Fuerza cambio de contraseña
   - Redirige a dashboard

## 📊 Estructura de Datos

### Colección `patients`

```javascript
{
  // Datos del paciente
  name: "Juan Pérez",
  email: "juan@email.com",
  phone: "+54 11 1234-5678",
  dateOfBirth: "1990-01-15",
  gender: "Masculino",
  address: "Av. Corrientes 1234, CABA",

  // Referencias al doctor
  doctorId: "doctor_firestore_id",
  doctorUserId: "doctor_firebase_auth_uid",
  doctorName: "Dr. María García",

  // Datos médicos
  medicalHistory: [...],
  allergies: "Penicilina",
  currentMedications: "Losartán 50mg",
  insuranceProvider: "OSDE",
  insuranceNumber: "123456789",

  // Contacto de emergencia
  emergencyContact: "María Pérez",
  emergencyPhone: "+54 11 9876-5432",

  // Datos del sistema
  userId: "firebase_auth_uid",
  userType: "patient",
  temporaryPassword: true, // false después del primer cambio
  passwordChangedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
  isActive: true
}
```

## 🛠️ Comandos y Dependencias

### Instalación de Dependencias

```bash
pnpm install firebase-admin resend
```

### Dependencias Agregadas

- `firebase-admin`: SDK para operaciones server-side
- `resend`: Servicio de email transaccional

## 🚀 Despliegue

### Variables de Entorno en Producción

1. **Vercel**: Agrega todas las variables en dashboard
2. **Netlify**: Configura en Site settings > Environment variables
3. **Railway**: Variables en dashboard de proyecto

### Consideraciones de Seguridad

- ⚠️ **NUNCA** commitear el archivo JSON de cuenta de servicio
- ✅ Usar variables de entorno para todas las credenciales
- ✅ Rotar API keys periódicamente
- ✅ Validar permisos de Firebase Admin SDK
- ✅ Configurar reglas de Firestore apropiadas

## 🔍 Debugging y Monitoreo

### Logs Importantes

```javascript
// API Route logs
console.log(`Patient created: ${result.patientId}`);
console.log(`Welcome email sent to: ${patientEmail}`);

// Firebase errors
console.error("Error creating patient:", error);

// Email errors (no bloquean la creación)
console.error("Error sending welcome email:", error);
```

### Verificación del Sistema

1. **Test de creación**: Crear paciente de prueba
2. **Test de email**: Verificar recepción de credenciales
3. **Test de login**: Probar flujo completo de autenticación
4. **Test de cambio de contraseña**: Verificar primer login

## 📚 Próximas Mejoras

- [ ] Panel de gestión de pacientes más completo
- [ ] Sistema de citas integrado
- [ ] Historial médico expandido
- [ ] Comunicación doctor-paciente
- [ ] Notificaciones push
- [ ] Integración con sistemas de salud
- [ ] Reportes y estadísticas avanzadas

## 🎯 Beneficios del Sistema

### Para Doctores:

- Creación rápida de cuentas de pacientes
- Gestión centralizada de su base de pacientes
- Comunicación directa con pacientes
- Historiales médicos digitalizados

### Para Pacientes:

- Acceso 24/7 a información médica
- Portal seguro y privado
- Comunicación directa con su doctor
- Gestión de citas simplificada

### Para el Sistema:

- Escalabilidad con Firebase
- Seguridad robusta
- Backup automático de datos
- Integración con servicios modernos
