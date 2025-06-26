// Configuration file for base API and WebSocket URLs

export const API_BASE_URL = 'https://d772-103-125-177-218.ngrok-free.app';
export const WS_BASE_URL = 'wss://d772-103-125-177-218.ngrok-free.app';

export const endpoints = {
  processAudio: (meetingId) => `${API_BASE_URL}/api/transcriptions/${meetingId}/process`,
}; 