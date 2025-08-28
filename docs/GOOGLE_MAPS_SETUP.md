# Configuración de Google Maps

Este documento explica cómo configurar la integración con Google Maps para la funcionalidad de ubicación de doctores.

## Requisitos Previos

1. Cuenta de Google Cloud Platform (GCP)
2. Proyecto de GCP con facturación habilitada
3. Google Maps JavaScript API habilitada

## Configuración Paso a Paso

### 1. Crear un Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Asegúrate de que la facturación esté habilitada para el proyecto

### 2. Habilitar las APIs Necesarias

En la consola de Google Cloud, habilita las siguientes APIs:

- **Maps JavaScript API** - Para mostrar mapas interactivos
- **Geocoding API** - Para convertir direcciones en coordenadas
- **Places API** - Para búsqueda y autocompletado de lugares

### 3. Crear una Clave de API

1. Ve a "APIs y servicios" > "Credenciales"
2. Haz clic en "Crear credenciales" > "Clave de API"
3. Copia la clave generada

### 4. Configurar Restricciones de la Clave de API

Para mayor seguridad, configura las siguientes restricciones:

#### Restricciones de API:

- Maps JavaScript API
- Geocoding API
- Places API

#### Restricciones de Aplicación (Opcional):

- Restricciones de referenciador HTTP para desarrollo web
- Agrega tu dominio (ej: `*.tudominio.com/*`)

### 5. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_clave_de_api_aqui
```

**⚠️ Importante:**

- Nunca commits la clave de API al repositorio
- Agrega `.env.local` a tu `.gitignore`
- Usa variables de entorno en producción

## Funcionalidades Implementadas

### 1. Selector de Ubicación para Doctores

- **Archivo:** `src/components/admin/GoogleMapsLocationPicker.js`
- **Propósito:** Permite a los doctores seleccionar su ubicación en el mapa
- **Características:**
  - Mapa interactivo con marcador arrastrable
  - Búsqueda de direcciones
  - Geocodificación reversa
  - Obtención de ubicación actual del usuario

### 2. Búsqueda de Doctores Cercanos

- **Archivo:** `src/components/doctoresPage/NearbyDoctorsButton.js`
- **Propósito:** Permite a los usuarios encontrar doctores cerca de su ubicación
- **Características:**
  - Geolocalización del usuario
  - Cálculo de distancias con fórmula de Haversine
  - Filtrado por radio de búsqueda (25km por defecto)
  - Ordenamiento por distancia

### 3. Almacenamiento de Coordenadas

Los perfiles de doctores ahora incluyen los siguientes campos:

- `latitude`: Latitud de la ubicación del consultorio
- `longitude`: Longitud de la ubicación del consultorio
- `formattedAddress`: Dirección formateada obtenida de Google Maps
- `ubicacion`: Campo de compatibilidad con versiones anteriores

## Estructura de Datos

### Perfil de Doctor con Ubicación

```javascript
{
  // ... otros campos del doctor
  latitude: -34.6037,
  longitude: -58.3816,
  formattedAddress: "Av. Corrientes 1234, Buenos Aires, Argentina",
  ubicacion: "Av. Corrientes 1234, Buenos Aires, Argentina" // backward compatibility
}
```

### Doctor con Distancia (en búsquedas cercanas)

```javascript
{
  // ... todos los campos del doctor
  distance: 2.35; // distancia en kilómetros
}
```

## Uso en el Código

### En ProfileSettings (Admin)

```javascript
// El componente GoogleMapsLocationPicker se integra automáticamente
// y maneja la selección de ubicación del doctor
```

### En la Página de Doctores

```javascript
// El botón "Encontrar cerca de mí" utiliza:
import { getDoctorsNearLocation } from "../../lib/doctorsService";

// Para buscar doctores en un radio específico
const nearbyDoctors = await getDoctorsNearLocation(
  latitude,
  longitude,
  radiusKm
);
```

## Consideraciones de Costos

Google Maps cobra por el uso de sus APIs. Considera implementar:

1. **Caché de resultados** para reducir llamadas a la API
2. **Límites de uso** para controlar costos
3. **Monitoreo de cuotas** en Google Cloud Console

## Solución de Problemas

### Error: "Google Maps API key not found"

- Verifica que la variable `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` esté configurada
- Asegúrate de que el archivo `.env.local` esté en la raíz del proyecto

### Error: "This API project is not authorized"

- Verifica que las APIs necesarias estén habilitadas
- Confirma que la clave de API tenga los permisos correctos

### Problemas de Geolocalización

- Los navegadores requieren HTTPS para geolocalización en producción
- Los usuarios deben otorgar permisos de ubicación

## Mejoras Futuras

1. **Autocompletado de direcciones** con Places Autocomplete
2. **Rutas y direcciones** con Directions API
3. **Mapa en tarjetas de doctor** para mostrar ubicación
4. **Filtros geográficos avanzados** (por barrio, zona, etc.)
5. **Caché de geocodificación** para optimizar rendimiento

## Referencias

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Geocoding API Documentation](https://developers.google.com/maps/documentation/geocoding)
- [Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
