import { useState, useEffect, useRef, useCallback } from 'react';
import { ConnectionStatus, CallType } from '@/types';
import useMediaStream from '@/hooks/useMediaStream';

// ICE Server configuration
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const useWebRTC = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.Disconnected);
  const [signal, setSignal] = useState<string>('');
  const [isCaller, setIsCaller] = useState<boolean>(false);
  const [callType, setCallType] = useState<CallType>('none');

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  const { 
    localStream, 
    remoteStream, 
    startLocalStream, 
    stopLocalStream,
    attachRemoteStream 
  } = useMediaStream();

  // Create and initialize a new RTCPeerConnection
  const initPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(iceServers);

    // Setup event handlers
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // When we have all ICE candidates, update the signal
        if (pc.iceGatheringState === 'complete') {
          setSignal(JSON.stringify(pc.localDescription));
        }
      } else {
        // No more candidates, set description as complete
        setSignal(JSON.stringify(pc.localDescription));
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setConnectionStatus(ConnectionStatus.Connected);
      } else if (pc.connectionState === 'connecting') {
        setConnectionStatus(ConnectionStatus.Connecting);
      } else if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        setConnectionStatus(ConnectionStatus.Disconnected);
        setCallType('none');
      }
    };

    pc.ontrack = (event) => {
      attachRemoteStream(event.streams[0]);
    };

    pc.ondatachannel = (event) => {
      setupDataChannel(event.channel);
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [attachRemoteStream]);

  // Setup data channel event handlers
  const setupDataChannel = (channel: RTCDataChannel) => {
    channel.onopen = () => {
      console.log('Data channel opened');
    };

    channel.onclose = () => {
      console.log('Data channel closed');
    };

    dataChannelRef.current = channel;
  };

  // Create an offer (caller side)
  const createOffer = useCallback(async () => {
    setIsCaller(true);
    setConnectionStatus(ConnectionStatus.Connecting);
    
    const pc = initPeerConnection();
    
    // Create a data channel for chat
    const dataChannel = pc.createDataChannel('chat');
    setupDataChannel(dataChannel);
    
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Signal will be updated by onicecandidate event
    } catch (error) {
      console.error('Error creating offer:', error);
      setConnectionStatus(ConnectionStatus.Disconnected);
    }
  }, [initPeerConnection]);

  // Create an answer (answerer side)
  const createAnswer = useCallback(async (offerSdp: RTCSessionDescriptionInit) => {
    setIsCaller(false);
    setConnectionStatus(ConnectionStatus.Connecting);
    
    const pc = initPeerConnection();
    
    try {
      await pc.setRemoteDescription(offerSdp);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      // Signal will be updated by onicecandidate event
    } catch (error) {
      console.error('Error creating answer:', error);
      setConnectionStatus(ConnectionStatus.Disconnected);
    }
  }, [initPeerConnection]);

  // Process incoming signal (offer or answer)
  const processSignal = useCallback((signalData: string) => {
    try {
      const parsedSignal = JSON.parse(signalData);
      
      if (parsedSignal.type === 'offer') {
        createAnswer(parsedSignal);
      } else if (parsedSignal.type === 'answer') {
        if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== 'stable') {
          peerConnectionRef.current.setRemoteDescription(parsedSignal);
        }
      }
    } catch (error) {
      console.error('Error processing signal:', error);
    }
  }, [createAnswer]);

  // Start an audio or video call
  const startCall = useCallback(async (withVideo: boolean) => {
    const callTypeVal = withVideo ? 'video' : 'audio';
    setCallType(callTypeVal);
    
    try {
      const stream = await startLocalStream(withVideo);
      
      if (peerConnectionRef.current && stream) {
        // Add tracks to peer connection
        stream.getTracks().forEach(track => {
          peerConnectionRef.current?.addTrack(track, stream);
        });
      }
    } catch (error) {
      console.error('Error starting call:', error);
      setCallType('none');
    }
  }, [startLocalStream]);

  // End a call
  const endCall = useCallback(() => {
    setCallType('none');
    stopLocalStream();
    
    if (peerConnectionRef.current) {
      const senders = peerConnectionRef.current.getSenders();
      senders.forEach(sender => {
        if (sender.track) {
          peerConnectionRef.current?.removeTrack(sender);
        }
      });
    }
  }, [stopLocalStream]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (dataChannelRef.current) {
        dataChannelRef.current.close();
      }
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      
      stopLocalStream();
    };
  }, [stopLocalStream]);

  return {
    connectionStatus,
    peerConnection: peerConnectionRef.current,
    dataChannel: dataChannelRef.current,
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
  };
};

export default useWebRTC;
