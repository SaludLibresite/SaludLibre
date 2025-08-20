import React from "react";
import DoctorCard from "./DoctorCard";
import { getDoctorRank } from "../../lib/subscriptionUtils";

export default function RankSection({ doctors, index }) {
  const getGridCols = () => {
    const firstDoctor = doctors[0];
    const rank = getDoctorRank(firstDoctor);
    switch (rank) {
      case "VIP":
        return "grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8";
      case "Intermedio":
        return "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6";
      default:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5";
    }
  };

  return doctors.length > 0 ? (
    <div className={`grid ${getGridCols()}`}>
      {doctors.map((doctor, idx) => (
        <DoctorCard
          key={doctor.id}
          doctor={doctor}
          delay={10 * (idx + index * 4)}
        />
      ))}
    </div>
  ) : null;
}
