import { getDoctorBySlug, getAllDoctors } from "../../../lib/doctorsService";
import { getDoctorRank } from "../../../lib/subscriptionUtils";
import {
  getReviewsByDoctorId,
  getDoctorAverageRating,
} from "../../../lib/reviewsService";

// Helper: check if profile is complete
const isProfileComplete = (doctor) =>
  doctor &&
  doctor.verified === true &&
  doctor.profileComplete !== false &&
  doctor.especialidad &&
  doctor.especialidad !== "Por definir" &&
  !(doctor.descripcion && doctor.descripcion.includes("Perfil en configuración"));

// Helper: serialize Firestore data recursively
const serialize = (data) => {
  if (!data) return data;
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (value === undefined) return null;
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
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { slug } = req.query;

  try {
    const doctorData = await getDoctorBySlug(slug);

    if (!doctorData || !isProfileComplete(doctorData)) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Load reviews and related doctors in parallel
    const [allDoctors, doctorReviews, ratingData] = await Promise.all([
      getAllDoctors(),
      getReviewsByDoctorId(doctorData.id),
      getDoctorAverageRating(doctorData.id),
    ]);

    // Transform reviews
    const formatDate = (dateValue) => {
      if (!dateValue) return null;
      if (dateValue.toDate && typeof dateValue.toDate === "function") {
        return dateValue.toDate().toISOString().split("T")[0];
      }
      if (dateValue.seconds && dateValue.nanoseconds !== undefined) {
        return new Date(dateValue.seconds * 1000).toISOString().split("T")[0];
      }
      if (typeof dateValue === "string") return dateValue.split("T")[0];
      return new Date(dateValue).toISOString().split("T")[0];
    };

    const formatFullDate = (dateValue) => {
      if (!dateValue) return null;
      if (dateValue.toDate && typeof dateValue.toDate === "function") {
        return dateValue.toDate().toISOString();
      }
      if (dateValue.seconds && dateValue.nanoseconds !== undefined) {
        return new Date(dateValue.seconds * 1000).toISOString();
      }
      if (typeof dateValue === "string") return new Date(dateValue).toISOString();
      return new Date(dateValue).toISOString();
    };

    const reviews = doctorReviews.map((review) => ({
      id: review.id,
      name: review.patientName,
      photo: "/img/user2.png",
      rating: review.rating,
      date: formatDate(review.createdAt),
      comment: review.comment || "",
      verified: true,
      aspects: review.aspects,
      wouldRecommend: review.wouldRecommend,
      appointmentDate: formatFullDate(review.appointmentDate),
    }));

    // Related doctors (same specialty, complete profiles only)
    const relatedDoctors = allDoctors
      .filter(
        (d) =>
          d.id !== doctorData.id &&
          d.especialidad === doctorData.especialidad &&
          isProfileComplete(d)
      )
      .sort((a, b) => {
        const rankA = getDoctorRank(a);
        const rankB = getDoctorRank(b);
        if (rankA === "VIP" && rankB !== "VIP") return -1;
        if (rankB === "VIP" && rankA !== "VIP") return 1;
        return 0;
      })
      .slice(0, 3);

    // Cache for 5 min, stale for 10 min
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );

    return res.status(200).json({
      doctor: serialize(doctorData),
      relatedDoctors: relatedDoctors.map(serialize),
      reviews,
      averageRating: ratingData,
    });
  } catch (error) {
    console.error("Error fetching doctor:", error);
    return res.status(500).json({ message: "Error loading doctor" });
  }
}
