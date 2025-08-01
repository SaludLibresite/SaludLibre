import { videoConsultationService } from '../../../lib/videoConsultationService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { roomName, userRole = 'guest', userId = null } = req.body;

    if (!roomName) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Nombre de sala requerido' 
      });
    }

    // Validar acceso usando el servicio
    const validation = await videoConsultationService.validateRoomAccess(
      roomName,
      userId,
      userRole
    );

    res.status(200).json(validation);
  } catch (error) {
    console.error('Error validating access:', error);
    res.status(500).json({ 
      valid: false, 
      message: 'Error interno del servidor' 
    });
  }
}
