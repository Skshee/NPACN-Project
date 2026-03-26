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

## 🚀 Getting Started Locally

To run this application on your local machine, you'll need two separate terminal windows—one for the backend and one for the frontend.

### 1. Backend Service
Start the WebSocket server to handle the incoming drawing streams.

```bash
cd backend
npm install
node server.js
```
*The server should now be running on `ws://localhost:3001`.*

### 2. Frontend Interface
In your second terminal window, start the React graphical interface.

```bash
cd frontend
npm install
npm run dev
```
*This will spin up a local development server on `http://localhost:5173/`.*

### 3. Usage
1. Open `http://localhost:5173/` in your browser.
2. Click **"✨ Create New Board"** to start a session.
3. To test collaboration yourself, open an incognito window, navigate to `http://localhost:5173/`, and input the 7-character Room ID displayed in your first tab's top bar!

---

## 🌍 Deployment

Due to the persistent WebSockets architectural requirement, standard serverless platforms (like Vercel functions) won't suffice for the backend. We recommend a *decoupled architecture*:

1. **Deploy Backend:** Host your `backend` directory persistently holding execution state on services like **Render**, **Railway**, or **Fly.io**. 
2. **Deploy Frontend:** Host your `frontend` directory natively on **Vercel** or **Netlify**. 
   - Before deploying the frontend, verify you configure the `VITE_WS_URL` environment variable within your host's dashboard securely pointing to your live backend endpoint (e.g., `wss://your-render-app.onrender.com`).
