// WebRTC configuration
export const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// Maximum file size for sharing (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
