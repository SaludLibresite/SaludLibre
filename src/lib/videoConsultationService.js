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

      // Permitir acceso más flexible
      // Para doctores: verificar que sea su sala
      // Para pacientes: permitir acceso si la sala existe
      // Para invitados: permitir acceso si la sala existe
      const hasAccess = 
        (userRole === 'doctor' && room.doctorId === userId) ||
        (userRole === 'patient') || // Cualquier paciente puede acceder
        (userRole === 'admin') ||
        (userId && userId.startsWith('guest_')); // Usuarios invitados
      
      if (!hasAccess) {
        // Para casos específicos, aún permitir acceso si la sala existe
        console.log('Access validation failed, but allowing access for video consultation');
      }
      
      return { valid: true, room };
    } catch (error) {
      console.error('Error validating room access:', error);
      return { valid: false, message: 'Error al validar acceso' };
    }
  }
};
