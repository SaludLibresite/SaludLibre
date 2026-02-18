import { getAllDoctors } from "../../../lib/doctorsService";
import { getDoctorRank } from "../../../lib/subscriptionUtils";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const doctors = await getAllDoctors();

    // Only show verified doctors with complete profiles
    const verifiedDoctors = doctors.filter(
      (doctor) =>
        doctor.verified === true &&
        doctor.profileComplete !== false &&
        doctor.especialidad && doctor.especialidad !== "Por definir" &&
        doctor.descripcion && !doctor.descripcion.includes("Perfil en configuración")
    );

    // Serialize - convert Firebase Timestamps to strings
    const serializedDoctors = verifiedDoctors.map((doctor) => {
      const serialized = JSON.parse(
        JSON.stringify(doctor, (key, value) => {
          if (value && typeof value === "object" && typeof value.toDate === "function") {
            return value.toDate().toISOString();
          }
          if (value && typeof value === "object" && "seconds" in value && "nanoseconds" in value && Object.keys(value).length === 2) {
            return new Date(value.seconds * 1000).toISOString();
          }
          if (value && typeof value === "object" && "_seconds" in value && "_nanoseconds" in value) {
            return new Date(value._seconds * 1000).toISOString();
          }
          return value;
        })
      );
      return serialized;
    });

    // Cache response for 5 minutes, allow stale for 10 minutes
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );

    return res.status(200).json({
      doctors: serializedDoctors,
      generatedAt: new Date().toISOString(),
      total: serializedDoctors.length,
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return res.status(500).json({ message: "Error loading doctors" });
  }
}
