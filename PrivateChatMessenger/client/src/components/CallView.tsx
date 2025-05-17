import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CallType } from '@/types';
import { formatDuration } from '@/lib/helpers';

interface CallViewProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onEndCall: () => void;
  callType: CallType;
}

const CallView = ({
  localStream,
  remoteStream,
  onEndCall,
  callType,
}: CallViewProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');

  useEffect(() => {
    // Set local stream to video element
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }

    // Set remote stream to video element
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  // Call duration timer
  useEffect(() => {
    const interval = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream && callType === 'video') {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="p-4 flex flex-col">
      <div className="flex space-x-2 flex-1">
        <div className="relative flex-1 rounded-lg overflow-hidden bg-black">
          {remoteStream && (
            <video 
              ref={remoteVideoRef}
              className="absolute inset-0 w-full h-full object-cover" 
              autoPlay 
              playsInline
            />
          )}
          {localStream && callType === 'video' && (
            <div className="absolute bottom-3 right-3 w-32 h-24 rounded-lg overflow-hidden border-2 border-primary bg-black">
              <video 
                ref={localVideoRef}
                className="w-full h-full object-cover" 
                autoPlay 
                muted 
                playsInline
              />
            </div>
          )}
          <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/70 text-white text-xs flex items-center">
            <span className="h-2 w-2 rounded-full bg-[hsl(var(--success))] mr-1 animate-pulse"></span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>
      </div>
      
      <div className="bg-[hsl(var(--surface))] p-2 flex justify-center space-x-4 mt-2">
        <Button 
          onClick={toggleMute}
          variant="outline"
          className={`h-10 w-10 rounded-full ${isMuted ? 'bg-primary' : 'bg-[hsl(var(--surface-light))]'} flex items-center justify-center p-0`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isMuted ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 007.072 0m-9.9 2.828a9 9 0 0112.728 0" />
            )}
          </svg>
        </Button>
        
        {callType === 'video' && (
          <Button 
            onClick={toggleVideo}
            variant="outline"
            className={`h-10 w-10 rounded-full ${isVideoOff ? 'bg-primary' : 'bg-[hsl(var(--surface-light))]'} flex items-center justify-center p-0`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isVideoOff ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              )}
            </svg>
          </Button>
        )}
        
        <Button 
          onClick={onEndCall}
          variant="destructive"
          className="h-10 w-10 rounded-full flex items-center justify-center p-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      </div>
    </div>
  );
};

export default CallView;
