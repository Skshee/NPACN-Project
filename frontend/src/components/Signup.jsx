import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';

const Signup = ({ onToggle }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Signup failed');

      login(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel landing-card" style={{ maxWidth: '400px' }}>
      <h1>Create Account</h1>
      <p>Start your collaborative journey</p>
      
      <form onSubmit={handleSubmit} className="form-group">
        <div className="input-with-icon">
          <UserIcon size={18} className="input-icon" />
          <input 
            type="text" 
            className="glass-input" 
            placeholder="Full Name" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="input-with-icon">
          <Mail size={18} className="input-icon" />
          <input 
            type="email" 
            className="glass-input" 
            placeholder="Email Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-with-icon">
          <Lock size={18} className="input-icon" />
          <input 
            type="password" 
            className="glass-input" 
            placeholder="Create Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '8px' }}>{error}</div>}

        <button type="submit" className="glass-button primary" disabled={loading} style={{ justifyContent: 'center', width: '100%' }}>
          {loading ? 'Creating account...' : <><UserPlus size={18} /> Join SyncBoard</>}
        </button>
      </form>

      <div style={{ marginTop: '24px', fontSize: '0.875rem' }}>
        Already have an account?{' '}
        <span 
          onClick={onToggle} 
          style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
        >
          Sign In
        </span>
      </div>
    </div>
  );
};

export default Signup;
