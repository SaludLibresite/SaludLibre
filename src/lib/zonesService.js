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
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

// Collection name for zones
const ZONES_COLLECTION = "medical_zones";

/**
 * Calculate if a point is inside a polygon using ray casting algorithm
 * @param {number} lat - Point latitude
 * @param {number} lng - Point longitude
 * @param {Array} polygon - Array of {lat, lng} coordinates defining the polygon
 * @returns {boolean} - True if point is inside polygon
 */
function isPointInPolygon(lat, lng, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lng;
    const xj = polygon[j].lat;
    const yj = polygon[j].lng;

    if (
      yi > lng !== yj > lng &&
      lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - First point latitude
 * @param {number} lng1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lng2 - Second point longitude
 * @returns {number} - Distance in kilometers
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get all medical zones
 * @returns {Array} Array of zone objects
 */
export async function getAllZones() {
  try {
    const zonesRef = collection(db, ZONES_COLLECTION);
    const q = query(zonesRef, orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting zones:", error);
    throw error;
  }
}

/**
 * Get active zones only
 * @returns {Array} Array of active zone objects
 */
export async function getActiveZones() {
  try {
    const zonesRef = collection(db, ZONES_COLLECTION);
    const q = query(
      zonesRef,
      where("isActive", "==", true),
      orderBy("name", "asc")
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting active zones:", error);
    throw error;
  }
}

/**
 * Get a zone by ID
 * @param {string} zoneId - Zone ID
 * @returns {Object|null} Zone object or null if not found
 */
export async function getZoneById(zoneId) {
  try {
    const zoneRef = doc(db, ZONES_COLLECTION, zoneId);
    const snapshot = await getDoc(zoneRef);
    
    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        ...snapshot.data(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting zone:", error);
    throw error;
  }
}

/**
 * Create a new zone
 * @param {Object} zoneData - Zone data
 * @returns {string} Created zone ID
 */
export async function createZone(zoneData) {
  try {
    const newZone = {
      ...zoneData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: zoneData.isActive !== false, // Default to true
    };

    const zonesRef = collection(db, ZONES_COLLECTION);
    const docRef = await addDoc(zonesRef, newZone);
    
    return docRef.id;
  } catch (error) {
    console.error("Error creating zone:", error);
    throw error;
  }
}

/**
 * Update an existing zone
 * @param {string} zoneId - Zone ID
 * @param {Object} updates - Updates to apply
 * @returns {boolean} Success status
 */
export async function updateZone(zoneId, updates) {
  try {
    const zoneRef = doc(db, ZONES_COLLECTION, zoneId);
    await updateDoc(zoneRef, {
      ...updates,
      updatedAt: new Date(),
    });
    
    return true;
  } catch (error) {
    console.error("Error updating zone:", error);
    throw error;
  }
}

/**
 * Delete a zone
 * @param {string} zoneId - Zone ID
 * @returns {boolean} Success status
 */
export async function deleteZone(zoneId) {
  try {
    const zoneRef = doc(db, ZONES_COLLECTION, zoneId);
    await deleteDoc(zoneRef);
    
    return true;
  } catch (error) {
    console.error("Error deleting zone:", error);
    throw error;
  }
}

/**
 * Find which zone contains a specific coordinate
 * @param {number} latitude - Point latitude
 * @param {number} longitude - Point longitude
 * @returns {Object|null} Zone object or null if not found
 */
export async function findZoneForCoordinates(latitude, longitude) {
  try {
    const zones = await getActiveZones();
    
    for (const zone of zones) {
      if (zone.type === "polygon" && zone.coordinates) {
        if (isPointInPolygon(latitude, longitude, zone.coordinates)) {
          return zone;
        }
      } else if (zone.type === "circle" && zone.center && zone.radius) {
        const distance = calculateDistance(
          latitude,
          longitude,
          zone.center.lat,
          zone.center.lng
        );
        if (distance <= zone.radius) {
          return zone;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error finding zone for coordinates:", error);
    throw error;
  }
}

/**
 * Get doctors grouped by zones
 * @param {Array} doctors - Array of doctor objects with latitude/longitude
 * @returns {Object} Object with zones as keys and arrays of doctors as values
 */
export async function groupDoctorsByZones(doctors) {
  try {
    const zones = await getActiveZones();
    const result = {
      "Sin zona asignada": []
    };
    
    // Initialize result object with zone names
    zones.forEach(zone => {
      result[zone.name] = [];
    });
    
    // Classify each doctor
    for (const doctor of doctors) {
      if (!doctor.latitude || !doctor.longitude) {
        result["Sin zona asignada"].push(doctor);
        continue;
      }
      
      let assigned = false;
      
      for (const zone of zones) {
        if (zone.type === "polygon" && zone.coordinates) {
          if (isPointInPolygon(doctor.latitude, doctor.longitude, zone.coordinates)) {
            result[zone.name].push(doctor);
            assigned = true;
            break;
          }
        } else if (zone.type === "circle" && zone.center && zone.radius) {
          const distance = calculateDistance(
            doctor.latitude,
            doctor.longitude,
            zone.center.lat,
            zone.center.lng
          );
          if (distance <= zone.radius) {
            result[zone.name].push(doctor);
            assigned = true;
            break;
          }
        }
      }
      
      if (!assigned) {
        result["Sin zona asignada"].push(doctor);
      }
    }
    
    return result;
  } catch (error) {
    console.error("Error grouping doctors by zones:", error);
    throw error;
  }
}

/**
 * Assign zones to all doctors in batch
 * This function updates doctor documents with their assigned zone
 * @param {Array} doctors - Array of doctor objects
 * @returns {Object} Summary of assignments
 */
export async function assignZonesToDoctors(doctors) {
  try {
    const batch = writeBatch(db);
    const zones = await getActiveZones();
    const assignments = {
      assigned: 0,
      unassigned: 0,
      errors: []
    };
    
    for (const doctor of doctors) {
      try {
        if (!doctor.id || !doctor.latitude || !doctor.longitude) {
          assignments.unassigned++;
          continue;
        }
        
        let assignedZone = null;
        
        for (const zone of zones) {
          if (zone.type === "polygon" && zone.coordinates) {
            if (isPointInPolygon(doctor.latitude, doctor.longitude, zone.coordinates)) {
              assignedZone = {
                id: zone.id,
                name: zone.name
              };
              break;
            }
          } else if (zone.type === "circle" && zone.center && zone.radius) {
            const distance = calculateDistance(
              doctor.latitude,
              doctor.longitude,
              zone.center.lat,
              zone.center.lng
            );
            if (distance <= zone.radius) {
              assignedZone = {
                id: zone.id,
                name: zone.name
              };
              break;
            }
          }
        }
        
        const doctorRef = doc(db, "doctors", doctor.id);
        batch.update(doctorRef, {
          assignedZone,
          updatedAt: new Date()
        });
        
        if (assignedZone) {
          assignments.assigned++;
        } else {
          assignments.unassigned++;
        }
      } catch (error) {
        assignments.errors.push({
          doctorId: doctor.id,
          error: error.message
        });
      }
    }
    
    await batch.commit();
    return assignments;
  } catch (error) {
    console.error("Error assigning zones to doctors:", error);
    throw error;
  }
}

/**
 * Get zones with doctor counts
 * @returns {Array} Array of zones with doctorCount property
 */
export async function getZonesWithDoctorCount() {
  try {
    const zones = await getAllZones();
    const { getAllDoctors } = require("./doctorsService");
    const doctors = await getAllDoctors();
    
    const zonesWithCount = await Promise.all(
      zones.map(async (zone) => {
        let doctorCount = 0;
        
        for (const doctor of doctors) {
          if (!doctor.latitude || !doctor.longitude || !doctor.verified) continue;
          
          if (zone.type === "polygon" && zone.coordinates) {
            if (isPointInPolygon(doctor.latitude, doctor.longitude, zone.coordinates)) {
              doctorCount++;
            }
          } else if (zone.type === "circle" && zone.center && zone.radius) {
            const distance = calculateDistance(
              doctor.latitude,
              doctor.longitude,
              zone.center.lat,
              zone.center.lng
            );
            if (distance <= zone.radius) {
              doctorCount++;
            }
          }
        }
        
        return {
          ...zone,
          doctorCount
        };
      })
    );
    
    return zonesWithCount;
  } catch (error) {
    console.error("Error getting zones with doctor count:", error);
    throw error;
  }
}
