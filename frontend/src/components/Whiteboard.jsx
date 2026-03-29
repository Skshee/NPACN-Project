import React, { useRef, useEffect, useState } from 'react';
import { MousePointer2, Eraser, Trash2, X } from 'lucide-react';

const COLORS = ['#f8fafc', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const BRUSH_SIZES = [2, 5, 10, 20];

const Whiteboard = ({ roomId, onLeave }) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const wsRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [currentSize, setCurrentSize] = useState(BRUSH_SIZES[1]);
  const [isEraser, setIsEraser] = useState(false);

  // Position references for continuous drawing strokes
  const lastPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // 1. Setup Canvas
    const canvas = canvasRef.current;
    
    // Make canvas full screen or fit container
    const fitCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const context = canvas.getContext('2d');
      context.lineCap = 'round';
      context.lineJoin = 'round';
      contextRef.current = context;
    };
    
    fitCanvas();
    window.addEventListener('resize', fitCanvas);

    // 2. Setup WebSocket (Use env variable for production)
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      // Join Room
      ws.send(JSON.stringify({ type: 'join', roomId }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'draw') {
          drawOnCanvas(data.x0, data.y0, data.x1, data.y1, data.color, data.size, false);
        } else if (data.type === 'clear') {
          clearCanvas(false);
        } else if (data.type === 'init' && Array.isArray(data.history)) {
          // Play back the entire drawing history
          data.history.forEach((action) => {
            if (action.type === 'draw') {
              drawOnCanvas(action.x0, action.y0, action.x1, action.y1, action.color, action.size, false);
            } else if (action.type === 'clear') {
              clearCanvas(false);
            }
          });
        }
      } catch (err) {
        console.error('WebSocket receive error:', err);
      }
    };

    wsRef.current = ws;

    return () => {
      window.removeEventListener('resize', fitCanvas);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [roomId]);

  // Update context when tool changes
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = isEraser ? '#ffffff' : currentColor;
      contextRef.current.lineWidth = currentSize;
    }
  }, [currentColor, currentSize, isEraser]);

  // Utility to get coordinates whether mouse or touch
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    const { x, y } = getCoordinates(e);
    setIsDrawing(true);
    lastPosRef.current = { x, y };
    
    // Draw a single dot in case of a simple click
    drawOnCanvas(x, y, x, y, isEraser ? '#ffffff' : currentColor, currentSize, true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const { x, y } = getCoordinates(e);
    const { x: x0, y: y0 } = lastPosRef.current;
    
    const colorToUse = isEraser ? '#ffffff' : currentColor;
    drawOnCanvas(x0, y0, x, y, colorToUse, currentSize, true);
    
    lastPosRef.current = { x, y };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Shared draw function. `emit` decides whether to send via WS
  const drawOnCanvas = (x0, y0, x1, y1, color, size, emit) => {
    const ctx = contextRef.current;
    if (!ctx) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    if (emit && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'draw',
        x0, y0, x1, y1,
        color,
        size
      }));
    }
    
    // Restore current local tool style
    ctx.strokeStyle = isEraser ? '#ffffff' : currentColor;
    ctx.lineWidth = currentSize;
  };

  const clearCanvas = (emit = true) => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (emit && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'clear' }));
    }
  };

  return (
    <div className="board-container">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="whiteboard-canvas"
      />

      <div className="toolbar glass-panel" style={{ borderRadius: '100px' }}>
        <div className="tool-group color-picker">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`color-btn ${currentColor === c && !isEraser ? 'active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => {
                setCurrentColor(c);
                setIsEraser(false);
              }}
              title="Select Color"
            />
          ))}
        </div>

        <div className="tool-group" style={{ gap: '12px' }}>
          <button 
            className={`glass-button ${!isEraser ? 'primary' : ''}`}
            style={{ padding: '8px' }}
            onClick={() => setIsEraser(false)}
            title="Brush"
          >
            <MousePointer2 size={18} />
          </button>
          <button 
            className={`glass-button ${isEraser ? 'primary' : ''}`}
            style={{ padding: '8px' }}
            onClick={() => setIsEraser(true)}
            title="Eraser"
          >
            <Eraser size={18} />
          </button>
        </div>

        <div className="tool-group">
          <select 
            className="glass-input" 
            style={{ padding: '6px 12px', minWidth: '80px', height: '100%' }}
            value={currentSize}
            onChange={(e) => setCurrentSize(Number(e.target.value))}
            title="Brush Size"
          >
            {BRUSH_SIZES.map(s => (
              <option key={s} value={s} style={{ color: '#000' }}>{s}px</option>
            ))}
          </select>
        </div>

        <div className="tool-group">
          <button 
            className="glass-button"
            style={{ padding: '8px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
            onClick={() => clearCanvas(true)}
            title="Clear Board"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="tool-group" style={{ borderRight: 'none' }}>
          <button 
            className="glass-button"
            style={{ padding: '8px' }}
            onClick={onLeave}
            title="Leave Session"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;
