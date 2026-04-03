const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Map to store roomId -> { clients: Set<WebSocket>, history: Array }
const rooms = new Map();

// In-memory user store (Basic Auth without DB/JWT)
const users = [];

// Basic Email/Password Endpoints
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ message: 'All fields are required' });
  
  const existingUser = users.find(u => u.email === email);
  if (existingUser) return res.status(400).json({ message: 'User already exists' });

  const newUser = { username, email, password };
  users.push(newUser);
  res.status(201).json({ username: newUser.username, message: 'Signup successful' });
});

app.post('/api/auth/login', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ message: 'Missing or Invalid Authorization Header' });
  }

  // Decode base64 credentials
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [email, password] = credentials.split(':');

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  res.json({ username: user.username, message: 'Login successful' });
});

// OAuth2 Setup (Google Example)
// Note: You will need to get a GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from the Google Developer Console
app.get('/api/auth/google/login', (req, res) => {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
  const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback';
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=profile email`;
  
  // Redirect user to Google's consent screen
  res.redirect(googleAuthUrl);
});

app.get('/api/auth/google/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Authorization code not provided');

  try {
    // In a real application, you would:
    // 1. Exchange 'code' for an access token via POST to https://oauth2.googleapis.com/token
    // 2. Fetch user profile using the access token from https://www.googleapis.com/oauth2/v2/userinfo
    // 3. Find or create the user in your 'users' array
    // 4. Redirect to frontend with successful login state (e.g. setting a cookie or passing a simple token)

    console.log("OAuth2 Code received:", code);
    
    // Simulating successful OAuth login for demonstration
    const mockOAuthUser = { username: "GoogleUser" };
    
    // Redirect back to frontend
    res.redirect(`http://localhost:5173?oauth_username=${mockOAuthUser.username}`);
  } catch (error) {
    res.status(500).send('OAuth2 authentication failed');
  }
});

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

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`SyncBoard Basic Server running on port ${PORT}`);
});
