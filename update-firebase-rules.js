#!/usr/bin/env node

/**
 * Script para actualizar las reglas de Firebase Storage
 * 
 * Instrucciones:
 * 1. Ejecuta: node update-firebase-rules.js
 * 2. O copia manualmente el contenido de firebase-storage-rules.txt
 * 3. Ve a Firebase Console → Storage → Rules
 * 4. Reemplaza las reglas actuales con las nuevas
 * 5. Haz clic en "Publicar"
 */

const fs = require('fs');
const path = require('path');

const rulesFile = path.join(__dirname, 'firebase-storage-rules.txt');

try {
  const rules = fs.readFileSync(rulesFile, 'utf8');
  
  console.log('🔥 Reglas de Firebase Storage actualizadas:');
  console.log('═'.repeat(60));
  console.log(rules);
  console.log('═'.repeat(60));
  
  console.log('\n📋 Instrucciones para aplicar:');
  console.log('1. Ve a: https://console.firebase.google.com/');
  console.log('2. Selecciona tu proyecto: doctore-eae95');
  console.log('3. Ve a Storage → Rules');
  console.log('4. Copia y pega las reglas de arriba');
  console.log('5. Haz clic en "Publicar"');
  
  console.log('\n✨ Cambios principales:');
  console.log('• ✅ Lectura pública para imágenes de especialidades');
  console.log('• 🔒 Escritura solo para usuarios autenticados');
  console.log('• 🌐 Las imágenes ahora se cargarán sin autenticación');
  
} catch (error) {
  console.error('❌ Error al leer las reglas:', error.message);
}
