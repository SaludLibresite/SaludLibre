import type {
  VideoService,
  CreateRoomParams,
  VideoRoom,
} from '@/src/shared/domain/ports/VideoService';

// ============================================================
// Daily.co Video Service — Infrastructure implementation
// Uses Daily.co REST API directly (no SDK dependency)
// Requires env: DAILY_API_KEY
// ============================================================

export class DailyVideoService implements VideoService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.daily.co/v1';

  constructor() {
    const key = process.env.DAILY_API_KEY;
    if (!key) throw new Error('DAILY_API_KEY environment variable is required');
    this.apiKey = key;
  }

  async createRoom(params: CreateRoomParams): Promise<VideoRoom> {
    const body = {
      name: params.roomName,
      properties: {
        exp: Math.floor(params.expiresAt.getTime() / 1000),
        max_participants: params.maxParticipants ?? 2,
        enable_chat: true,
        enable_screenshare: true,
        start_video_off: false,
        start_audio_off: false,
      },
    };

    const response = await fetch(`${this.baseUrl}/rooms`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Daily.co API error (${response.status}): ${error}`);
    }

    const data = (await response.json()) as {
      name: string;
      url: string;
      created_at: string;
      config: { exp: number };
    };

    return {
      name: data.name,
      url: data.url,
      createdAt: new Date(data.created_at),
      expiresAt: new Date(data.config.exp * 1000),
    };
  }

  async deleteRoom(roomName: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/rooms/${encodeURIComponent(roomName)}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      },
    );

    // 404 = room already deleted, treat as success
    if (!response.ok && response.status !== 404) {
      const error = await response.text();
      throw new Error(`Daily.co API error (${response.status}): ${error}`);
    }
  }

  async getRoomStatus(roomName: string): Promise<'active' | 'ended' | 'not_found'> {
    const response = await fetch(
      `${this.baseUrl}/rooms/${encodeURIComponent(roomName)}`,
      {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      },
    );

    if (response.status === 404) return 'not_found';

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Daily.co API error (${response.status}): ${error}`);
    }

    const data = (await response.json()) as { config: { exp: number } };
    const expiresAt = new Date(data.config.exp * 1000);

    return expiresAt > new Date() ? 'active' : 'ended';
  }
}
