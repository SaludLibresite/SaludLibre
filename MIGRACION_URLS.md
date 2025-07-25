# Migración de URLs de Firebase Storage

## Problema
Las imágenes existentes fueron subidas con el bucket URL incorrecto (`doctore-eae95.firebasestorage.app`) y necesitan ser migradas al bucket correcto (`doctore-eae95.appspot.com`).

## Solución Implementada

### 1. ✅ Configuración de Next.js actualizada
- Agregado soporte para ambos buckets en `next.config.mjs`
- Esto permite que las imágenes existentes sigan funcionando mientras se migran

### 2. ✅ Herramientas de migración creadas
- `checkOldUrls()` - Verifica qué especialidades tienen URLs antiguas
- `migrateImageUrls()` - Migra automáticamente las URLs al nuevo bucket

### 3. ✅ Interfaz de usuario agregada
- Botón "🔍 Verificar URLs" - Muestra cuántas URLs necesitan migración
- Botón "🔄 Migrar URLs" - Ejecuta la migración automática

## Pasos para Migrar

### Paso 1: Reiniciar el servidor
```bash
# Detener el servidor (Ctrl+C)
npm run dev  # Reiniciar para que next.config.mjs tome efecto
```

### Paso 2: Verificar URLs antiguas
1. Ve a la página de especialidades
2. Haz clic en "🔍 Verificar URLs"
3. Revisa la consola del navegador para ver los detalles

### Paso 3: Migrar URLs
1. Haz clic en "🔄 Migrar URLs"
2. Confirma la migración
3. Espera a que termine el proceso

### Paso 4: Verificar que funcionó
1. Recarga la página
2. Las imágenes deberían cargar correctamente
3. Las nuevas imágenes subidas usarán el bucket correcto

## URLs Esperadas

### Antes (incorrecto):
```
https://firebasestorage.googleapis.com/v0/b/doctore-eae95.firebasestorage.app/o/specialties%2F...
```

### Después (correcto):
```
https://firebasestorage.googleapis.com/v0/b/doctore-eae95.appspot.com/o/specialties%2F...
```

## Notas Importantes

1. **La migración es segura** - Solo cambia las URLs en la base de datos, no mueve archivos
2. **Las imágenes antiguas seguirán funcionando** - Next.js está configurado para ambos buckets
3. **Las nuevas imágenes usarán el bucket correcto** - El `.env.local` ya está actualizado
4. **Puedes ejecutar la migración múltiples veces** - Solo afecta las URLs que aún no han sido migradas

## Si algo sale mal

1. **Las imágenes no cargan**: Verifica que el servidor esté reiniciado
2. **Error de migración**: Revisa la consola del navegador para detalles
3. **URLs no cambian**: Verifica que tengas permisos de escritura en Firestore

## Limpieza futura

Una vez que todas las URLs estén migradas y funcionando, puedes:
1. Remover las entradas del bucket antiguo de `next.config.mjs`
2. Eliminar los archivos del bucket antiguo en Firebase Console (opcional)