import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export const videoConsultationService = {
  // Crear una nueva sala de videoconsulta
  async createVideoRoom({ 
    doctorId, 
    patientId,
    patientName,
    patientEmail, 
    appointmentId, 
    roomName, 
    scheduledTime = null,
    consultationType = 'general',
    notes = ''
  }) {
    try {
      // Ya no verificamos si hay salas activas - permitimos crear libremente
      // Las salas serán limpiadas automáticamente por el cron job a las 12:00 AM

      const roomData = {
        doctorId,
        patientId,
        patientName,
        patientEmail,
        appointmentId,
        roomName,
        scheduledTime,
        consultationType,
        notes,
        status: 'scheduled', // scheduled, active, completed, cancelled
        doctorJoined: false, // Controlar si el doctor está presente
        doctorJoinedAt: null,
        doctorLeftAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        participants: [],
        duration: null,
        recordingUrl: null,
        isRecording: false
      };

      const docRef = await addDoc(collection(db, 'videoConsultations'), roomData);
      return { id: docRef.id, ...roomData };
    } catch (error) {
      console.error('Error creating video room:', error);
      throw error;
    }
  },

  // Obtener información de una sala
  async getVideoRoom(roomId) {
    try {
      const docRef = doc(db, 'videoConsultations', roomId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('Sala de video no encontrada');
      }
    } catch (error) {
      console.error('Error getting video room:', error);
      throw error;
    }
  },

  // Obtener sala por nombre de room
  async getVideoRoomByName(roomName) {
    try {
      const q = query(
        collection(db, 'videoConsultations'),
        where('roomName', '==', roomName)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting video room by name:', error);
      throw error;
    }
  },

  // Unirse a una sala (agregar participante)
  async joinRoom(roomId, participantInfo) {
    try {
      const roomRef = doc(db, 'videoConsultations', roomId);
      const roomSnap = await getDoc(roomRef);
      
      if (roomSnap.exists()) {
        const currentParticipants = roomSnap.data().participants || [];
        
        // Verificar si el participante ya está en la sala
        const existingParticipant = currentParticipants.find(
          p => p.userId === participantInfo.userId
        );
        
        if (!existingParticipant) {
          const updatedParticipants = [
            ...currentParticipants,
            {
              ...participantInfo,
              joinedAt: new Date().toISOString()
            }
          ];
          
          await updateDoc(roomRef, {
            participants: updatedParticipants,
            status: 'active',
            updatedAt: serverTimestamp()
          });
        }
        
        return true;
      } else {
        throw new Error('Sala no encontrada');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  },

  // Salir de una sala (remover participante)
  async leaveRoom(roomId, userId) {
    try {
      const roomRef = doc(db, 'videoConsultations', roomId);
      const roomSnap = await getDoc(roomRef);
      
      if (roomSnap.exists()) {
        const currentParticipants = roomSnap.data().participants || [];
        const updatedParticipants = currentParticipants.filter(
          p => p.userId !== userId
        );
        
        // Si no quedan participantes, marcar como completada
        const status = updatedParticipants.length === 0 ? 'completed' : 'active';
        
        await updateDoc(roomRef, {
          participants: updatedParticipants,
          status,
          updatedAt: serverTimestamp()
        });
        
        return true;
      }
    } catch (error) {
      console.error('Error leaving room:', error);
      throw error;
    }
  },

  // Actualizar estado de la sala
  async updateRoomStatus(roomId, status, additionalData = {}) {
    try {
      const roomRef = doc(db, 'videoConsultations', roomId);
      
      await updateDoc(roomRef, {
        status,
        ...additionalData,
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating room status:', error);
      throw error;
    }
  },

  // Obtener salas por doctor
  async getDoctorRooms(doctorId) {
    try {
      const q = query(
        collection(db, 'videoConsultations'),
        where('doctorId', '==', doctorId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting doctor rooms:', error);
      throw error;
    }
  },

  // Obtener salas por paciente
  async getPatientRooms(patientId) {
    try {
      const q = query(
        collection(db, 'videoConsultations'),
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting patient rooms:', error);
      throw error;
    }
  },

  // Verificar si un paciente tiene salas activas
  async hasActivePatientRoom(patientId) {
    try {
      const q = query(
        collection(db, 'videoConsultations'),
        where('patientId', '==', patientId),
        where('status', 'in', ['scheduled', 'active'])
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.length > 0;
    } catch (error) {
      console.error('Error checking active patient rooms:', error);
      throw error;
    }
  },

  // Verificar si un doctor tiene salas activas
  async hasActiveDoctorRoom(doctorId) {
    try {
      const q = query(
        collection(db, 'videoConsultations'),
        where('doctorId', '==', doctorId),
        where('status', 'in', ['scheduled', 'active'])
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.length > 0;
    } catch (error) {
      console.error('Error checking active doctor rooms:', error);
      throw error;
    }
  },

  // Obtener salas activas de un paciente
  async getActivePatientRooms(patientId) {
    try {
      const q = query(
        collection(db, 'videoConsultations'),
        where('patientId', '==', patientId),
        where('status', 'in', ['scheduled', 'active']),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting active patient rooms:', error);
      throw error;
    }
  },

  // Obtener salas programadas para hoy
  async getTodayScheduledRooms(doctorId) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const q = query(
        collection(db, 'videoConsultations'),
        where('doctorId', '==', doctorId),
        where('scheduledTime', '>=', startOfDay),
        where('scheduledTime', '<', endOfDay),
        orderBy('scheduledTime', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting today scheduled rooms:', error);
      throw error;
    }
  },

  // Escuchar cambios en tiempo real de una sala
  subscribeToRoom(roomId, callback) {
    const roomRef = doc(db, 'videoConsultations', roomId);
    
    return onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });
  },

  // Escuchar salas activas del doctor
  subscribeToActiveDoctorRooms(doctorId, callback) {
    const q = query(
      collection(db, 'videoConsultations'),
      where('doctorId', '==', doctorId),
      where('status', 'in', ['scheduled', 'active'])
    );
    
    return onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(rooms);
    });
  },

  // Generar nombre único para la sala
  generateRoomName(doctorId, patientId, appointmentId) {
    const timestamp = Date.now();
    // Para servidor privado, usar un formato que indique sala pública
    return `public-${doctorId.substring(0, 8)}-${patientId.substring(0, 8)}-${appointmentId}-${timestamp}`;
  },

    // Marcar que el doctor se unió a la sala
  async markDoctorJoined(roomId, doctorId) {
    try {
      const roomRef = doc(db, 'videoConsultations', roomId);
      await updateDoc(roomRef, {
        doctorJoined: true,
        doctorJoinedAt: serverTimestamp(),
        status: 'active',
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error marking doctor joined:', error);
      throw error;
    }
  },

  // Marcar que el doctor salió y finalizar la sala
  async markDoctorLeft(roomId, doctorId) {
    try {
      const roomRef = doc(db, 'videoConsultations', roomId);
      await updateDoc(roomRef, {
        doctorJoined: false,
        doctorLeftAt: serverTimestamp(),
        status: 'completed',
        endedBy: 'doctor',
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error marking doctor left:', error);
      throw error;
    }
  },

  // Verificar si el doctor está en la sala
  async isDoctorInRoom(roomId) {
    try {
      const room = await this.getVideoRoom(roomId);
      return room && room.doctorJoined === true;
    } catch (error) {
      console.error('Error checking if doctor is in room:', error);
      return false;
    }
  },

  // Eliminar una sala de videoconsulta
  async deleteVideoRoom(roomId) {
    try {
      const roomRef = doc(db, 'videoConsultations', roomId);
      await deleteDoc(roomRef);
      return true;
    } catch (error) {
      console.error('Error deleting video room:', error);
      throw error;
    }
  },

  // Limpieza automática de todas las salas (para cron job)
  async cleanupAllRooms() {
    try {
      // Obtener todas las salas
      const querySnapshot = await getDocs(collection(db, 'videoConsultations'));
      
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      const deletedCount = querySnapshot.docs.length;
      console.log(`[CRON CLEANUP] Deleted ${deletedCount} video consultation rooms`);
      
      return {
        success: true,
        deletedCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in cleanup all rooms:', error);
      throw error;
    }
  },

  // Validar acceso a la sala
  async validateRoomAccess(roomName, userId, userRole) {
    try {
      const room = await this.getVideoRoomByName(roomName);
      
      if (!room) {
        return { valid: false, message: 'Sala no encontrada' };
      }
      
      // Verificar si la sala está activa o programada
      if (!['scheduled', 'active'].includes(room.status)) {
        return { valid: false, message: 'La sala no está disponible' };
      }

      // Para pacientes: verificar que el doctor esté presente
      if (userRole === 'patient' || userRole === 'guest') {
        if (!room.doctorJoined) {
          return { 
            valid: false, 
            message: 'El doctor aún no ha iniciado la videoconsulta. Por favor espere.' 
          };
        }
      }

      // Permitir acceso controlado
      const hasAccess = 
        (userRole === 'doctor' && room.doctorId === userId) ||
        (userRole === 'patient' && room.doctorJoined) || // Solo si doctor está presente
        (userRole === 'admin') ||
        (userRole === 'guest' && room.doctorJoined); // Solo si doctor está presente
      
      if (!hasAccess) {
        return { 
          valid: false, 
          message: userRole === 'doctor' ? 
            'Esta sala no pertenece a tu cuenta.' : 
            'No tienes acceso a esta sala.' 
        };
      }
      
      return { valid: true, room };
    } catch (error) {
      console.error('Error validating room access:', error);
      return { valid: false, message: 'Error al validar acceso' };
    }
  }
};
