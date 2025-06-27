// Configuration file for base API and WebSocket URLs

export const API_BASE_URL = 'https://38c4-221-132-116-194.ngrok-free.app';
export const WS_BASE_URL = 'wss://38c4-221-132-116-194.ngrok-free.app';

export const endpoints = {
  processAudio: (meetingId) => `${API_BASE_URL}/api/transcriptions/${meetingId}/process`,
}; 