// Lista oficial de especialidades médicas
export const ESPECIALIDADES = [
  "Cardiología",
  "Dermatología",
  "Endocrinología",
  "Gastroenterología",
  "Ginecología",
  "Medicina General",
  "Neurología",
  "Odontología",
  "Oftalmología",
  "Pediatría",
  "Psiquiatría",
  "Traumatología",
  "Urología",
];

// Función helper para obtener las especialidades como opciones de select
export function getEspecialidadesOptions() {
  return ESPECIALIDADES.map((esp) => ({
    value: esp,
    label: esp,
  }));
}
