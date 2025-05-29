// Static data for admin dashboard

export const patients = [
  {
    id: "pt-001",
    name: "María González",
    email: "maria@email.com",
    phone: "+54 11 1234-5678",
    lastVisit: "15 Abr, 2025",
    nextAppointment: "24 Abr, 2025",
    avatar: null,
    patientId: "ID: #12345",
  },
  {
    id: "pt-002",
    name: "Carlos Rodríguez",
    email: "carlos.r@email.com",
    phone: "+54 11 1234-5679",
    lastVisit: "10 Abr, 2025",
    nextAppointment: "25 Abr, 2025",
    avatar: null,
    patientId: "ID: #12346",
  },
  {
    id: "pt-003",
    name: "Ana Martínez",
    email: "ana.m@email.com",
    phone: "+54 11 1234-5680",
    lastVisit: "05 Abr, 2025",
    nextAppointment: "14 Abr, 2025",
    avatar: null,
    patientId: "ID: #12347",
  },
  {
    id: "pt-004",
    name: "Juan López",
    email: "juan.l@email.com",
    phone: "+54 11 1234-5681",
    lastVisit: "01 Abr, 2025",
    nextAppointment: "10 Abr, 2025",
    avatar: null,
    patientId: "ID: #12348",
  },
  {
    id: "pt-005",
    name: "Laura Fernández",
    email: "laura.f@email.com",
    phone: "+54 11 1234-5682",
    lastVisit: "20 Abr, 2025",
    nextAppointment: "29 Abr, 2025",
    avatar: null,
    patientId: "ID: #12349",
  },
  {
    id: "pt-006",
    name: "Diego Silva",
    email: "diego.s@email.com",
    phone: "+54 11 1234-5683",
    lastVisit: "12 Abr, 2025",
    nextAppointment: "21 Abr, 2025",
    avatar: null,
    patientId: "ID: #12350",
  },
  {
    id: "pt-007",
    name: "Sofía Herrera",
    email: "sofia.h@email.com",
    phone: "+54 11 1234-5684",
    lastVisit: "08 Abr, 2025",
    nextAppointment: "17 Abr, 2025",
    avatar: null,
    patientId: "ID: #12351",
  },
  {
    id: "pt-008",
    name: "Alejandro Morales",
    email: "alejandro.m@email.com",
    phone: "+54 11 1234-5685",
    lastVisit: "03 Abr, 2025",
    nextAppointment: "12 Abr, 2025",
    avatar: null,
    patientId: "ID: #12352",
  },
];

export const appointments = [
  {
    id: "apt-001",
    patientId: "pt-001",
    patientName: "María González",
    date: "2025-04-24",
    time: "8:00 AM",
    type: "Chequeo General",
    status: "scheduled",
    notes: "Examen físico anual",
  },
  {
    id: "apt-002",
    patientId: "pt-002",
    patientName: "Carlos Rodríguez",
    date: "2025-04-24",
    time: "11:30 AM",
    type: "Seguimiento",
    status: "scheduled",
    notes: "Control de presión arterial",
  },
  {
    id: "apt-003",
    patientId: "pt-003",
    patientName: "Ana Martínez",
    date: "2025-04-24",
    time: "2:30 PM",
    type: "Consulta",
    status: "scheduled",
    notes: "Discutir resultados de análisis",
  },
];

export const calendarEvents = [
  {
    id: 1,
    title: "María González",
    time: "8:00 AM",
    date: "2025-04-01",
    type: "appointment",
  },
  {
    id: 2,
    title: "Carlos Rodríguez",
    time: "11:30 AM",
    date: "2025-04-01",
    type: "appointment",
  },
  {
    id: 3,
    title: "Ana Martínez",
    time: "2:30 PM",
    date: "2025-04-01",
    type: "appointment",
  },
];

export const dashboardStats = [
  {
    title: "Total de Pacientes",
    value: "1,234",
    change: "+12%",
    changeType: "increase",
  },
  {
    title: "Citas de Hoy",
    value: "8",
    change: "+2",
    changeType: "increase",
  },
  {
    title: "Esta Semana",
    value: "45",
    change: "-3",
    changeType: "decrease",
  },
  {
    title: "Ingresos",
    value: "$450,000",
    change: "+8%",
    changeType: "increase",
  },
];

export const reviews = [
  {
    id: 1,
    patientName: "María González",
    rating: 5,
    comment:
      "Excelente atención y muy profesional. El Dr. García se tomó el tiempo para explicar todo claramente.",
    date: "2025-04-20",
    verified: true,
  },
  {
    id: 2,
    patientName: "Carlos Rodríguez",
    rating: 5,
    comment:
      "Gran experiencia. El doctor fue muy minucioso y respondió todas mis preguntas.",
    date: "2025-04-18",
    verified: true,
  },
  {
    id: 3,
    patientName: "Ana Martínez",
    rating: 4,
    comment: "Buen servicio, aunque el tiempo de espera fue un poco largo.",
    date: "2025-04-15",
    verified: true,
  },
];

export const referrals = [
  {
    id: 1,
    patientName: "Juan López",
    referredTo: "Dr. Martínez - Cardiología",
    reason: "Evaluación de palpitaciones cardíacas",
    date: "2025-04-22",
    status: "pending",
  },
  {
    id: 2,
    patientName: "Laura Fernández",
    referredTo: "Dr. López - Dermatología",
    reason: "Examen de lesión cutánea",
    date: "2025-04-20",
    status: "completed",
  },
  {
    id: 3,
    patientName: "Diego Silva",
    referredTo: "Dr. Chen - Traumatología",
    reason: "Evaluación de dolor de rodilla",
    date: "2025-04-18",
    status: "scheduled",
  },
];

export const appointmentDetail = {
  id: "apt-001",
  patient: {
    name: "María González",
    age: 34,
    phone: "+54 11 1234-5678",
    email: "maria@email.com",
    patientId: "ID: #12345",
  },
  appointment: {
    date: "24 de Abril, 2025",
    time: "8:00 AM",
    type: "Chequeo General",
    status: "scheduled",
  },
  medicalHistory: [
    {
      date: "2025-03-15",
      diagnosis: "Hipertensión",
      treatment: "Lisinopril 10mg diario",
      notes: "Presión arterial bien controlada",
    },
    {
      date: "2025-02-10",
      diagnosis: "Examen Físico Anual",
      treatment: "Análisis de rutina solicitados",
      notes: "Estado de salud general bueno",
    },
  ],
  prescriptions: [
    {
      medication: "Lisinopril",
      dosage: "10mg",
      frequency: "Una vez al día",
      startDate: "2025-03-15",
      refills: 2,
    },
  ],
  labResults: [
    {
      test: "Hemograma Completo",
      date: "2025-04-01",
      status: "Normal",
      file: "Hemograma_01042025.pdf",
    },
    {
      test: "Perfil Lipídico",
      date: "2025-04-01",
      status: "Colesterol elevado",
      file: "Lipidos_01042025.pdf",
    },
  ],
  documents: [
    {
      name: "Receta_24042025.pdf",
      type: "prescription",
      date: "2025-04-24",
    },
  ],
};
