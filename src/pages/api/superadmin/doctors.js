import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";

const DOCTORS_COLLECTION = "doctors";

/**
 * API endpoint para obtener doctores con paginación y búsqueda
 * GET /api/superadmin/doctors
 * 
 * Query params:
 * - page: número de página (default: 1)
 * - limit: doctores por página (default: 20)
 * - search: término de búsqueda (nombre, email, especialidad)
 * - filter: all | pending | verified (default: all)
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
      filter = "all",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limitParam);
    const offset = (pageNum - 1) * limitNum;

    // Construir query base
    let queryConstraints = [];
    
    // Aplicar filtro de verificación
    if (filter === "verified") {
      queryConstraints.push(where("verified", "==", true));
    } else if (filter === "pending") {
      queryConstraints.push(where("verified", "==", false));
    }

    // Ordenar por fecha de creación
    queryConstraints.push(orderBy("createdAt", "desc"));

    // Obtener doctores
    const doctorsRef = collection(db, DOCTORS_COLLECTION);
    const doctorsQuery = query(doctorsRef, ...queryConstraints);
    
    const querySnapshot = await getDocs(doctorsQuery);
    
    let allDoctors = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      allDoctors.push({
        id: doc.id,
        ...data,
        // Convertir timestamps a strings para JSON
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        subscriptionExpiresAt: data.subscriptionExpiresAt?.toDate?.()?.toISOString() || null,
        subscriptionActivatedAt: data.subscriptionActivatedAt?.toDate?.()?.toISOString() || null,
      });
    });

    // Aplicar búsqueda en memoria (si hay término de búsqueda)
    if (search) {
      const searchLower = search.toLowerCase();
      allDoctors = allDoctors.filter((doctor) => {
        const nombre = doctor.nombre?.toLowerCase() || "";
        const email = doctor.email?.toLowerCase() || "";
        const especialidad = doctor.especialidad?.toLowerCase() || "";
        const dni = doctor.dni?.toLowerCase() || "";
        
        return (
          nombre.includes(searchLower) ||
          email.includes(searchLower) ||
          especialidad.includes(searchLower) ||
          dni.includes(searchLower)
        );
      });
    }

    // Calcular información de suscripción para cada doctor
    const now = new Date();
    const doctorsWithSubscriptionInfo = allDoctors.map((doctor) => {
      const subscriptionInfo = calculateSubscriptionInfo(doctor, now);
      return {
        ...doctor,
        subscriptionInfo,
      };
    });

    // Aplicar paginación
    const total = doctorsWithSubscriptionInfo.length;
    const totalPages = Math.ceil(total / limitNum);
    const paginatedDoctors = doctorsWithSubscriptionInfo.slice(offset, offset + limitNum);

    // Calcular conteos para navegación
    const pendingCount = allDoctors.filter(d => !d.verified).length;
    const verifiedCount = allDoctors.filter(d => d.verified).length;

    return res.status(200).json({
      doctors: paginatedDoctors,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
      counts: {
        total: allDoctors.length,
        pending: pendingCount,
        verified: verifiedCount,
      },
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return res.status(500).json({ error: "Error fetching doctors" });
  }
}

/**
 * Calcula información de suscripción para un doctor
 */
function calculateSubscriptionInfo(doctor, now) {
  const info = {
    hasActiveSubscription: false,
    isExpired: false,
    daysRemaining: 0,
    expirationDate: null,
    nextPaymentDate: null,
    planName: "Plan Free",
    status: "inactive",
  };

  // Verificar si tiene suscripción activa
  if (doctor.subscriptionStatus === "active" && doctor.subscriptionExpiresAt) {
    const expirationDate = new Date(doctor.subscriptionExpiresAt);
    const daysRemaining = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
    
    info.expirationDate = expirationDate.toISOString();
    info.daysRemaining = daysRemaining;
    info.isExpired = daysRemaining <= 0;
    info.hasActiveSubscription = daysRemaining > 0;
    info.status = daysRemaining > 0 ? "active" : "expired";
    info.planName = doctor.subscriptionPlan || "Plan Free";
    
    // El próximo pago sería la fecha de expiración
    if (daysRemaining > 0) {
      info.nextPaymentDate = expirationDate.toISOString();
    }
  } else {
    info.planName = "Plan Free";
    info.status = "inactive";
  }

  return info;
}
