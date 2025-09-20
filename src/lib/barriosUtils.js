// Utilidad para mapear ubicaciones específicas a barrios/zonas de Buenos Aires
// Este sistema permite agrupar direcciones detalladas en barrios para facilitar el filtrado

// Mapa de barrios/zonas de Buenos Aires y alrededores
export const BARRIOS_MAPPING = {
  // Capital Federal - Norte
  'Palermo': [
    'Palermo', 'Av. Santa Fe', 'Av. Las Heras', 'Av. Córdoba', 'Thames', 'Gorriti',
    'Honduras', 'Guatemala', 'El Salvador', 'Niceto Vega', 'Humboldt', 'Scalabrini Ortiz'
  ],
  'Recoleta': [
    'Recoleta', 'Av. Callao', 'Av. Pueyrredón', 'Ayacucho', 'Junín', 'French',
    'Juncal', 'Arenales', 'Santa Fe'
  ],
  'Belgrano': [
    'Belgrano', 'Av. Cabildo', 'Juramento', 'Congreso', 'Monroe', 'Cuba',
    'Echeverría', 'Sucre', 'Virrey Vértiz'
  ],
  'Núñez': [
    'Núñez', 'Av. del Libertador', 'Amenábar', 'Moldes', 'Vuelta de Obligado'
  ],
  'Villa Urquiza': [
    'Villa Urquiza', 'Av. Triunvirato', 'Monroe', 'Bauness', 'Holmberg'
  ],
  'Coghlan': [
    'Coghlan', 'Teodoro García', 'Freire', 'Olleros'
  ],
  'Saavedra': [
    'Saavedra', 'García del Río', 'Paroissien', 'Ramsay'
  ],

  // Capital Federal - Centro
  'Centro / Microcentro': [
    'Centro', 'Microcentro', 'Av. Corrientes', 'Av. 9 de Julio', 'Florida', 'Lavalle',
    'Maipú', 'San Martín', 'Reconquista', 'Esmeralda', 'Suipacha', 'Carlos Pellegrini',
    'Bartolomé Mitre', 'Tucumán', 'Viamonte', 'Córdoba', 'Paraguay', 'Marcelo T. de Alvear',
    'Arenales', 'Santa Fe', 'Presidente Perón', 'Av. de Mayo', 'Rivadavia',
    'Hipólito Yrigoyen', 'Estados Unidos', 'Venezuela', 'México', 'Chile',
    'Independencia', 'Moreno', 'Alsina', 'Diagonal Norte', 'Diagonal Sur'
  ],
  'Puerto Madero': [
    'Puerto Madero', 'Dique', 'Juana Manso', 'Pierina Dealessi', 'Rosario Vera Peñaloza'
  ],
  'Retiro': [
    'Retiro', 'Av. del Libertador', 'Av. Antártida Argentina', 'Av. Ramos Mejía',
    'San Martín', 'Maipú', 'Florida'
  ],
  'San Nicolás': [
    'San Nicolás', 'Av. Corrientes', 'Uruguay', 'Paraná', 'Montevideo', 'Rodríguez Peña'
  ],

  // Capital Federal - Sur
  'San Telmo': [
    'San Telmo', 'Defensa', 'Bolívar', 'Piedras', 'Tacuarí', 'Paseo Colón',
    'Carlos Calvo', 'Estados Unidos', 'Independencia'
  ],
  'La Boca': [
    'La Boca', 'Caminito', 'Almirante Brown', 'Brandsen', 'Suárez', 'Olavarría'
  ],
  'Barracas': [
    'Barracas', 'Montes de Oca', 'California', 'Lafayette', 'Av. Caseros'
  ],
  'Constitución': [
    'Constitución', 'Lima', 'Salta', 'Santiago del Estero', 'Av. Juan de Garay'
  ],
  'Montserrat': [
    'Montserrat', 'Av. de Mayo', 'Bolívar', 'Defensa', 'Perú', 'Chacabuco'
  ],

  // Capital Federal - Oeste
  'Caballito': [
    'Caballito', 'Av. Rivadavia', 'Av. Acoyte', 'Av. Directorio', 'Av. José María Moreno',
    'Primera Junta', 'Emilio Mitre', 'Avellaneda', 'Yerbal', 'Rojas'
  ],
  'Almagro': [
    'Almagro', 'Av. Corrientes', 'Av. Estado de Israel', 'Av. Medrano', 'Bulnes',
    'Gascón', 'Anchorena', 'Jean Jaurès'
  ],
  'Balvanera': [
    'Balvanera', 'Once', 'Av. Pueyrredón', 'Av. Callao', 'Larrea', 'Uriburu',
    'Pasteur', 'Alberti', 'Pichincha'
  ],
  'Villa Crespo': [
    'Villa Crespo', 'Av. Corrientes', 'Av. Warnes', 'Murillo', 'Camargo', 'Padilla',
    'Vera', 'Loyola', 'Acevedo'
  ],
  'Flores': [
    'Flores', 'Av. Rivadavia', 'Av. Nazca', 'Av. Avellaneda', 'Av. Directorio',
    'Membrillar', 'Artigas', 'Boyacá', 'Yerbal'
  ],
  'Floresta': [
    'Floresta', 'Av. Avellaneda', 'Av. Directorio', 'Segurola', 'Bahía Blanca'
  ],
  'Villa Luro': [
    'Villa Luro', 'Av. Rivadavia', 'Av. General Paz', 'Lope de Vega', 'Zelada'
  ],

  // Zona Norte - GBA
  'Vicente López': [
    'Vicente López', 'Olivos', 'La Lucila', 'Munro', 'Villa Adelina', 'Villa Martelli',
    'Av. Maipú', 'Av. del Libertador'
  ],
  'San Isidro': [
    'San Isidro', 'Martínez', 'Acassuso', 'San Isidro Centro', 'Av. del Libertador'
  ],
  'Tigre': [
    'Tigre', 'Don Torcuato', 'El Talar', 'General Pacheco', 'Benavídez', 'Rincón de Milberg'
  ],
  'San Fernando': [
    'San Fernando', 'Victoria', 'Virreyes', 'Av. Pte. Perón'
  ],
  'Escobar': [
    'Escobar', 'Ingeniero Maschwitz', 'Matheu', 'Maquinista Savio'
  ],

  // Zona Oeste - GBA
  'Morón': [
    'Morón', 'Castelar', 'Ituzaingó', 'Villa Sarmiento', 'El Palomar', 'Haedo'
  ],
  'Tres de Febrero': [
    'Caseros', 'Churruca', 'Ciudadela', 'Loma Hermosa', 'Martín Coronado', 'Pablo Podestá',
    'Villa Bosch', 'Villa Raffo', 'Santos Lugares'
  ],
  'Hurlingham': [
    'Hurlingham', 'Villa Tesei', 'William C. Morris'
  ],
  'San Miguel': [
    'San Miguel', 'Bella Vista', 'Campo de Mayo', 'Muñiz', 'Santa María'
  ],
  'Malvinas Argentinas': [
    'Grand Bourg', 'Los Polvorines', 'Pablo Nogués', 'Tortuguitas', 'Villa de Mayo'
  ],

  // Zona Sur - GBA
  'Avellaneda': [
    'Avellaneda', 'Dock Sud', 'Piñeyro', 'Villa Domínico', 'Gerli', 'Crucecita'
  ],
  'Quilmes': [
    'Quilmes', 'Bernal', 'Don Bosco', 'Ezpeleta', 'Villa La Florida', 'San Francisco Solano'
  ],
  'Berazategui': [
    'Berazategui', 'Ranelagh', 'Sourigues', 'Villa España', 'Hudson', 'Pereyra'
  ],
  'Florencio Varela': [
    'Florencio Varela', 'Bosques', 'Gobernador Costa', 'Villa San Luis', 'Villa Vatteone'
  ],
  'Lanús': [
    'Lanús Este', 'Lanús Oeste', 'Remedios de Escalada', 'Monte Chingolo', 'Villa Caraza'
  ],
  'Lomas de Zamora': [
    'Lomas de Zamora', 'Banfield', 'Llavallol', 'Temperley', 'Turdera', 'Villa Fiorito'
  ]
};

// Función para extraer el barrio de una dirección
export function extractBarrioFromAddress(address) {
  if (!address || typeof address !== 'string') {
    return 'Otros';
  }

  const normalizedAddress = address.toLowerCase();
  
  // Buscar coincidencias en el mapeo de barrios
  for (const [barrio, keywords] of Object.entries(BARRIOS_MAPPING)) {
    for (const keyword of keywords) {
      if (normalizedAddress.includes(keyword.toLowerCase())) {
        return barrio;
      }
    }
  }

  // Si no se encuentra coincidencia, intentar extraer de patrones comunes
  
  // Buscar patrones como "C1234XXX Ciudad Autónoma de Buenos Aires" o "Buenos Aires"
  if (normalizedAddress.includes('ciudad autónoma de buenos aires') || 
      normalizedAddress.includes('cdad. autónoma de buenos aires') ||
      normalizedAddress.includes('capital federal')) {
    return 'Capital Federal (Otros)';
  }

  // Buscar provincia de Buenos Aires
  if (normalizedAddress.includes('provincia de buenos aires') || 
      normalizedAddress.includes('pcia. de buenos aires') ||
      normalizedAddress.includes('buenos aires, argentina')) {
    return 'GBA (Otros)';
  }

  // Buscar otras provincias argentinas
  const provincias = [
    'córdoba', 'santa fe', 'mendoza', 'tucumán', 'entre ríos', 'corrientes',
    'misiones', 'salta', 'chaco', 'santiago del estero', 'san juan', 'jujuy',
    'río negro', 'formosa', 'neuquén', 'chubut', 'san luis', 'catamarca',
    'la rioja', 'la pampa', 'santa cruz', 'tierra del fuego'
  ];

  for (const provincia of provincias) {
    if (normalizedAddress.includes(provincia)) {
      return `${provincia.charAt(0).toUpperCase() + provincia.slice(1)} (Provincia)`;
    }
  }

  return 'Otros';
}

// Función para obtener todas las ubicaciones agrupadas por barrio
export function groupLocationsByBarrio(doctors) {
  const groupedLocations = {};

  doctors.forEach(doctor => {
    const address = doctor.formattedAddress || doctor.ubicacion;
    const barrio = extractBarrioFromAddress(address);
    
    if (!groupedLocations[barrio]) {
      groupedLocations[barrio] = {
        count: 0,
        addresses: new Set()
      };
    }
    
    groupedLocations[barrio].count++;
    if (address) {
      groupedLocations[barrio].addresses.add(address);
    }
  });

  // Convertir a array y ordenar por cantidad de doctores
  return Object.entries(groupedLocations)
    .map(([barrio, data]) => ({
      barrio,
      count: data.count,
      addresses: Array.from(data.addresses)
    }))
    .sort((a, b) => b.count - a.count);
}

// Función para filtrar doctores por barrio
export function filterDoctorsByBarrio(doctors, selectedBarrio) {
  if (!selectedBarrio || selectedBarrio === '') {
    return doctors;
  }

  return doctors.filter(doctor => {
    const address = doctor.formattedAddress || doctor.ubicacion;
    const doctorBarrio = extractBarrioFromAddress(address);
    return doctorBarrio === selectedBarrio;
  });
}

// Función para obtener las opciones de barrios para el filtro
export function getBarrioFilterOptions(doctors) {
  const grouped = groupLocationsByBarrio(doctors);
  
  return grouped.map(({ barrio, count }) => ({
    value: barrio,
    label: `${barrio} (${count})`,
    count
  }));
}