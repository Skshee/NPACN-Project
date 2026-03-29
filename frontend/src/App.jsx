import React, { useState } from 'react';
import Whiteboard from './components/Whiteboard';

function App() {
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const [inputRoom, setInputRoom] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    if (inputRoom.trim()) {
      setRoomId(inputRoom.trim());
      setJoined(true);
    }
  };

  const generateAndJoin = () => {
    const newId = Math.random().toString(36).substring(2, 9);
    setRoomId(newId);
    setJoined(true);
  };

  if (!joined) {
    return (
      <div className="app-container">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>

        <div className="landing-container">
          <div className="glass-panel landing-card">
            <h1>SyncBoard</h1>
            <p>Real-time collaborative drawing.<br/>Create or join a session instantly.</p>
            
            <form onSubmit={handleJoin} className="form-group">
              <input 
                type="text" 
                className="glass-input" 
                placeholder="Enter Room ID" 
                value={inputRoom}
                onChange={(e) => setInputRoom(e.target.value)}
              />
              <button type="submit" className="glass-button primary" style={{justifyContent: 'center', width: '100%'}}>
                Join Existing Space
              </button>
            </form>

            <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--surface-border)' }}></div>
              <span>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--surface-border)' }}></div>
            </div>

            <button onClick={generateAndJoin} className="glass-button" style={{justifyContent: 'center', width: '100%'}}>
              ✨ Create New Board
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="bg-shape shape-1" style={{ width: '500px', height: '500px', opacity: 0.3, left: '-200px' }}></div>
      <div className="bg-shape shape-2" style={{ width: '400px', height: '400px', opacity: 0.2, right: '-100px' }}></div>

      <div className="topbar glass-panel" style={{ borderRadius: '100px', padding: '8px 24px' }}>
        <div className="status-dot"></div>
        <span className="status-text">Connected to {roomId}</span>
      </div>

      <Whiteboard roomId={roomId} onLeave={() => setJoined(false)} />
    </div>
  );
}

export default App;
