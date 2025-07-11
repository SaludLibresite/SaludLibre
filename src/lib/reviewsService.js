import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";

const REVIEWS_COLLECTION = "reviews";

// Get all reviews for a specific patient
export async function getReviewsByPatientId(patientId) {
  try {
    const reviewsRef = collection(db, REVIEWS_COLLECTION);
    const q = query(
      reviewsRef,
      where("patientId", "==", patientId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    const reviews = [];
    querySnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return reviews;
  } catch (error) {
    console.error("Error getting reviews:", error);
    throw error;
  }
}

// Get all reviews for a specific doctor
export async function getReviewsByDoctorId(doctorId) {
  try {
    const reviewsRef = collection(db, REVIEWS_COLLECTION);
    const q = query(
      reviewsRef,
      where("doctorId", "==", doctorId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    const reviews = [];
    querySnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return reviews;
  } catch (error) {
    console.error("Error getting doctor reviews:", error);
    throw error;
  }
}

// Create a new review
export async function createReview(reviewData) {
  try {
    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), {
      ...reviewData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      id: docRef.id,
      ...reviewData,
    };
  } catch (error) {
    console.error("Error creating review:", error);
    throw error;
  }
}

// Update a review
export async function updateReview(reviewId, reviewData) {
  try {
    const docRef = doc(db, REVIEWS_COLLECTION, reviewId);
    await updateDoc(docRef, {
      ...reviewData,
      updatedAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error("Error updating review:", error);
    throw error;
  }
}

// Delete a review
export async function deleteReview(reviewId) {
  try {
    await deleteDoc(doc(db, REVIEWS_COLLECTION, reviewId));
    return true;
  } catch (error) {
    console.error("Error deleting review:", error);
    throw error;
  }
}

// Get appointments that can be reviewed (completed appointments without reviews)
export async function getReviewableAppointments(patientId) {
  try {
    // Get all completed appointments for this patient
    const { getAppointmentsByPatientId } = await import(
      "./appointmentsService"
    );
    const appointments = await getAppointmentsByPatientId(patientId);

    // Filter to only completed appointments
    const completedAppointments = appointments.filter(
      (appointment) => appointment.status === "completed"
    );

    // Get existing reviews for this patient
    const existingReviews = await getReviewsByPatientId(patientId);
    const reviewedAppointmentIds = existingReviews.map(
      (review) => review.appointmentId
    );

    // Filter out appointments that already have reviews
    const reviewableAppointments = completedAppointments.filter(
      (appointment) => !reviewedAppointmentIds.includes(appointment.id)
    );

    return reviewableAppointments;
  } catch (error) {
    console.error("Error getting reviewable appointments:", error);
    throw error;
  }
}

// Check if an appointment can be reviewed
export async function canReviewAppointment(appointmentId, patientId) {
  try {
    // Check if appointment exists and is completed
    const { getAppointmentById } = await import("./appointmentsService");
    const appointment = await getAppointmentById(appointmentId);

    if (
      !appointment ||
      appointment.status !== "completed" ||
      appointment.patientId !== patientId
    ) {
      return false;
    }

    // Check if review already exists
    const reviewsRef = collection(db, REVIEWS_COLLECTION);
    const q = query(
      reviewsRef,
      where("appointmentId", "==", appointmentId),
      where("patientId", "==", patientId)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.empty; // Can review if no existing review
  } catch (error) {
    console.error("Error checking if appointment can be reviewed:", error);
    return false;
  }
}

// Get average rating for a doctor
export async function getDoctorAverageRating(doctorId) {
  try {
    const reviews = await getReviewsByDoctorId(doctorId);

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        aspectAverages: {
          punctuality: 0,
          attention: 0,
          explanation: 0,
          facilities: 0,
        },
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Calculate aspect averages
    const aspectTotals = {
      punctuality: 0,
      attention: 0,
      explanation: 0,
      facilities: 0,
    };

    reviews.forEach((review) => {
      if (review.aspects) {
        Object.keys(aspectTotals).forEach((aspect) => {
          aspectTotals[aspect] += review.aspects[aspect] || 0;
        });
      }
    });

    const aspectAverages = {};
    Object.keys(aspectTotals).forEach((aspect) => {
      aspectAverages[aspect] = aspectTotals[aspect] / reviews.length;
    });

    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: reviews.length,
      aspectAverages,
    };
  } catch (error) {
    console.error("Error calculating doctor average rating:", error);
    return {
      averageRating: 0,
      totalReviews: 0,
      aspectAverages: {
        punctuality: 0,
        attention: 0,
        explanation: 0,
        facilities: 0,
      },
    };
  }
}
