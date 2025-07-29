#!/bin/bash

# Script para configurar CORS en Firebase Storage
echo "🔧 Configurando CORS para Firebase Storage..."

# Verificar que existe cors.json
if [ ! -f cors.json ]; then
    echo "❌ Error: No se encontró el archivo cors.json"
    exit 1
fi

# Mostrar el contenido del archivo
echo "📄 Contenido de cors.json:"
cat cors.json

# Aplicar CORS al bucket
echo "🚀 Aplicando configuración CORS al bucket..."
gsutil cors set cors.json gs://doctore-eae95.appspot.com

if [ $? -eq 0 ]; then
    echo "✅ CORS configurado correctamente"
    echo "🔍 Verificando configuración actual..."
    gsutil cors get gs://doctore-eae95.appspot.com
else
    echo "❌ Error al configurar CORS"
    echo "💡 Soluciones:"
    echo "1. Ejecuta: gcloud auth login"
    echo "2. Ejecuta: gcloud config set project doctore-eae95"
    echo "3. Vuelve a ejecutar este script"
fi
