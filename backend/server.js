const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json());

// --- Simple In-Memory Authentication Store ---
// NOTE: These values will be reset if you restart the server!
const users = [];

app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  if (users.find(u => u.email === email || u.username === username)) {
    return res.status(400).json({ message: 'User already exists' });
  }
  const newUser = { username, email, password };
  users.push(newUser);
  console.log(`New user registered: ${username}`);
  res.status(201).json({ username: newUser.username });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  res.json({ username: user.username });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Map to store roomId -> { clients: Map<WebSocket, UserInfo>, history: Array }
const rooms = new Map();

wss.on('connection', (ws, req) => {
  // Simple Authentication via query parameter
  const url = new URL(req.url, `http://${req.headers.host}`);
  const username = url.searchParams.get('username');
  
  if (!username) {
    console.log('Unidentified connection attempt, closing...');
    ws.close(4001, 'Username required');
    return;
  }

  const user = { username };
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

        // Security check: Only clients in the room map can broadcast
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
  console.log(`Simple SyncBoard server running on port ${PORT}`);
});


