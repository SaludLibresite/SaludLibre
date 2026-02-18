// API endpoint para crear y eliminar salas de Daily.co
// POST /api/video/create-room - Crear sala
// DELETE /api/video/create-room - Eliminar sala

import { getRoomPropertiesForType } from '../../../lib/dailyConfig';

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_URL = 'https://api.daily.co/v1';

export default async function handler(req, res) {
  if (!DAILY_API_KEY) {
    console.error('DAILY_API_KEY not configured');
    return res.status(500).json({ 
      error: 'Video service not configured',
      message: 'La configuración del servicio de video no está disponible' 
    });
  }

  if (req.method === 'DELETE') {
    return handleDelete(req, res);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { roomName, consultationType = 'general' } = req.body;

    if (!roomName) {
      return res.status(400).json({ 
        error: 'Room name required',
        message: 'Nombre de sala requerido' 
      });
    }

    // Obtener propiedades según tipo de consulta
    const properties = getRoomPropertiesForType(consultationType);

    // Sanitizar nombre de sala para Daily.co (solo minúsculas, números y guiones)
    const sanitizedName = roomName.toLowerCase().replace(/[^a-z0-9-]/g, '-').substring(0, 41);
    console.log('Creating Daily.co room with name:', sanitizedName);

    // Crear sala en Daily.co
    const response = await fetch(`${DAILY_API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: sanitizedName,
        privacy: properties.privacy,
        properties: {
          exp: properties.exp,
          enable_chat: properties.enable_chat,
          enable_screenshare: properties.enable_screenshare,
          enable_knocking: properties.enable_knocking,
          max_participants: properties.max_participants,
          start_video_off: properties.start_video_off,
          start_audio_off: properties.start_audio_off,
          lang: properties.lang,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Daily.co API error:', errorData);
      
      // Si la sala ya existe, intentar obtenerla
      if (response.status === 400 && (errorData?.info?.includes('already exists') || errorData?.error === 'invalid-request-error')) {
        const existingRoom = await fetch(`${DAILY_API_URL}/rooms/${sanitizedName}`, {
          headers: {
            'Authorization': `Bearer ${DAILY_API_KEY}`,
          },
        });
        
        if (existingRoom.ok) {
          const roomData = await existingRoom.json();
          return res.status(200).json({
            success: true,
            room: {
              name: roomData.name,
              url: roomData.url,
              id: roomData.id,
              created_at: roomData.created_at,
            },
          });
        }
      }
      
      return res.status(response.status).json({
        error: 'Failed to create room',
        message: 'Error al crear la sala de video',
        details: errorData,
      });
    }

    const roomData = await response.json();

    return res.status(200).json({
      success: true,
      room: {
        name: roomData.name,
        url: roomData.url,
        id: roomData.id,
        created_at: roomData.created_at,
      },
    });
  } catch (error) {
    console.error('Error creating Daily.co room:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Error interno al crear la sala de video',
    });
  }
}

async function handleDelete(req, res) {
  try {
    const { roomName } = req.body;

    if (!roomName) {
      return res.status(400).json({ error: 'Room name required' });
    }

    const sanitizedName = roomName.toLowerCase().replace(/[^a-z0-9-]/g, '-').substring(0, 41);
    console.log('Deleting Daily.co room:', sanitizedName);

    const response = await fetch(`${DAILY_API_URL}/rooms/${sanitizedName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (response.ok || response.status === 404) {
      // 404 means room didn't exist, which is fine
      console.log('Daily.co room deleted (or not found):', sanitizedName);
      return res.status(200).json({ success: true, deleted: sanitizedName });
    }

    const errorData = await response.json().catch(() => ({}));
    console.error('Daily.co delete error:', response.status, errorData);
    return res.status(response.status).json({
      error: 'Failed to delete room',
      message: 'Error al eliminar la sala en Daily.co',
      details: errorData,
    });
  } catch (error) {
    console.error('Error deleting Daily.co room:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Error interno al eliminar la sala',
    });
  }
}
