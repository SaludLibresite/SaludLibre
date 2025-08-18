# Configuración de Google Authentication

## Resumen de Funcionalidades Implementadas

Se ha implementado el registro e inicio de sesión con Google para la plataforma de doctores, con las siguientes características:

### ✅ Funcionalidades Principales

1. **Botón de Google en Login y Registro**: Permite a los usuarios autenticarse con su cuenta de Google
2. **Verificación de Email Duplicado**: Previene que un email registrado con contraseña sea usado con Google
3. **Perfil Incompleto Obligatorio**: Los usuarios de Google deben completar su perfil profesional
4. **Modal No Escapable**: El modal de completar perfil no se puede cerrar hasta llenar todos los campos
5. **Retroalimentación Visual**: Mensajes de bienvenida y estado de carga claros
6. **Redirección Correcta**: Los nuevos usuarios van directamente al admin panel

### 🔧 Flujo de Funcionamiento

#### Para Nuevos Usuarios de Google:
1. Usuario hace clic en "Continuar con Google"
2. Se abre popup de Google para autenticación
3. Sistema verifica si el email ya existe con contraseña
4. Si es nuevo, crea perfil básico de doctor con `profileComplete: false`
5. Redirige a `/admin?welcome=true&newGoogleUser=true`
6. Muestra mensaje de bienvenida
7. Aparece modal obligatorio para completar perfil
8. Una vez completado, el usuario puede usar la plataforma

#### Para Usuarios Existentes de Google:
1. Inicio de sesión normal
2. Redirige a panel de admin
3. Si el perfil está incompleto, muestra modal

#### Para Emails Duplicados:
1. Si el email ya está registrado con contraseña
2. Cancela el login de Google
3. Muestra mensaje explicando que use login tradicional

## Configuración Requerida en Firebase

### 1. Habilitar Google Authentication

1. Ve a la [Consola de Firebase](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Ve a **Authentication > Sign-in method**
4. Habilita **Google** como proveedor
5. Configura el **Support email** (requerido)

### 2. Configurar OAuth 2.0

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona tu proyecto
3. Ve a **APIs & Services > Credentials**
4. Si no tienes un OAuth 2.0 client ID, créalo:
   - Clic en **Create Credentials > OAuth 2.0 Client ID**
   - Tipo: **Web application**
   - Name: `Doctores AR Web Client`

### 3. Configurar Dominios Autorizados

En el OAuth 2.0 client ID, configura:

**Authorized JavaScript origins:**
```
http://localhost:3000
https://tu-dominio.com
```

**Authorized redirect URIs:**
```
http://localhost:3000/__/auth/handler
https://tu-dominio.com/__/auth/handler
```

### 4. Variables de Entorno

Asegúrate de que estas variables estén configuradas en tu `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Archivos Modificados

### 1. AuthContext (`src/context/AuthContext.js`)
- ✅ Agregada función `loginWithGoogle`
- ✅ Importado `GoogleAuthProvider` y `signInWithPopup`
- ✅ Lógica para verificar usuarios duplicados
- ✅ Creación automática de perfil para nuevos usuarios de Google

### 2. Login Page (`src/pages/auth/login.js`)
- ✅ Botón de Google con diseño consistente
- ✅ Estados de carga independientes
- ✅ Manejo de errores específicos
- ✅ Redirección mejorada

### 3. Register Page (`src/pages/auth/register.js`)
- ✅ Botón de Google (solo en step 1)
- ✅ Mismo manejo de errores que login
- ✅ Soporte para códigos de referencia

### 4. AdminLayout (`src/components/admin/AdminLayout.js`)
- ✅ Detección de usuarios de Google con perfil incompleto
- ✅ Modal obligatorio para completar perfil
- ✅ Mensaje de bienvenida para nuevos usuarios
- ✅ Manejo de parámetros URL para bienvenida

### 5. CompleteProfileModal (`src/components/admin/CompleteProfileModal.js`)
- ✅ Modal no escapable (sin botón X)
- ✅ Validación completa de campos
- ✅ Carga de especialidades dinámicas
- ✅ Manejo de errores y estados de carga

### 6. DoctorsService (`src/lib/doctorsService.js`)
- ✅ Función `checkEmailExists` para verificar duplicados
- ✅ Función `createDoctorFromGoogle` para nuevos usuarios
- ✅ Función `updateDoctorProfileCompletion` para completar perfil
- ✅ Funciones auxiliares para verificar estado del perfil

## Estructura de Datos

### Doctor Profile (Google User)
```javascript
{
  userId: "google_user_id",
  email: "user@gmail.com",
  nombre: "Usuario de Google",
  photoURL: "https://lh3.googleusercontent.com/...",
  profileComplete: false, // Importante: false hasta completar
  isGoogleUser: true,     // Marca como usuario de Google
  // Campos vacíos que deben completarse:
  telefono: "",
  especialidad: "",
  descripcion: "",
  horario: "",
  genero: "",
  ubicacion: "",
  consultaOnline: false,
  rango: "Normal",
  slug: "", // Se genera al completar
  createdAt: timestamp,
  updatedAt: timestamp,
  referralCode: "REF123" // Si se usó código de referencia
}
```

## Testing

### Casos de Prueba

1. **Nuevo Usuario de Google**:
   - ✅ Registro exitoso
   - ✅ Creación de perfil básico
   - ✅ Redirección a admin con mensaje
   - ✅ Modal de completar perfil aparece
   - ✅ No puede cerrar modal hasta completar

2. **Usuario Existente de Google**:
   - ✅ Login exitoso
   - ✅ Si perfil incompleto, muestra modal
   - ✅ Si perfil completo, acceso normal

3. **Email Duplicado**:
   - ✅ Detecta email registrado con contraseña
   - ✅ Cancela login de Google
   - ✅ Muestra mensaje explicativo

4. **Códigos de Referencia**:
   - ✅ Funciona con registro Google
   - ✅ Se guarda en perfil del doctor

## Próximos Pasos

1. **Testing en Producción**: Verificar que funcione en el dominio de producción
2. **Monitoreo**: Agregar analytics para registros con Google
3. **Optimización**: Mejorar UX del flujo de completar perfil
4. **Notificaciones**: Email de bienvenida para usuarios de Google

## Solución de Problemas

### Error: "EMAIL_EXISTS"
- **Causa**: El email ya está registrado con contraseña
- **Solución**: Usuario debe usar login tradicional

### Error: Modal no aparece
- **Causa**: `profileComplete` es `true` o `isGoogleUser` es `false`
- **Solución**: Verificar datos en Firestore

### Error: Redirección incorrecta
- **Causa**: Parámetros URL no se están procesando
- **Solución**: Verificar router.query en AdminLayout

### Error: Botón Google no responde
- **Causa**: Configuración OAuth incorrecta
- **Solución**: Verificar dominios autorizados en Google Cloud Console
