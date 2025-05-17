import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ConnectionPanel from '@/components/ConnectionPanel';
import ChatArea from '@/components/ChatArea';
import CallView from '@/components/CallView';
import MobileNavigation from '@/components/MobileNavigation';
import AuthForm from '@/components/AuthForm';
import useWebRTC from '@/hooks/useWebRTC';
import useWebSocket from '@/hooks/useWebSocket';
import useLocalStorage from '@/hooks/useLocalStorage';
import { ConnectionStatus, View } from '@/types';
import { Message } from '@/types';

const Home = () => {
  const [activeView, setActiveView] = useState<View>('connection');
  const [callActive, setCallActive] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [messages, setMessages] = useLocalStorage<Message[]>('messages', []);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [username, setUsername] = useState<string>('');

  const {
    connectionStatus,
    peerConnection,
    dataChannel,
    createOffer,
    createAnswer,
    processSignal,
    signal,
    startCall,
    endCall,
    localStream,
    remoteStream,
    isCaller,
    callType,
  } = useWebRTC();
  
  const { 
    connected: wsConnected,
    joinRoom: wsJoinRoom,
    sendSignal: wsSendSignal,
    sendChatMessage: wsSendChatMessage,
    registerHandler: wsRegisterHandler
  } = useWebSocket(userId || undefined);

  const handleSendMessage = (text: string) => {
    if (!dataChannel || dataChannel.readyState !== 'open' || !userId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: text,
      type: 'text',
      sender: 'self',
      timestamp: new Date().toISOString(),
    };

    // Send via WebRTC data channel for peer-to-peer
    dataChannel.send(JSON.stringify(newMessage));
    
    // Add to local state for UI update
    setMessages([...messages, newMessage]);
    
    // If connected to WebSocket, also send to database
    if (wsConnected && userId) {
      wsSendChatMessage(roomId, newMessage, userId);
    }
  };

  const handleSendFile = (file: File) => {
    if (!dataChannel || dataChannel.readyState !== 'open' || !userId) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = e.target?.result as string;
      const fileMessage: Message = {
        id: Date.now().toString(),
        content: fileData,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        sender: 'self',
        timestamp: new Date().toISOString(),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      };

      // Send via WebRTC data channel for peer-to-peer
      dataChannel.send(JSON.stringify(fileMessage));
      
      // Add to local state for UI update
      setMessages([...messages, fileMessage]);
      
      // If connected to WebSocket, also send to database
      if (wsConnected && userId) {
        wsSendChatMessage(roomId, fileMessage, userId);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateRoom = async () => {
    if (!roomId || !userId) return;
    
    try {
      // Create room in database
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomId: roomId,
          createdBy: userId 
        })
      });
      
      if (!response.ok) {
        console.error('Failed to create room in database');
      } else {
        // Connect to the room via WebSocket
        wsJoinRoom(roomId);
        
        // Create WebRTC offer for P2P connection
        createOffer();
      }
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleJoinRoom = () => {
    if (!roomId || !userId) return;
    
    // Join room via WebSocket
    wsJoinRoom(roomId);
    
    // For WebRTC, we'll wait for the offer to be pasted and processed
  };
  
  // Process WebRTC signaling data (with WebSocket relay)
  const handleProcessSignalData = (signalData: string) => {
    // Process signal locally for WebRTC
    processSignal(signalData);
    
    // If connected to WebSocket, relay signal to peers
    if (wsConnected && userId && roomId) {
      wsSendSignal(roomId, signalData);
    }
  };

  const handleStartCall = (withVideo: boolean) => {
    startCall(withVideo);
    setCallActive(true);
    if (window.innerWidth < 768) {
      setActiveView('call');
    }
  };

  const handleEndCall = () => {
    endCall();
    setCallActive(false);
    if (window.innerWidth < 768) {
      setActiveView('chat');
    }
  };

  // Handle incoming messages from data channel (WebRTC)
  useEffect(() => {
    if (!dataChannel) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data) as Message;
        message.sender = 'peer';
        setMessages((prev) => [...prev, message]);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    dataChannel.addEventListener('message', handleMessage);
    return () => {
      dataChannel.removeEventListener('message', handleMessage);
    };
  }, [dataChannel, setMessages]);
  
  // Handle WebSocket messages for database integration
  useEffect(() => {
    if (!wsConnected || !userId) return;
    
    // Register handlers for different message types
    const unregisterChatHandler = wsRegisterHandler('chat_message', (data) => {
      if (data.senderId !== userId) {  // Don't duplicate our own messages
        const message = data.message as Message;
        message.sender = 'peer';
        setMessages((prev) => [...prev, message]);
      }
    });
    
    const unregisterSignalHandler = wsRegisterHandler('webrtc_signal', (data) => {
      if (data.from !== userId) {  // Don't process our own signals
        try {
          processSignal(data.signal);
        } catch (error) {
          console.error('Error processing signal:', error);
        }
      }
    });
    
    // Handle room notifications
    const unregisterPeerJoinedHandler = wsRegisterHandler('peer_joined', (data) => {
      console.log('Peer joined our room:', data.peerId);
      // When a peer joins, we (as the host) should create an offer
      createOffer();
    });
    
    const unregisterPeerFoundHandler = wsRegisterHandler('peer_found', (data) => {
      console.log('Found peer in room:', data.peerId);
      // We joined a room with an existing peer, we wait for their offer
    });
    
    const unregisterWaitingHandler = wsRegisterHandler('waiting_for_peer', (data) => {
      console.log(data.message);
      // We're the first one in the room, we wait for others
    });
    
    return () => {
      unregisterChatHandler();
      unregisterSignalHandler();
      unregisterPeerJoinedHandler();
      unregisterPeerFoundHandler();
      unregisterWaitingHandler();
    };
  }, [wsConnected, userId, wsRegisterHandler, setMessages, processSignal, createOffer]);

  // Switch to chat view when connected
  useEffect(() => {
    if (connectionStatus === ConnectionStatus.Connected && activeView === 'connection') {
      setActiveView('chat');
    }
  }, [connectionStatus, activeView]);
  
  // Load past messages from database when room is joined
  useEffect(() => {
    const loadMessagesFromDatabase = async () => {
      if (!roomId || !wsConnected) return;
      
      try {
        // Find the room ID number from the database using the roomId string
        const roomResponse = await fetch(`/api/rooms/${roomId}`);
        if (!roomResponse.ok) {
          console.error('Failed to fetch room info');
          return;
        }
        
        const roomData = await roomResponse.json();
        const roomDbId = roomData.id;
        
        // Load messages for this room
        const messagesResponse = await fetch(`/api/rooms/${roomDbId}/messages`);
        if (!messagesResponse.ok) {
          console.error('Failed to fetch messages');
          return;
        }
        
        const dbMessages = await messagesResponse.json();
        
        // Convert database messages to client Message format
        const formattedMessages = dbMessages.map((dbMsg: any) => ({
          id: dbMsg.id.toString(),
          content: dbMsg.content,
          type: dbMsg.messageType,
          sender: dbMsg.senderId === userId ? 'self' : 'peer',
          timestamp: dbMsg.createdAt,
          fileName: dbMsg.fileName || undefined,
          fileType: dbMsg.fileType || undefined,
          fileSize: dbMsg.fileSize || undefined
        }));
        
        // Set messages, replacing any existing
        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };
    
    loadMessagesFromDatabase();
  }, [roomId, wsConnected, userId, setMessages]);

  // Handle mobile view
  const MobileNoConnection = () => (
    <div className="md:hidden flex-1 flex flex-col items-center justify-center p-6 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <h2 className="text-xl font-bold mb-2">Connect to start chatting</h2>
      <p className="text-[hsl(var(--text-secondary))] mb-6">Enter a Room ID and create or join a room to start your private conversation.</p>
      <button 
        onClick={() => setActiveView('connection')}
        className="bg-primary hover:bg-primary/90 text-white font-medium py-3 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
      >
        Setup Connection
      </button>
    </div>
  );

  // Handle successful authentication
  const handleAuthSuccess = (id: number, name: string) => {
    setIsAuthenticated(true);
    setUserId(id);
    setUsername(name);
  };

  // If not authenticated, show auth form
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[hsl(var(--background))]">
        <AuthForm onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header 
        connectionStatus={connectionStatus} 
        roomId={roomId}
        username={username}
      />
      
      <main className="flex flex-1 overflow-hidden">
        {/* Connection Panel - Only visible on desktop or when selected on mobile */}
        <div className={`${activeView === 'connection' ? 'block' : 'hidden md:block'} w-full md:w-80 lg:w-96 bg-[hsl(var(--surface))] p-4 flex flex-col overflow-y-auto border-r border-[hsl(var(--surface-light))]`}>
          <ConnectionPanel
            roomId={roomId}
            setRoomId={setRoomId}
            signal={signal}
            connectionStatus={connectionStatus}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onProcessSignal={handleProcessSignalData}
            onStartAudioCall={() => handleStartCall(false)}
            onStartVideoCall={() => handleStartCall(true)}
            onEndCall={handleEndCall}
            callActive={callActive}
            userId={userId}
          />
        </div>

        {/* Chat Area - Visible on desktop or when selected on mobile */}
        <div className={`${activeView === 'chat' || activeView === 'call' ? 'block' : 'hidden md:block'} flex-1 flex-col bg-[hsl(var(--surface))] overflow-hidden ${connectionStatus !== ConnectionStatus.Connected && 'md:flex'}`}>
          {connectionStatus !== ConnectionStatus.Connected && window.innerWidth >= 768 ? (
            <MobileNoConnection />
          ) : (
            <>
              {/* Call View - Only visible when in a call */}
              {callActive && (
                <div className={`${activeView === 'call' ? 'block' : 'hidden md:block'} h-1/2 bg-background flex flex-col`}>
                  <CallView 
                    localStream={localStream}
                    remoteStream={remoteStream}
                    onEndCall={handleEndCall}
                    callType={callType}
                  />
                </div>
              )}

              {/* Chat Messages */}
              <div className={activeView === 'chat' || window.innerWidth >= 768 ? 'flex flex-col flex-1' : 'hidden'}>
                <ChatArea 
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onSendFile={handleSendFile}
                  connectionStatus={connectionStatus}
                  roomId={roomId}
                />
              </div>
            </>
          )}
        </div>

        {/* Mobile No Connection View */}
        {connectionStatus !== ConnectionStatus.Connected && window.innerWidth < 768 && activeView !== 'connection' && (
          <MobileNoConnection />
        )}
      </main>

      {/* Mobile Navigation */}
      <MobileNavigation 
        activeView={activeView}
        setActiveView={setActiveView}
        callActive={callActive}
      />
    </div>
  );
};

export default Home;
