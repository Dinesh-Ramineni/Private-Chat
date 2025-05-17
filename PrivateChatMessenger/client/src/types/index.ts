// Connection status enum
export enum ConnectionStatus {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
}

// Call type
export type CallType = 'none' | 'audio' | 'video';

// Mobile view type
export type View = 'connection' | 'chat' | 'call';

// Message types
export interface Message {
  id: string;
  content: string;
  type: 'text' | 'image' | 'file';
  sender: 'self' | 'peer';
  timestamp: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}
