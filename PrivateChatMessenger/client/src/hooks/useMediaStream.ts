import { useState, useRef, useCallback } from 'react';

const useMediaStream = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Start local media stream (audio or video)
  const startLocalStream = useCallback(async (withVideo: boolean) => {
    try {
      // Stop any existing stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }

      // Get new media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: withVideo ? true : false,
      });

      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      return null;
    }
  }, []);

  // Stop local media stream
  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      setLocalStream(null);
      localStreamRef.current = null;
    }
  }, []);

  // Attach remote stream
  const attachRemoteStream = useCallback((stream: MediaStream) => {
    setRemoteStream(stream);
  }, []);

  return {
    localStream,
    remoteStream,
    startLocalStream,
    stopLocalStream,
    attachRemoteStream,
  };
};

export default useMediaStream;
