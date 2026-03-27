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

### 1. Deploy Backend (Render)
Host your `backend` directory persistently holding execution state on services like **Render**. 
- **Render Blueprint:** A `render.yaml` file is included in the root directory. You can easily deploy the backend by connecting this repository to Render using their "Blueprint" feature. It automatically provisions a web service for the `backend/` folder.

### 2. Deploy Frontend (Vercel, Netlify)
Host your `frontend` directory natively on **Vercel** or **Netlify**. 
- **Environment Variable:** Before deploying the frontend, ensure you configure the `VITE_WS_URL` environment variable within your host's dashboard to securely point to your live backend endpoint.
  - *Example:* `VITE_WS_URL=wss://your-render-app.onrender.com`
