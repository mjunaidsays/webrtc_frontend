import { API_BASE_URL, WS_BASE_URL } from './config';

export const endpoints = {
  createMeeting: (title, owner_name) => `${API_BASE_URL}/api/meetings/create?title=${encodeURIComponent(title)}&owner_name=${encodeURIComponent(owner_name)}`,
  joinMeeting: (roomId) => `${API_BASE_URL}/api/meetings/${roomId}/join`,
  endMeeting: (roomId) => `${API_BASE_URL}/api/meetings/${roomId}/end`,
  meetingStatus: (roomId) => `${API_BASE_URL}/api/meetings/${roomId}/status`,
  uploadAudio: (roomId) => `${API_BASE_URL}/api/transcriptions/${roomId}/upload`,
  getTranscriptions: (roomId) => `${API_BASE_URL}/api/transcriptions/${roomId}`,
  getSummary: (roomId) => `${API_BASE_URL}/api/insights/${roomId}/view`,
  wsSummary: (roomId) => `${WS_BASE_URL}/ws/summary/${roomId}`,
  wsChat: () => `${WS_BASE_URL}/ws/chat/`,
  processAudio: (roomId) => `${API_BASE_URL}/api/transcriptions/${roomId}/process`,
}; 