# Sistema Automatizado de Limpieza de Salas Jitsi

## Resumen de Cambios

Basándose en la documentación de Jitsi que indica que las salas vacías no generan carga en el servidor, se implementó un sistema automatizado que permite la creación libre de salas de videoconsulta y las limpia automáticamente a las 12:00 AM todos los días.

## Cambios Implementados

### 1. Eliminación de Restricciones de Creación

**Archivo modificado:** `src/lib/videoConsultationService.js`

- **Antes:** Se verificaba si ya existían salas activas para un paciente o doctor antes de crear nuevas salas
- **Después:** Se permite la creación libre de salas sin restricciones
- **Razón:** Las salas vacías no consumen recursos según documentación de Jitsi

```javascript
// ELIMINADO: Validaciones que impedían crear múltiples salas
// - hasActivePatientRoom()
// - Verificación de salas existentes doctor-paciente

// NUEVO: Creación directa sin validaciones restrictivas
const roomData = {
  // ... datos de la sala
};
const docRef = await addDoc(collection(db, 'videoConsultations'), roomData);
```

### 2. Eliminación de Funciones de Desarrollo

**Archivos modificados:** 
- `src/lib/videoConsultationService.js`
- `src/pages/admin/video-consultation.js`

Se eliminaron completamente:
- Funciones `deleteAllDoctorRooms()` y `deleteAllActiveRooms()` 
- Botones de desarrollo en la interfaz de administración
- Detección de localhost y funcionalidades DEV
- Indicador de "Sistema activo"
- Botones para eliminar salas individuales

**Razón:** Ya no son necesarios debido al sistema automatizado de limpieza

### 3. Nueva Función de Limpieza Automática

**Archivo modificado:** `src/lib/videoConsultationService.js`

Se agregó la función `cleanupAllRooms()` que:
- Elimina **todas** las salas de videoconsulta de Firebase
- No tiene restricciones de localhost (a diferencia de las funciones eliminadas)
- Está diseñada específicamente para ser ejecutada por cron jobs
- Registra la cantidad de salas eliminadas y timestamp

```javascript
async cleanupAllRooms() {
  const querySnapshot = await getDocs(collection(db, 'videoConsultations'));
  const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
  
  return {
    success: true,
    deletedCount: querySnapshot.docs.length,
    timestamp: new Date().toISOString()
  };
}
```

### 4. API Endpoint para Cron Job

**Archivo creado:** `src/pages/api/video/cleanup-rooms.js`

Endpoint seguro que:
- Solo acepta métodos POST
- Valida token de autorización usando `CRON_SECRET`
- Ejecuta la limpieza de salas
- Registra resultados en logs
- Maneja errores apropiadamente

```javascript
// POST /api/video/cleanup-rooms
// Headers: Authorization: Bearer ${CRON_SECRET}
```

### 5. Configuración del Cron Job

**Archivo creado:** `vercel.json`

Configuración para Vercel Cron Jobs:
- **Frecuencia:** Diariamente a las 12:00 AM (medianoche)
- **Expresión cron:** `"0 0 * * *"`
- **Endpoint:** `/api/video/cleanup-rooms`

```json
{
  "crons": [
    {
      "path": "/api/video/cleanup-rooms",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### 6. Variables de Entorno

**Archivo creado:** `.env.example`

Documentación de la variable `CRON_SECRET` necesaria para autenticar las llamadas del cron job.

## Configuración Requerida en Vercel

Para que el sistema funcione correctamente en producción:

1. **Variable de Entorno:**
   - Nombre: `CRON_SECRET`
   - Valor: `video-rooms-cleanup-secret-key-2024` (o el que prefieras)
   - Scope: Production

2. **Despliegue:**
   - El archivo `vercel.json` debe estar en el root del proyecto
   - Vercel detectará automáticamente la configuración del cron

## Beneficios del Nuevo Sistema

1. **Sin Restricciones:** Los usuarios pueden crear salas libremente sin mensajes de error
2. **Limpieza Automática:** No se acumulan salas innecesarias en la base de datos
3. **Cero Mantenimiento:** El sistema se auto-gestiona sin intervención manual
4. **Logs Automáticos:** Cada limpieza queda registrada para monitoreo
5. **Seguridad:** El endpoint está protegido contra accesos no autorizados

## Comportamiento Esperado

- **Creación de Salas:** Sin limitaciones, se pueden crear tantas como sea necesario
- **Limpieza Diaria:** Todos los días a las 12:00 AM se eliminan todas las salas
- **Logs:** En la consola de Vercel aparecerán logs como:
  ```
  [CRON JOB] Starting video rooms cleanup...
  [CRON CLEANUP] Deleted 15 video consultation rooms
  [CRON JOB] Cleanup completed: { success: true, deletedCount: 15, timestamp: "2024-..." }
  ```

## Notas Técnicas

- Las salas de Jitsi en el servidor no se ven afectadas por esta limpieza
- Solo se limpian los registros en Firebase, no las salas activas en Jitsi Meet
- Si hay una videoconsulta en curso a las 12:00 AM, la sala física seguirá funcionando
- Los usuarios simplemente no podrán acceder por la URL después de la limpieza