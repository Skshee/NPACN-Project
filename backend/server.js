const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Map to store roomId -> { clients: Set<WebSocket>, history: Array }
const rooms = new Map();

wss.on('connection', (ws) => {
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
          rooms.set(roomId, { clients: new Set(), history: [] });
        }
        const roomData = rooms.get(roomId);
        roomData.clients.add(ws);
        
        console.log(`Socket joined room: ${roomId}`);

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

        // Update room history
        if (message.type === 'clear') {
          roomData.history = [];
        } else if (message.type === 'draw') {
          roomData.history.push(message);
        }

        for (const client of roomData.clients) {
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
  console.log(`WebSocket collaborative whiteboard server running on port ${PORT}`);
});
