import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";

const PATIENTS_COLLECTION = "patients";

/**
 * API endpoint para obtener pacientes con paginación y búsqueda
 * GET /api/superadmin/patients
 *
 * Query params:
 * - page: número de página (default: 1)
 * - limit: pacientes por página (default: 20)
 * - search: término de búsqueda (nombre, email, teléfono, patientId)
 * - sort: alphabetical | recent (default: recent)
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      page = "1",
      limit: limitParam = "20",
      search = "",
      sort = "recent",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limitParam);
    const offset = (pageNum - 1) * limitNum;

    // Obtener todos los pacientes
    const patientsRef = collection(db, PATIENTS_COLLECTION);
    const patientsQuery = query(patientsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(patientsQuery);

    let allPatients = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      allPatients.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || null,
      });
    });

    // Aplicar búsqueda en memoria
    if (search) {
      const searchLower = search.toLowerCase();
      allPatients = allPatients.filter((patient) => {
        const name = patient.name?.toLowerCase() || "";
        const email = patient.email?.toLowerCase() || "";
        const phone = patient.phone || "";
        const patientId = patient.patientId?.toLowerCase() || "";
        const dni = patient.dni?.toLowerCase() || "";

        return (
          name.includes(searchLower) ||
          email.includes(searchLower) ||
          phone.includes(searchLower) ||
          patientId.includes(searchLower) ||
          dni.includes(searchLower)
        );
      });
    }

    // Ordenar
    if (sort === "alphabetical") {
      allPatients.sort((a, b) => {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return nameA.localeCompare(nameB, "es");
      });
    }
    // sort === "recent" ya viene ordenado por createdAt desc desde la query

    // Calcular paginación
    const total = allPatients.length;
    const totalPages = Math.ceil(total / limitNum);
    const paginatedPatients = allPatients.slice(offset, offset + limitNum);

    return res.status(200).json({
      patients: paginatedPatients,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return res.status(500).json({ error: "Error fetching patients" });
  }
}
