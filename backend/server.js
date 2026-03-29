require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/syncboard')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const app = express();
app.use(cors());
app.use(express.json());

// --- Authentication Routes ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = new User({ username, email, password });
    await user.save();
    
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Map to store roomId -> { clients: Map<WebSocket, UserInfo>, history: Array }
const rooms = new Map();

wss.on('connection', (ws, req) => {
  // Authentication check
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  
  if (!token) {
    console.log('Unauthenticated connection attempt, closing...');
    ws.close(4001, 'Unauthorized: Token required');
    return;
  }

  let user = null;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.log('Invalid token, closing...');
    ws.close(4001, 'Unauthorized: Invalid token');
    return;
  }

  let currentRoom = null;

  ws.on('message', (data) => {
    try {
      const messageAsString = data.toString();
      const message = JSON.parse(messageAsString);

      // Handle joining a room
      if (message.type === 'join') {
        const roomId = message.roomId;
        if (!roomId) return;
        
        // Remove from old room if changing
        if (currentRoom && rooms.has(currentRoom)) {
          rooms.get(currentRoom).clients.delete(ws);
        }

        currentRoom = roomId;
        
        // Initialize room if it doesn't exist
        if (!rooms.has(roomId)) {
          rooms.set(roomId, { clients: new Map(), history: [] });
        }
        const roomData = rooms.get(roomId);
        roomData.clients.set(ws, user);
        
        console.log(`User ${user.username} joined room: ${roomId}`);

        // Send existing history to the newly joined client
        if (roomData.history.length > 0) {
          ws.send(JSON.stringify({ type: 'init', history: roomData.history }));
        }
        return;
      }

      // Handle broadcasting drawing events within the room
      if (message.type === 'draw' || message.type === 'clear') {
        if (!currentRoom || !rooms.has(currentRoom)) return;
        
        const roomData = rooms.get(currentRoom);

        // Security check: Only broadcasters from the room map can draw
        if (!roomData.clients.has(ws)) return;

        // Update room history
        if (message.type === 'clear') {
          roomData.history = [];
        } else if (message.type === 'draw') {
          roomData.history.push(message);
        }

        for (const [client] of roomData.clients) {
          // Send to everyone EXCEPT the sender
          if (client !== ws && client.readyState === 1 /* WebSocket.OPEN */) {
            client.send(messageAsString); // Send the raw string directly
          }
        }
      }

    } catch (err) {
      console.error('Failed to parse WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoom && rooms.has(currentRoom)) {
      const roomData = rooms.get(currentRoom);
      roomData.clients.delete(ws);
      
      // Cleanup empty rooms
      if (roomData.clients.size === 0) {
        rooms.delete(currentRoom);
        console.log(`Room ${currentRoom} deleted (empty)`);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Secure SyncBoard server running on port ${PORT}`);
});

