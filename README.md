# SyncBoard

SyncBoard is a real-time collaborative whiteboard web application. It allows multiple users to connect to a shared workspace (a "room") using WebSockets, where every brush stroke is instantly synchronized across all connected screens.

Features include:
- **Real-Time Collaboration:** See strokes drawn by friends instantly without latency.
- **Session Playback:** When you join an existing session mid-way, you see the entire whiteboard state automatically.
- **Rooms System:** Connect securely to distinct rooms using an ID.
- **Drawing Tools:** Support for multiple colors, diverse brush sizes, erasing, and screen clearing.

## Tech Stack
- **Frontend:** React, Vite
- **Backend:** Node.js, Express, `ws` (WebSockets)

---

## 📁 Project Structure

```
NPACN-Project/
├── backend/          # Node.js WebSocket backend
│   ├── server.js     # Main WebSocket and Express server
│   └── package.json  # Backend dependencies
├── frontend/         # React + Vite frontend
│   ├── src/          # Source files (components, styles)
│   ├── index.html    # Entry HTML
│   └── package.json  # Frontend dependencies
└── render.yaml       # Blueprint for simple backend deployment on Render
```

---

## 🌍 Live Application

The application is deployed and currently running live on AWS. 

To use it:
1. Navigate to the live URL.
2. Click **"✨ Create New Board"** to start a session.
3. Share the 7-character Room ID with friends or colleagues so they can join your whiteboard!
