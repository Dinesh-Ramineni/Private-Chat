import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ConnectionStatus } from '@/types';

interface ConnectionPanelProps {
  roomId: string;
  setRoomId: (roomId: string) => void;
  signal: string;
  connectionStatus: ConnectionStatus;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onProcessSignal: (signalData: string) => void;
  onStartAudioCall: () => void;
  onStartVideoCall: () => void;
  onEndCall: () => void;
  callActive: boolean;
  userId: number | null;
}

const ConnectionPanel = ({
  roomId,
  setRoomId,
  signal,
  connectionStatus,
  onCreateRoom,
  onJoinRoom,
  onProcessSignal,
  onStartAudioCall,
  onStartVideoCall,
  onEndCall,
  callActive,
  userId,
}: ConnectionPanelProps) => {
  const [signalText, setSignalText] = useState('');
  
  const handleCopySignal = () => {
    navigator.clipboard.writeText(signal);
  };

  const isConnecting = connectionStatus === ConnectionStatus.Connecting;
  const isConnected = connectionStatus === ConnectionStatus.Connected;
  
  return (
    <>
      <div className="rounded-lg bg-[hsl(var(--surface-light))] p-4 mb-4">
        <h2 className="font-semibold mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Connection Setup
        </h2>
        <div className="mb-4">
          <label htmlFor="roomId" className="block text-sm font-medium text-[hsl(var(--text-secondary))] mb-1">
            Room ID (shared secret)
          </label>
          <Input
            id="roomId"
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter a unique room name"
            className="w-full px-3 py-2 bg-[hsl(var(--surface))] border border-[hsl(var(--surface-light))] rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={onCreateRoom}
            disabled={isConnecting || isConnected || !roomId}
            className={`flex-1 ${isConnecting || isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
            variant="default"
          >
            Create Room
          </Button>
          <Button
            onClick={onJoinRoom}
            disabled={isConnecting || isConnected || !roomId}
            className={`flex-1 ${isConnecting || isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
            variant="outline"
          >
            Join Room
          </Button>
        </div>
      </div>

      <div className="rounded-lg bg-[hsl(var(--surface-light))] p-4 mb-4">
        <h2 className="font-semibold mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Signal Exchange
        </h2>
        <Textarea
          value={signalText}
          onChange={(e) => setSignalText(e.target.value)}
          className="w-full h-24 px-3 py-2 bg-[hsl(var(--surface))] border border-[hsl(var(--surface-light))] rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-2 font-mono text-xs"
          placeholder="Copy/paste offer or answer here..."
        />
        <div className="flex space-x-2">
          <Button
            onClick={handleCopySignal}
            className="flex-1 flex items-center justify-center"
            variant={signal ? "default" : "outline"}
            disabled={!signal}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Copy
          </Button>
          <Button
            onClick={() => onProcessSignal(signalText)}
            className="flex-1"
            variant="outline"
            disabled={!signalText}
          >
            Process
          </Button>
        </div>
      </div>

      <div className="rounded-lg bg-[hsl(var(--surface-light))] p-4">
        <h2 className="font-semibold mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Call Controls
        </h2>
        <div className="flex space-x-2">
          <Button
            onClick={onStartAudioCall}
            disabled={!isConnected || callActive}
            className="flex-1 flex items-center justify-center"
            variant={isConnected && !callActive ? "default" : "outline"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Audio Call
          </Button>
          <Button
            onClick={onStartVideoCall}
            disabled={!isConnected || callActive}
            className="flex-1 flex items-center justify-center"
            variant={isConnected && !callActive ? "default" : "outline"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Video Call
          </Button>
        </div>
        <Button
          onClick={onEndCall}
          disabled={!callActive}
          className="w-full mt-2 flex items-center justify-center"
          variant="destructive"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          End Call
        </Button>
      </div>

      <div className="mt-auto pt-4 text-xs text-[hsl(var(--text-secondary))]">
        <p>All communication is peer-to-peer and end-to-end encrypted. No data is stored on servers.</p>
        <div className="flex items-center mt-2 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Help & About</span>
        </div>
      </div>
    </>
  );
};

export default ConnectionPanel;
