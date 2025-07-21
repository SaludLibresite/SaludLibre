# Solución para Problema de Imágenes en Firebase Storage

## Cambios Realizados

### 1. ✅ Corregido el Storage Bucket URL
- **Antes**: `doctore-eae95.firebasestorage.app`
- **Después**: `doctore-eae95.appspot.com`
- **Archivo**: `.env.local`

### 2. ✅ Configurado Next.js para Firebase Storage
- Agregado dominio de Firebase Storage a `remotePatterns`
- Soporte para ambos formatos de URL de Firebase
- **Archivo**: `next.config.mjs`

### 3. ✅ Optimizado componente de imágenes
- Uso de `next/image` para imágenes de Firebase Storage
- Fallback a `<img>` para imágenes locales
- Mejor manejo de errores y carga
- **Archivo**: `src/pages/superadmin/specialties.js`

### 4. ✅ Mejorado el manejo de errores
- Agregado logging detallado en `uploadSpecialtyImage`
- Verificación de URL generada
- Test de accesibilidad de URL
- **Archivo**: `src/lib/specialtiesService.js`

### 5. ✅ Agregado debugging visual
- URLs de imágenes visibles en desarrollo
- Logging detallado de carga/error de imágenes
- **Archivo**: `src/pages/superadmin/specialties.js`

### 6. ✅ Mejorado el test de Firebase Storage
- Test sin requerir autenticación (para reglas de prueba)
- Información detallada del bucket
- Apertura automática de URL de prueba
- **Archivo**: `src/lib/testFirebaseStorage.js`

## Pasos para Solucionar

### Paso 1: Reiniciar el servidor de desarrollo
```bash
# Detener el servidor actual (Ctrl+C)
# Luego reiniciar (IMPORTANTE: necesario para que next.config.mjs tome efecto)
npm run dev
# o
yarn dev
```

### Paso 2: Probar Firebase Storage
1. Ve a la página de especialidades
2. Haz clic en "🧪 Probar Storage"
3. Verifica que se abra una nueva pestaña con el archivo de prueba

### Paso 3: Configurar CORS (si es necesario)
Si el test falla o las imágenes siguen sin cargar:

```bash
# Instalar Google Cloud SDK
brew install google-cloud-sdk

# Autenticarse
gcloud auth login
gcloud config set project doctore-eae95

# Aplicar CORS
gsutil cors set cors.json gs://doctore-eae95.appspot.com
```

### Paso 4: Verificar reglas de Firebase Storage
Ve a Firebase Console → Storage → Rules y asegúrate de que sean:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

## Diagnóstico

### En Desarrollo (localhost)
- Abre la consola del navegador (F12)
- Busca mensajes que empiecen con ✅ o ❌
- Las URLs de imágenes aparecerán en la parte inferior de cada imagen

### En Producción
- Verifica que las variables de entorno estén configuradas correctamente
- Asegúrate de que `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=doctore-eae95.appspot.com`

## URLs Esperadas
Las imágenes deben tener URLs como:
```
https://firebasestorage.googleapis.com/v0/b/doctore-eae95.appspot.com/o/specialties%2F1234567890_imagen.jpg?alt=media&token=...
```

## Si el problema persiste
1. Revisa la consola del navegador para errores específicos
2. Verifica que el proyecto Firebase esté activo
3. Confirma que Firebase Storage esté habilitado en tu proyecto
4. Verifica la configuración de CORS con: `gsutil cors get gs://doctore-eae95.appspot.com`