# URLs Compartibles - Sistema de Filtros

## Descripción
El sistema de búsqueda de doctores ahora soporta URLs compartibles que mantienen el estado de los filtros aplicados. Los usuarios pueden compartir enlaces con filtros específicos para ayudar a otros a encontrar doctores con características particulares.

## Parámetros de URL Disponibles

### Búsqueda y Filtros Básicos
- `?search=texto` - Búsqueda por nombre o especialidad del doctor
- `?especialidad=nombre` - Filtrar por especialidad médica específica
- `?genero=valor` - Filtrar por género (`Masculino`, `Femenino`, `Otro`)

### Filtros de Servicio
- `?online=true|false` - Filtrar por disponibilidad de consulta online
- `?plan=tipo` - Filtrar por plan de suscripción (`VIP`, `Intermedio`, `Básico`)
- `?prepaga=nombre` - Filtrar por obra social/prepaga aceptada

### Filtros de Ubicación y Edad
- `?zona=barrio` - Filtrar por zona/barrio de Buenos Aires
- `?edad=grupo` - Filtrar por grupo de edad atendido (`menores`, `adultos`, `ambos`)

### Paginación
- `?pagina=numero` - Página actual de resultados

## Ejemplos de URLs

### Pediatras en Palermo
```
/doctores?especialidad=Pediatría&zona=Palermo
```

### Cardiólogos con consulta online
```
/doctores?especialidad=Cardiología&online=true
```

### Dermatólogos Premium en Recoleta
```
/doctores?especialidad=Dermatología&plan=VIP&zona=Recoleta
```

### Psicólogos que atienden OSDE
```
/doctores?especialidad=Psicología&prepaga=OSDE
```

### Búsqueda combinada completa
```
/doctores?search=juan&especialidad=Traumatología&genero=Masculino&online=true&zona=Belgrano&pagina=2
```

## Persistencia de Filtros

### LocalStorage
Los filtros se guardan automáticamente en el navegador usando Zustand persist middleware. Esto significa que:
- Los filtros se mantienen al recargar la página
- Los filtros se mantienen al navegar a otras páginas y volver
- Los filtros se mantienen entre sesiones del navegador

**Almacenamiento:** `localStorage.doctors-filters-storage`

### Sincronización Automática
- **URL → Store**: Al abrir una URL compartida, los filtros se aplican automáticamente
- **Store → URL**: Al cambiar filtros, la URL se actualiza automáticamente
- **Shallow routing**: Las actualizaciones de URL no recargan la página

## Funcionalidad de Compartir

### Botón de Compartir
Un botón "Compartir búsqueda" está disponible en la página de doctores que:

1. **En dispositivos móviles**: Usa la API nativa de compartir del sistema
2. **En desktop**: Copia la URL al portapapeles
3. **Feedback visual**: Muestra confirmación "¡Copiado!" durante 2 segundos

### Casos de Uso

#### Para pacientes
- Compartir búsquedas específicas con familiares
- Guardar enlaces a búsquedas frecuentes como marcadores
- Enviar recomendaciones de doctores por WhatsApp/Email

#### Para profesionales de salud
- Compartir enlaces de referencia con colegas
- Crear listas curadas de especialistas por área

#### Para marketing
- Crear landing pages con filtros pre-aplicados
- Campañas de email con segmentación específica
- Links en redes sociales con contexto específico

## Implementación Técnica

### Store (Zustand)
```javascript
// src/store/doctorsFilterStore.js
- Middleware persist para LocalStorage
- Función setFiltersFromURL para sincronización
- Partialize para excluir estado transitorio
```

### Hook de Sincronización
```javascript
// src/hooks/useDoctorsFilterSync.js
- Lee query params al montar
- Actualiza URL al cambiar filtros
- Shallow routing para performance
```

### Componente de Compartir
```javascript
// src/components/doctoresPage/ShareFiltersButton.js
- Detección de capacidades del navegador
- Fallback automático a clipboard
- UI responsive con feedback
```

## Consideraciones

### Performance
- Las actualizaciones de URL usan `shallow: true` para evitar recargas
- Los filtros se cargan desde SSG props en el primer render
- La sincronización tiene debounce automático para evitar actualizaciones excesivas

### SEO
- Las URLs con filtros son indexables
- Los filtros en URL ayudan a Google a entender el contexto de búsqueda
- Compatible con SSG/ISR de Next.js

### Compatibilidad
- Funciona en todos los navegadores modernos
- Fallback a clipboard para navegadores sin Web Share API
- Compatible con navegación hacia atrás/adelante del navegador

## Migración desde URLs Antiguas

El sistema mantiene compatibilidad con el parámetro legacy:
- `?search=texto` - Sigue funcionando como antes
- Se convertirá automáticamente al nuevo formato al cambiar cualquier filtro

## Próximas Mejoras

- [ ] Guardar búsquedas favoritas en perfil de usuario
- [ ] Historial de búsquedas recientes
- [ ] Sugerencias de búsquedas populares
- [ ] Códigos cortos para URLs muy largas (URL shortener)
- [ ] Analytics de filtros más usados
