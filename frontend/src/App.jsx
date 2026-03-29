import React, { useState } from 'react';
import Whiteboard from './components/Whiteboard';
import Login from './components/Login';
import Signup from './components/Signup';
import { useAuth } from './context/AuthContext';
import { LogOut, User as UserIcon, Plus, DoorOpen } from 'lucide-react';

function App() {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const [inputRoom, setInputRoom] = useState('');
  const [authView, setAuthView] = useState('login'); // 'login' or 'signup'

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

  if (loading) {
    return <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="app-container">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="landing-container">
          {authView === 'login' ? (
            <Login onToggle={() => setAuthView('signup')} />
          ) : (
            <Signup onToggle={() => setAuthView('login')} />
          )}
        </div>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="app-container">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>

        <div className="topbar glass-panel" style={{ borderRadius: '100px', right: '24px', left: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <UserIcon size={16} />
            <span style={{ fontWeight: 600 }}>{user?.username}</span>
            <div style={{ width: '1px', height: '16px', background: 'var(--surface-border)' }}></div>
            <button onClick={logout} className="glass-button" style={{ background: 'transparent', border: 'none', padding: '4px' }}>
              <LogOut size={18} color="#ef4444" />
            </button>
          </div>
        </div>

        <div className="landing-container">
          <div className="glass-panel landing-card">
            <h1>SyncBoard</h1>
            <p>Welcome back, <strong>{user?.username}</strong>!<br/>Create or join a workspace.</p>
            
            <form onSubmit={handleJoin} className="form-group">
              <input 
                type="text" 
                className="glass-input" 
                placeholder="Enter Room ID" 
                value={inputRoom}
                onChange={(e) => setInputRoom(e.target.value)}
              />
              <button type="submit" className="glass-button primary" style={{justifyContent: 'center', width: '100%'}}>
                <DoorOpen size={18} /> Join Space
              </button>
            </form>

            <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--surface-border)' }}></div>
              <span>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--surface-border)' }}></div>
            </div>

            <button onClick={generateAndJoin} className="glass-button" style={{justifyContent: 'center', width: '100%'}}>
              ✨ <Plus size={18} /> New Board
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

      <div className="topbar glass-panel" style={{ borderRadius: '100px', padding: '8px 24px', display: 'flex', justifyContent: 'space-between', width: 'calc(100% - 48px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="status-dot"></div>
          <span className="status-text">Room: {roomId}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>{user?.username}</span>
          <button onClick={logout} className="glass-button" style={{ padding: '4px', background: 'transparent' }}>
            <LogOut size={16} color="#ef4444" />
          </button>
        </div>
      </div>

      <Whiteboard roomId={roomId} onLeave={() => setJoined(false)} />
    </div>
  );
}

export default App;

