#!/usr/bin/env node

/**
 * Script para mostrar las reglas de Firebase Storage y Firestore
 *
 * Instrucciones:
 * 1. Ejecuta: node update-firebase-rules.js
 * 2. Copia las reglas mostradas a Firebase Console
 */

const fs = require('fs');
const path = require('path');

console.log('🔥 FIREBASE RULES UPDATE SCRIPT');
console.log('═'.repeat(60));

console.log('\n📋 STORAGE RULES (Firebase Console → Storage → Rules):');
console.log('═'.repeat(60));

const storageRulesFile = path.join(__dirname, 'firebase-storage-rules.txt');
try {
  const storageRules = fs.readFileSync(storageRulesFile, 'utf8');
  console.log(storageRules);
} catch (error) {
  console.error('❌ Error al leer las reglas de Storage:', error.message);
}

console.log('\n🔒 FIRESTORE RULES (Firebase Console → Firestore → Rules):');
console.log('═'.repeat(60));

const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura de doctores a todos (para la página pública)
    match /doctors/{document} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // Pacientes - el doctor y el paciente pueden acceder
    match /patients/{document} {
      allow read: if request.auth != null &&
        (request.auth.uid == resource.data.doctorUserId ||
         request.auth.uid == resource.data.userId ||
         isDocumentOwner(request.auth.uid, resource.data.doctorId));
      allow write: if request.auth != null &&
        (request.auth.uid == resource.data.doctorUserId ||
         request.auth.uid == resource.data.userId ||
         isDocumentOwner(request.auth.uid, resource.data.doctorId));
      allow create: if request.auth != null;
    }

    // Citas - lectura pública para crear citas, escritura solo para el doctor
    match /appointments/{document} {
      allow read: if true;
      allow create: if true; // Permitir que cualquiera pueda crear una cita
      allow update, delete: if request.auth != null &&
        isDocumentOwner(request.auth.uid, resource.data.doctorId);
    }

    // Función helper para verificar si un usuario es propietario de un documento
    function isDocumentOwner(userId, doctorId) {
      return exists(/databases/$(database)/documents/doctors/$(doctorId)) &&
             get(/databases/$(database)/documents/doctors/$(doctorId)).data.userId == userId;
    }

    // Otras colecciones solo para usuarios autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`;

console.log(firestoreRules);

console.log('\n📋 Instrucciones para aplicar las reglas:');
console.log('1. Ve a: https://console.firebase.google.com/');
console.log('2. Selecciona tu proyecto');
console.log('3. Para STORAGE: Ve a Storage → Rules, copia las reglas de arriba');
console.log('4. Para FIRESTORE: Ve a Firestore → Rules, copia las reglas de arriba');
console.log('5. Haz clic en "Publicar" en ambas secciones');

console.log('\n✨ Cambios principales en Firestore Rules:');
console.log('• ✅ Pacientes ahora pueden editar su propio perfil');
console.log('• 🔒 Doctores pueden seguir editando perfiles de pacientes');
console.log('• 🌐 Mejor control de acceso para citas y otros documentos');

console.log('\n⚠️  IMPORTANTE: Debes aplicar las reglas de Firestore para que el perfil se guarde correctamente!');
