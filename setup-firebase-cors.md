# Configurar CORS para Firebase Storage

## Problema
Las imágenes subidas a Firebase Storage no se muestran debido a problemas de CORS (Cross-Origin Resource Sharing).

## Solución

### 1. Instalar Google Cloud SDK
```bash
# macOS
brew install google-cloud-sdk

# O descargar desde: https://cloud.google.com/sdk/docs/install
```

### 2. Autenticarse con Google Cloud
```bash
gcloud auth login
gcloud config set project doctore-eae95
```

### 3. Aplicar configuración CORS
```bash
gsutil cors set cors.json gs://doctore-eae95.appspot.com
```

### 4. Verificar configuración CORS
```bash
gsutil cors get gs://doctore-eae95.appspot.com
```

## Configuración alternativa (si no funciona lo anterior)

### Opción 1: Usar Firebase CLI
```bash
npm install -g firebase-tools
firebase login
firebase use doctore-eae95
```

### Opción 2: Configurar desde Firebase Console
1. Ve a Firebase Console → Storage
2. Selecciona tu bucket
3. Ve a la pestaña "Rules" 
4. Asegúrate de que las reglas permitan lectura pública:

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

## Verificar que funciona
1. Ejecuta la app en desarrollo
2. Sube una imagen nueva
3. Verifica en la consola del navegador que la URL generada sea accesible
4. La URL debe tener el formato: `https://firebasestorage.googleapis.com/v0/b/doctore-eae95.appspot.com/o/...`