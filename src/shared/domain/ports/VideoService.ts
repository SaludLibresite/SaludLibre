// ============================================================
// Video Service Port — Hexagonal boundary for video conferencing
// Infrastructure implementations: Daily.co, Jitsi, etc.
// ============================================================

export interface CreateRoomParams {
  roomName: string;
  expiresAt: Date;
  maxParticipants?: number;
}

export interface VideoRoom {
  name: string;
  url: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface VideoService {
  createRoom(params: CreateRoomParams): Promise<VideoRoom>;
  deleteRoom(roomName: string): Promise<void>;
  getRoomStatus(roomName: string): Promise<'active' | 'ended' | 'not_found'>;
}
