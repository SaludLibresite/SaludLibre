# Sistema de Gestión de Zonas Geográficas

Este documento explica el nuevo sistema de zonas geográficas implementado para agrupar doctores por ubicación en lugar de mostrar todas las ubicaciones individuales.

## Características del Sistema

### Tipos de Zonas Soportados

1. **Zonas Circulares**
   - Definidas por un centro (latitud, longitud) y un radio en kilómetros
   - Ideales para áreas metropolitanas o regiones urbanas
   - Fáciles de crear y gestionar

2. **Zonas Poligonales**
   - Definidas por múltiples puntos que forman un polígono
   - Perfectas para barrios irregulares, comunas, o distritos específicos
   - Mayor precisión geográfica

### Funcionalidades Implementadas

#### Para Super Admin

1. **Gestión Completa de Zonas**
   - Crear nuevas zonas (circulares o poligonales)
   - Editar zonas existentes
   - Activar/desactivar zonas
   - Eliminar zonas
   - Ver estadísticas de doctores por zona

2. **Editor de Mapas Interactivo**
   - Integración con Google Maps
   - Herramientas de dibujo para crear polígonos
   - Círculos editables con arrastre para ajustar centro y radio
   - Vista previa en tiempo real

3. **Asignación Automática**
   - Función para asignar automáticamente doctores a zonas basándose en sus coordenadas
   - Reporte de asignaciones exitosas y fallidas
   - Actualización masiva de perfiles de doctores

#### Para Usuarios del Sitio

1. **Filtrado por Zonas**
   - El filtro de ubicación ahora muestra zonas en lugar de direcciones individuales
   - Contador de doctores por zona
   - Fallback a ubicaciones individuales si no hay zonas configuradas

2. **Compatibilidad con Búsqueda Cercana**
   - El sistema de "doctores cerca de mí" sigue funcionando independientemente
   - Las zonas y la búsqueda por proximidad coexisten

## Estructura de Datos

### Zona (medical_zones collection)

```javascript
{
  id: "zone_id",
  name: "Capital Federal Norte",
  description: "Zona norte de la Capital Federal incluyendo Palermo, Belgrano y Núñez",
  type: "polygon", // "circle" | "polygon"
  
  // Para zonas circulares
  center: {
    lat: -34.6037,
    lng: -58.3816
  },
  radius: 15, // en kilómetros
  
  // Para zonas poligonales
  coordinates: [
    { lat: -34.5555, lng: -58.4444 },
    { lat: -34.5666, lng: -58.4333 },
    { lat: -34.5777, lng: -58.4222 },
    // ... más puntos
  ],
  
  color: "#3B82F6", // Color para visualización en mapas
  isActive: true,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
}
```

### Doctor con Zona Asignada

```javascript
{
  // ... campos existentes del doctor
  assignedZone: {
    id: "zone_id",
    name: "Capital Federal Norte"
  },
  // ... resto de campos
}
```

## Servicios Implementados

### `zonesService.js`

#### Funciones Principales

- `getAllZones()` - Obtiene todas las zonas
- `getActiveZones()` - Obtiene solo las zonas activas
- `createZone(zoneData)` - Crea una nueva zona
- `updateZone(zoneId, updates)` - Actualiza una zona existente
- `deleteZone(zoneId)` - Elimina una zona
- `findZoneForCoordinates(lat, lng)` - Encuentra la zona que contiene una coordenada
- `groupDoctorsByZones(doctors)` - Agrupa doctores por zonas
- `assignZonesToDoctors(doctors)` - Asigna zonas a doctores automáticamente
- `getZonesWithDoctorCount()` - Obtiene zonas con contador de doctores

#### Algoritmos Utilizados

1. **Point-in-Polygon (Ray Casting)**
   - Para determinar si un doctor está dentro de una zona poligonal
   - Implementación eficiente con precisión geográfica

2. **Haversine Formula**
   - Para calcular distancias entre coordenadas
   - Usado para zonas circulares

## Componentes de UI

### `ZonesManagement.js`
- Panel principal de gestión de zonas
- Lista de zonas con estadísticas
- Modales para crear/editar zonas
- Funciones de asignación automática

### `ZoneMapEditor.js`
- Editor interactivo de mapas
- Herramientas de dibujo de Google Maps
- Vista previa en tiempo real
- Validación de datos geográficos

## Rutas Implementadas

- `/superadmin/zones` - Gestión de zonas
- `/superadmin/zones/create` - Crear nueva zona (modal)
- `/superadmin/zones/edit/:id` - Editar zona (modal)

## Configuración y Dependencias

### Variables de Entorno Requeridas

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### APIs de Google Maps Utilizadas

- **Maps JavaScript API** - Para renderizar mapas
- **Drawing Library** - Para herramientas de dibujo
- **Geometry Library** - Para cálculos geográficos

### Permisos de Firebase

Las zonas se almacenan en la collection `medical_zones`. Asegúrate de que las reglas de Firebase permitan:

```javascript
// Reglas de Firebase para zonas
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /medical_zones/{zoneId} {
      allow read: if true; // Lectura pública para filtros
      allow write: if request.auth != null && 
                      request.auth.token.email == 'juan@jhernandez.mx'; // Solo super admin
    }
  }
}
```

## Migración y Consideraciones

### Compatibilidad con Versiones Anteriores

- Si no hay zonas configuradas, el sistema automaticamente usa ubicaciones individuales
- Los doctores existentes sin coordenadas aparecen en "Sin zona asignada"
- La funcionalidad de búsqueda cercana no se ve afectada

### Proceso de Migración Recomendado

1. **Crear Zonas Principales**
   - Empezar con zonas amplias (provincias, regiones metropolitanas)
   - Usar zonas circulares para comenzar (más simples)

2. **Asignar Doctores**
   - Usar la función de asignación automática
   - Revisar doctores sin asignar manualmente

3. **Refinar Zonas**
   - Subdividir zonas grandes en zonas más específicas
   - Convertir a zonas poligonales para mayor precisión

4. **Pruebas**
   - Verificar filtros en página de doctores
   - Confirmar que búsqueda cercana sigue funcionando
   - Validar estadísticas en dashboard

## Beneficios del Sistema

### Para Usuarios
- **Navegación más intuitiva** - Filtrar por zonas conocidas en lugar de direcciones específicas
- **Mejor experiencia** - Menos opciones en el filtro, más organizadas
- **Contexto geográfico** - Entender mejor dónde están los doctores

### Para Administradores
- **Gestión centralizada** - Controlar cómo se agrupan los doctores geográficamente
- **Análisis mejorado** - Estadísticas por zona para entender distribución
- **Flexibilidad** - Crear zonas que reflejen realidades geográficas locales

### Para el Negocio
- **Escalabilidad** - Facilita la expansión a nuevas áreas geográficas
- **Marketing dirigido** - Campañas específicas por zona
- **Análisis de mercado** - Identificar áreas con alta/baja densidad de doctores

## Consideraciones Técnicas

### Performance
- Las consultas de zonas están optimizadas con índices en Firestore
- El cálculo de pertenencia a zona se hace en memoria (cliente)
- Cache de zonas activas para mejorar velocidad

### Precisión Geográfica
- Los algoritmos utilizados tienen precisión suficiente para uso urbano
- Se recomienda usar zonas de al menos 1km de radio para evitar problemas de borde
- Las coordenadas se almacenan con 6 decimales de precisión

### Limitaciones Conocidas
- Google Maps API tiene costos asociados
- Máximo recomendado: 100 zonas activas simultáneas
- Los polígonos complejos (muchos puntos) pueden afectar performance

## Mantenimiento

### Tareas Regulares
1. **Revisar asignaciones automáticas** - Especialmente cuando se agregan nuevos doctores
2. **Actualizar zonas** - Según cambios en la ciudad o expansión del servicio
3. **Monitorear estadísticas** - Identificar zonas con pocos doctores

### Troubleshooting
- Si los filtros no muestran zonas: verificar que hay zonas activas
- Si doctores no aparecen en zonas: revisar coordenadas y ejecutar reasignación
- Si el mapa no carga: verificar API key de Google Maps

## Futuras Mejoras

### Funcionalidades Planificadas
- **Zonas jerárquicas** - Zonas dentro de zonas (ej: barrios dentro de comunas)
- **Zonas automáticas** - Generación automática basada en densidad de doctores
- **Análisis predictivo** - Sugerir dónde crear nuevas zonas

### Integraciones Potenciales
- **Datos demográficos** - Correlacionar zonas con datos poblacionales
- **Transporte público** - Crear zonas basadas en accesibilidad
- **APIs gubernamentales** - Usar límites oficiales de distritos/comunas
