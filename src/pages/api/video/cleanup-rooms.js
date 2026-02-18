// API endpoint para limpiar todas las salas de videoconsulta
// Este endpoint está diseñado para ser llamado por un cron job

import { videoConsultationService } from '../../../lib/videoConsultationService';

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_URL = 'https://api.daily.co/v1';

// Eliminar sala de Daily.co
async function deleteDailyRoom(roomName) {
  if (!DAILY_API_KEY) return;
  
  try {
    await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
    });
  } catch (error) {
    // No fallar si la sala ya no existe en Daily
    console.log(`[CRON] Could not delete Daily room ${roomName}:`, error.message);
  }
}

export default async function handler(req, res) {
  // Solo permitir métodos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST method is allowed' 
    });
  }

  try {
    // Validar que la solicitud venga de Vercel Cron o tenga la clave secreta
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;
    
    // Si tenemos configurado un secreto, validarlo
    if (cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or missing authorization token'
        });
      }
    }

    // Obtener nombres de salas antes de limpiar (para eliminar de Daily.co)
    console.log('[CRON JOB] Getting room names for Daily.co cleanup...');
    let roomNames = [];
    try {
      const rooms = await videoConsultationService.getDoctorRooms('__all__').catch(() => []);
      // Si no funciona con __all__, limpiar Firestore y las salas de Daily expiran solas
      roomNames = rooms.map(r => r.roomName).filter(Boolean);
    } catch (e) {
      console.log('[CRON JOB] Could not get room names, proceeding with Firestore cleanup only');
    }

    // Ejecutar la limpieza de Firestore
    console.log('[CRON JOB] Starting video rooms cleanup...');
    const result = await videoConsultationService.cleanupAllRooms();
    
    // Intentar limpiar las salas de Daily.co también
    if (roomNames.length > 0) {
      console.log(`[CRON JOB] Deleting ${roomNames.length} Daily.co rooms...`);
      await Promise.allSettled(roomNames.map(name => deleteDailyRoom(name)));
    }
    
    // Log del resultado
    console.log('[CRON JOB] Cleanup completed:', result);
    
    // Responder con el resultado
    return res.status(200).json({
      success: true,
      message: 'Video rooms cleanup completed successfully',
      data: result
    });

  } catch (error) {
    console.error('[CRON JOB] Error during cleanup:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}