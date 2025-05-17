import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertRoomSchema, insertMessageSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";

interface ExtWebSocket extends WebSocket {
  isAlive: boolean;
  userId?: number;
  roomId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // Setup WebSocket server on a separate path
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // WebSocket connection handling
  wss.on('connection', (ws: ExtWebSocket) => {
    ws.isAlive = true;

    // Handle pings to keep connection alive
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle incoming messages
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Handle different message types
        switch (data.type) {
          case 'join_room':
            handleJoinRoom(ws, data);
            break;
          case 'webrtc_signal':
            handleWebRTCSignal(ws, data);
            break;
          case 'chat_message':
            await handleChatMessage(ws, data);
            break;
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    // Handle disconnect
    ws.on('close', () => {
      // Clean up when a client disconnects
      console.log('Client disconnected');
    });
  });

  // Keep-alive interval to detect broken connections
  setInterval(() => {
    wss.clients.forEach((client) => {
      const ws = client as ExtWebSocket;
      if (ws.isAlive === false) return ws.terminate();

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  // Authentication routes
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: 'Invalid user data' });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(result.data.username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(result.data.password, 10);
      
      // Create new user
      const newUser = await storage.createUser({
        username: result.data.username,
        password: hashedPassword
      });
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = newUser;
      
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Error registering user:', error);
      return res.status(500).json({ error: 'Failed to register user' });
    }
  });
  
  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      
      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // Don't send password in response
      const { password: _, ...userWithoutPassword } = user;
      
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error logging in:', error);
      return res.status(500).json({ error: 'Failed to login' });
    }
  });

  // API routes
  app.post('/api/rooms', async (req: Request, res: Response) => {
    try {
      const result = insertRoomSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: 'Invalid room data' });
      }

      const room = await storage.createRoom(result.data);
      return res.status(201).json(room);
    } catch (error) {
      console.error('Error creating room:', error);
      return res.status(500).json({ error: 'Failed to create room' });
    }
  });

  app.get('/api/rooms/:roomId', async (req: Request, res: Response) => {
    try {
      const roomId = req.params.roomId;
      const room = await storage.getRoomById(roomId);
      
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
      
      return res.json(room);
    } catch (error) {
      console.error('Error getting room:', error);
      return res.status(500).json({ error: 'Failed to get room' });
    }
  });

  app.post('/api/messages', async (req: Request, res: Response) => {
    try {
      const result = insertMessageSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: 'Invalid message data' });
      }

      const message = await storage.saveMessage(result.data);
      return res.status(201).json(message);
    } catch (error) {
      console.error('Error saving message:', error);
      return res.status(500).json({ error: 'Failed to save message' });
    }
  });

  app.get('/api/rooms/:roomId/messages', async (req: Request, res: Response) => {
    try {
      const roomIdSchema = z.object({
        roomId: z.coerce.number(),
      });
      
      const result = roomIdSchema.safeParse({ roomId: req.params.roomId });
      
      if (!result.success) {
        return res.status(400).json({ error: 'Invalid room ID' });
      }
      
      const { roomId } = result.data;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      
      const messages = await storage.getMessagesByRoomId(roomId, limit);
      return res.json(messages);
    } catch (error) {
      console.error('Error getting messages:', error);
      return res.status(500).json({ error: 'Failed to get messages' });
    }
  });

  return httpServer;
}

// WebSocket message handlers
function handleJoinRoom(ws: ExtWebSocket, data: any) {
  if (!data.roomId) return;
  
  console.log(`User ${data.userId} joining room ${data.roomId}`);
  ws.roomId = data.roomId;
  ws.userId = data.userId;
  
  // Notify client they've joined the room
  ws.send(JSON.stringify({
    type: 'room_joined',
    roomId: data.roomId,
  }));
  
  // Check if there are other clients in this room and notify them
  const clients = getWsServer(ws).clients as Set<ExtWebSocket>;
  let peerFound = false;
  
  clients.forEach((client) => {
    if (client !== ws && 
        client.roomId === data.roomId && 
        client.readyState === WebSocket.OPEN) {
      
      // Notify the existing client that a new peer has joined
      client.send(JSON.stringify({
        type: 'peer_joined',
        roomId: data.roomId,
        peerId: data.userId
      }));
      
      // Notify the new client about existing peer
      ws.send(JSON.stringify({
        type: 'peer_found',
        roomId: data.roomId,
        peerId: client.userId
      }));
      
      peerFound = true;
    }
  });
  
  // If no peers found, inform the client
  if (!peerFound) {
    ws.send(JSON.stringify({
      type: 'waiting_for_peer',
      roomId: data.roomId,
      message: 'You are the first to join this room. Waiting for others to connect.'
    }));
  }
}

function handleWebRTCSignal(ws: ExtWebSocket, data: any) {
  if (!data.signal || !data.roomId) {
    console.log('Missing signal or roomId in WebRTC signal', data);
    return;
  }
  
  try {
    // Forward WebRTC signaling data to other peers in the same room
    const clients = getWsServer(ws).clients as Set<ExtWebSocket>;
    
    let signalForwarded = false;
    
    clients.forEach((client) => {
      if (client !== ws && 
          client.roomId === data.roomId && 
          client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'webrtc_signal',
          signal: data.signal,
          from: ws.userId,
        }));
        signalForwarded = true;
      }
    });
    
    // If signal wasn't forwarded to any peers, send back a status to the sender
    if (!signalForwarded) {
      ws.send(JSON.stringify({
        type: 'room_status',
        roomId: data.roomId,
        status: 'waiting_for_peer',
        message: 'Waiting for another user to join this room'
      }));
    }
  } catch (error) {
    console.error('Error processing signal:', error);
  }
}

async function handleChatMessage(ws: ExtWebSocket, data: any) {
  if (!data.message || !data.roomId || !data.senderId) return;
  
  try {
    // Save message to database
    const messageData = {
      roomId: data.roomId,
      senderId: data.senderId,
      content: data.message.content,
      messageType: data.message.type || 'text',
      fileName: data.message.fileName,
      fileType: data.message.fileType,
      fileSize: data.message.fileSize,
    };
    
    await storage.saveMessage(messageData);
    
    // Broadcast message to all clients in the room
    const clients = getWsServer(ws).clients as Set<ExtWebSocket>;
    
    clients.forEach((client) => {
      if (client.roomId === data.roomId && 
          client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'chat_message',
          message: data.message,
          senderId: data.senderId,
        }));
      }
    });
  } catch (error) {
    console.error('Error handling chat message:', error);
  }
}

function getWsServer(ws: WebSocket): WebSocketServer {
  return (ws as any)._server;
}
