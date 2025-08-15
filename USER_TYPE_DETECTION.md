# Sistema de Detección de Tipo de Usuario

Este sistema implementa la detección automática del tipo de usuario (doctor, paciente, superadmin) y la redirección automática a los paneles correspondientes.

## Características

### 1. **Detección Automática de Tipo de Usuario**
- Al iniciar sesión, el sistema automáticamente detecta si el usuario es doctor, paciente o superadmin
- Los datos se almacenan en Zustand con persistencia para evitar consultas repetidas a Firebase

### 2. **Redirección Inteligente**
- Los usuarios son redirigidos automáticamente a su panel correspondiente
- Se previene el acceso no autorizado entre paneles

### 3. **Estado Persistente**
- Los datos del tipo de usuario se guardan localmente usando Zustand persist
- Evita consultas repetidas a Firebase en cada carga de página

## Componentes Principales

### 1. **User Store (`src/store/userStore.js`)**
```javascript
const { userType, userProfile, isDoctor, isPatient, isSuperAdmin } = useUserStore();
```

### 2. **Servicio de Detección (`src/lib/userTypeService.js`)**
- `detectUserType(user)` - Detecta el tipo de usuario desde Firebase
- `canAccessPanel(userType, requiredType)` - Valida permisos de acceso
- `getRedirectUrl(userType, intendedPanel)` - Obtiene URL de redirección

### 3. **Componentes de Protección**
- `ProtectedRoute` - Para rutas de admin (doctores/superadmin)
- `ProtectedPatientRoute` - Para rutas de pacientes
- `UserTypeProtection` - HOC genérico

## Cómo Funciona

### 1. **Proceso de Login**
1. Usuario inicia sesión en cualquier panel
2. AuthContext detecta el cambio de autenticación
3. Se ejecuta `detectUserType()` para determinar el tipo de usuario
4. Los datos se almacenan en `userStore`
5. El usuario es redirigido al panel correcto

### 2. **Validación de Acceso**
```javascript
// En las páginas protegidas
const { userType } = useUserStore();

if (!canAccessPanel(userType, 'doctor')) {
  // Redirigir a panel correcto
}
```

### 3. **Navegación Inteligente**
El componente `LoginButton` muestra diferentes opciones según el estado del usuario:
- Usuario no autenticado: Botones "Pacientes" y "Doctores"
- Usuario autenticado: "Mi Panel" + información del usuario

## Configuración de SuperAdmin

Los emails de superadmin se configuran en `src/lib/userTypeService.js`:

```javascript
const superAdminEmails = [
  "admin@medicos-ar.com",
  "superadmin@medicos-ar.com",
  "juan@jhernandez.mx",
  // Agregar más emails según sea necesario
];
```

## Rutas Protegidas

### Doctores/SuperAdmin
- `/admin/*` - Panel de administración médica
- `/superadmin/*` - Panel de super administración

### Pacientes
- `/paciente/dashboard`
- `/paciente/*` - Todas las rutas de pacientes

## Ejemplos de Uso

### Proteger una página de admin:
```javascript
import ProtectedRoute from '../../components/ProtectedRoute';

export default function AdminPage() {
  return (
    <ProtectedRoute requiredUserType="doctor">
      {/* Contenido del panel de admin */}
    </ProtectedRoute>
  );
}
```

### Proteger una página de paciente:
```javascript
import ProtectedPatientRoute from '../../components/paciente/ProtectedPatientRoute';

export default function PatientPage() {
  return (
    <ProtectedPatientRoute>
      {/* Contenido del panel de paciente */}
    </ProtectedPatientRoute>
  );
}
```

### Usando el hook de acceso:
```javascript
import { useUserTypeAccess } from '../../components/UserTypeProtection';

function MyComponent() {
  const { isLoading, isAuthorized, userType } = useUserTypeAccess('doctor');
  
  if (isLoading) return <div>Cargando...</div>;
  if (!isAuthorized) return <div>Sin acceso</div>;
  
  return <div>Contenido para {userType}</div>;
}
```

## Flujos de Redirección

### Login de Doctor
1. `/auth/login` → Detecta tipo → `/admin` (doctor) o `/superadmin` (superadmin)
2. Si es paciente: Mensaje de error + redirección a `/paciente/dashboard`

### Login de Paciente
1. `/paciente/login` → Detecta tipo → `/paciente/dashboard`
2. Si es doctor: Mensaje de error + redirección a `/admin`
3. Si es superadmin: Mensaje de error + redirección a `/superadmin`

### Navegación del NavBar
- Usuario no autenticado: Opciones para ambos tipos de login
- Usuario autenticado: Botón "Mi Panel" que lleva al dashboard correcto

## Beneficios

1. **Seguridad**: Previene acceso no autorizado entre paneles
2. **UX Mejorada**: Redirección automática sin confusión
3. **Performance**: Estado persistente evita consultas repetidas
4. **Mantenibilidad**: Sistema centralizado y reutilizable
5. **Escalabilidad**: Fácil agregar nuevos tipos de usuario
