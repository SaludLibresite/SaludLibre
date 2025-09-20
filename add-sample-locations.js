// Script to add sample location data to doctors for testing map functionality
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// Firebase config (you'll need to replace with your actual config)
const firebaseConfig = {
  // Add your Firebase config here
  // This should match the config in your firebase.js file
};

// Sample locations in Buenos Aires area
const sampleLocations = [
  { latitude: -34.6037, longitude: -58.3816, address: "Av. Corrientes 1234, Buenos Aires" },
  { latitude: -34.6118, longitude: -58.3960, address: "Av. Santa Fe 2500, Buenos Aires" },
  { latitude: -34.5875, longitude: -58.3974, address: "Av. Las Heras 3000, Buenos Aires" },
  { latitude: -34.6158, longitude: -58.3731, address: "Av. Rivadavia 1800, Buenos Aires" },
  { latitude: -34.5991, longitude: -58.3731, address: "Av. Callao 1500, Buenos Aires" },
  { latitude: -34.6092, longitude: -58.3731, address: "Av. 9 de Julio 1200, Buenos Aires" },
  { latitude: -34.6203, longitude: -58.3889, address: "Av. San Juan 2000, Buenos Aires" },
  { latitude: -34.5889, longitude: -58.4019, address: "Av. Pueyrredón 2800, Buenos Aires" },
];

async function addSampleLocations() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Get all doctors
    const doctorsRef = collection(db, 'doctors');
    const querySnapshot = await getDocs(doctorsRef);
    
    console.log(`Found ${querySnapshot.size} doctors`);
    
    let updateCount = 0;
    const promises = [];
    
    querySnapshot.forEach((docSnapshot, index) => {
      // Only update first 8 doctors with sample locations
      if (index < sampleLocations.length) {
        const doctorRef = doc(db, 'doctors', docSnapshot.id);
        const location = sampleLocations[index];
        
        const updatePromise = updateDoc(doctorRef, {
          latitude: location.latitude,
          longitude: location.longitude,
          formattedAddress: location.address,
          ubicacion: location.address, // For backward compatibility
          updatedAt: new Date()
        });
        
        promises.push(updatePromise);
        updateCount++;
        
        console.log(`Updating doctor ${docSnapshot.id} with location:`, location);
      }
    });
    
    await Promise.all(promises);
    
    console.log(`Successfully updated ${updateCount} doctors with sample locations`);
    
  } catch (error) {
    console.error('Error adding sample locations:', error);
  }
}

// Run the script
addSampleLocations();