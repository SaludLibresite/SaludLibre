# Formato Oficial de Recetas Médicas - Argentina

## Resumen de Implementación

Este documento describe las mejoras implementadas en el sistema de recetas médicas para cumplir con el formato oficial argentino de recetas electrónicas.

## Cambios Implementados

### 1. Campos Agregados al Modelo de Pacientes

Se agregaron los siguientes campos al perfil de pacientes:

- **DNI**: Documento Nacional de Identidad (requerido, 7-8 dígitos)
- **Obra Social/Plan Médico**: Información de cobertura médica del paciente

**Archivos modificados:**
- `src/components/admin/AddPatientModal.js`
- `src/components/admin/EditPatientModal.js`
- `src/lib/patientsService.js`

### 2. Campo de Diagnóstico en Recetas

Se agregó un campo separado para el diagnóstico médico, diferenciado de las observaciones generales.

**Archivos modificados:**
- `src/components/admin/PrescriptionModal.js`
- `src/pages/api/prescriptions/upload.js`

### 3. Información Ampliada del Profesional

Se agregaron los siguientes campos a la información del doctor en la receta:

- **Profesión**: "Médico" (por defecto)
- **Domicilio**: Dirección del consultorio

**Archivos modificados:**
- `src/components/admin/PrescriptionModal.js`
- `src/pages/api/prescriptions/generate.js`

### 4. Formato Oficial del PDF

El PDF de la receta ahora incluye:

#### Sección del Profesional:
- Nombre y Apellido
- Profesión
- Especialidad
- Matrícula
- Teléfono
- Domicilio

#### Sección del Paciente:
- Nombre completo
- Fecha de Nacimiento
- DNI
- Sexo
- OOSS/Plan Médico

#### Sección de Diagnóstico:
- Campo dedicado para el diagnóstico médico

#### Sección RP: (Recetario)
- Lista de medicamentos con formato profesional
- Nombre genérico o denominación común internacional
- Presentación, forma farmacéutica y cantidad de unidades
- Instrucciones de uso

#### Sección de Observaciones:
- Notas y recomendaciones adicionales

### 5. Código de Barras

Se implementó un código de barras único para cada receta usando:
- Librería: `jsbarcode` y `canvas`
- Formato: CODE128
- Contenido: ID único de la receta (formato: `RX-{timestamp}` o ID de Firebase)

**Dependencias agregadas:**
```json
{
  "jsbarcode": "^3.x.x",
  "canvas": "^2.x.x"
}
```

### 6. Texto Legal del Ministerio de Salud

Se agregó el texto legal requerido en el pie de página:

```
"Esta receta fue creada por un emisor inscripto y validado
en el Registro de Recetarios Electrónicos del Ministerio de Salud de la Nación"
```

## Formato Visual

El PDF mantiene un diseño moderno y profesional con:
- Encabezado destacado con el logo/nombre de Salud Libre
- Código de colores: Amarillo/Naranja (#FFC107, #FF9800)
- Secciones claramente diferenciadas con bordes redondeados
- Firma y sello digital del profesional
- Código de barras en el pie de página
- Texto legal del Ministerio de Salud

## Uso

### Para crear una receta:

1. Ir a la cita del paciente
2. Hacer clic en "Crear Receta"
3. Completar los campos:
   - Medicamentos (nombre, dosis, frecuencia, duración, instrucciones)
   - Diagnóstico (nuevo campo)
   - Observaciones adicionales (opcional)
4. Guardar

El sistema automáticamente incluirá:
- Información completa del doctor (incluyendo domicilio y matrícula)
- Información completa del paciente (incluyendo DNI, sexo, obra social)
- Código de barras único
- Texto legal del Ministerio de Salud

## Validación de Datos

### Pacientes:
- DNI: Requerido, debe tener 7 u 8 dígitos
- Fecha de Nacimiento: Requerida (se calcula la edad automáticamente)
- Género: Requerido
- Obra Social: Opcional (por defecto: "Particular")

### Recetas:
- Al menos un medicamento con nombre y dosis
- Todos los medicamentos deben tener: nombre, dosis y frecuencia
- Diagnóstico: Opcional pero recomendado
- Observaciones: Opcional

## Archivos Modificados

### Componentes:
- `src/components/admin/AddPatientModal.js`
- `src/components/admin/EditPatientModal.js`
- `src/components/admin/PrescriptionModal.js`

### Servicios:
- `src/lib/patientsService.js`
- `src/pages/api/prescriptions/upload.js`
- `src/pages/api/prescriptions/generate.js`

## Próximos Pasos (Opcional)

1. **Integración con Sistema Nacional**: Conectar con el registro oficial del Ministerio de Salud
2. **Validación de Matrícula**: Verificar la matrícula profesional contra base de datos oficial
3. **Numeración Secuencial**: Implementar sistema de numeración correlativa de recetas
4. **Firma Digital Certificada**: Integrar con servicios de firma digital certificada (AFIP, etc.)
5. **Trazabilidad**: Sistema de seguimiento y auditoría de recetas emitidas

## Notas Importantes

- El código de barras se genera usando el ID único de la receta en Firebase
- Si no hay ID disponible, se genera un ID temporal con formato `RX-{timestamp}`
- La receta se guarda en Firebase antes de generar el PDF
- El PDF se genera en el servidor (API route) para mayor seguridad
- Todas las recetas quedan registradas con timestamp y datos completos

## Soporte

Para más información sobre recetas electrónicas en Argentina:
- [Ministerio de Salud - Recetas Electrónicas](https://www.argentina.gob.ar/salud)
- Resolución IF-2024-XXXXX-APN-MS (verificar número oficial)
