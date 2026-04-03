//Login Page
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, Mail, Lock, User as UserIcon } from 'lucide-react';

const Login = ({ onToggle }) => {
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
      const basicAuthToken = btoa(`${email}:${password}`);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Authorization': `Basic ${basicAuthToken}`
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');

      login(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/google/login`;
  };

  return (
    <div className="glass-panel landing-card" style={{ maxWidth: '400px' }}>
      <h1>Welcome Back</h1>
      <p>Log in to your SyncBoard account</p>
      
      <form onSubmit={handleSubmit} className="form-group">
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
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '8px' }}>{error}</div>}

        <button type="submit" className="glass-button primary" disabled={loading} style={{ justifyContent: 'center', width: '100%', marginBottom: '10px' }}>
          {loading ? 'Logging in...' : <><LogIn size={18} /> Sign In</>}
        </button>
        
        <div style={{ textAlign: 'center', margin: '10px 0', fontSize: '0.875rem', color: '#666' }}>— OR —</div>

        <button type="button" onClick={handleGoogleLogin} className="glass-button" style={{ justifyContent: 'center', width: '100%', backgroundColor: '#fff', color: '#333' }}>
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ marginRight: '8px' }}>
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
          </svg>
          Sign in with Google
        </button>
      </form>

      <div style={{ marginTop: '24px', fontSize: '0.875rem' }}>
        Don't have an account?{' '}
        <span 
          onClick={onToggle} 
          style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
        >
          Sign Up
        </span>
      </div>
    </div>
  );
};

export default Login;
