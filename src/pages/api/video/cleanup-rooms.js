// API endpoint para limpiar todas las salas de videoconsulta
// Este endpoint está diseñado para ser llamado por un cron job

import { videoConsultationService } from '../../../lib/videoConsultationService';

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

    // Ejecutar la limpieza
    console.log('[CRON JOB] Starting video rooms cleanup...');
    const result = await videoConsultationService.cleanupAllRooms();
    
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