import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import Editor from '../components/Editor';
import Spinner from '../components/Spinner';
import { Users, Copy, Save, AlertCircle } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

export default function Room() {
  const { roomId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [roomDetails, setRoomDetails] = useState(null);
  const [content, setContent] = useState('');
  const [syncedContent, setSyncedContent] = useState('');
  const debouncedContent = useDebounce(content, 500);

  const [users, setUsers] = useState([]);
  const [whoIsTyping, setWhoIsTyping] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState('');
  
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!user) return navigate('/login');

    const fetchRoom = async () => {
      try {
        const res = await api.get(`/rooms/${roomId}`);
        setRoomDetails(res.data);
        setContent(res.data.content);
        setLoading(false);
      } catch (err) {
        console.error(err);
        navigate('/');
      }
    };
    fetchRoom();
  }, [roomId, user, navigate]);

  useEffect(() => {
    if (!user || !roomDetails) return;

    socketRef.current = io(import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000');
    
    const joinRoom = () => {
      socketRef.current.emit('join-room', { roomId, user: { userId: user._id, name: user.name } });
    };

    socketRef.current.on('connect', joinRoom);
    if (socketRef.current.connected) joinRoom();

    socketRef.current.on('user-joined', (activeUsers) => setUsers(activeUsers));
    socketRef.current.on('user-left', (activeUsers) => setUsers(activeUsers));
    
    socketRef.current.on('code-update', (newContent) => {
      setSyncedContent(newContent);
      setContent(newContent);
    });

    socketRef.current.on('typing-indicator', ({ userName }) => {
      setWhoIsTyping(userName);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setWhoIsTyping(''), 1500);
    });

    socketRef.current.on('disconnect', () => {
      setErrorStatus('Disconnected from real-time server...');
    });
    
    socketRef.current.on('reconnect', () => {
      setErrorStatus('');
      joinRoom();
    });

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socketRef.current.emit('leave-room', { roomId });
      socketRef.current.disconnect();
    };
  }, [roomId, user, roomDetails]);

  // Handle Socket Emission of Debounced State
  useEffect(() => {
    if (socketRef.current && debouncedContent !== syncedContent && roomDetails) {
      socketRef.current.emit('code-change', { roomId, content: debouncedContent });
    }
  }, [debouncedContent, roomId, roomDetails]);

  const handleCodeChange = (newContent) => {
    setContent(newContent);
    if (socketRef.current) socketRef.current.emit('typing', { roomId, userName: user.name });
  };

  const handleSaveVersion = async () => {
    try {
      await api.post(`/rooms/${roomId}/save`, { content });
      alert('Version saved to database explicitly.');
    } catch (err) {
      console.error(err);
      alert('Failed to save version.');
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    alert('Room ID copied!');
  };

  if (loading) return <Spinner />;

  return (
    <div className="flex h-screen bg-zinc-900 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-800 border-r border-zinc-700 flex flex-col flex-shrink-0 relative z-10">
        <div className="p-4 border-b border-zinc-700 shadow-sm">
          <h2 className="text-xl font-bold truncate text-blue-400">{roomDetails.name}</h2>
          <div className="flex items-center space-x-2 mt-2 text-zinc-400 bg-zinc-900 px-2 py-1 rounded">
            <span className="text-xs truncate">{roomId}</span>
            <button onClick={copyRoomId} className="hover:text-white" title="Copy Room ID"><Copy size={14}/></button>
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex items-center space-x-2 text-zinc-300 mb-4 font-semibold uppercase text-sm">
            <Users size={16} className="text-green-400" />
            <span>Active Users ({users.length})</span>
          </div>
          <ul className="space-y-2">
            {users.map(u => (
              <li key={u.socketId} className="flex items-center space-x-2 text-sm bg-zinc-700/50 p-2 rounded">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="truncate">{u.name} {u.userId === user._id ? '(You)' : ''}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Typing indicator */}
        <div className="h-8 px-4 flex items-center text-xs text-zinc-400 italic">
          {whoIsTyping && `${whoIsTyping} is typing...`}
        </div>

        {errorStatus && (
          <div className="bg-red-900/50 text-red-200 text-xs p-2 flex items-center space-x-2 border-t border-red-800">
            <AlertCircle size={14}/>
            <span>{errorStatus}</span>
          </div>
        )}

        <div className="p-4 border-t border-zinc-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <button onClick={handleSaveVersion} className="w-full flex justify-center items-center space-x-2 bg-blue-600 hover:bg-blue-500 py-2 rounded transition-colors text-sm font-semibold shadow">
            <Save size={16} />
            <span>Save Database Version</span>
          </button>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 overflow-hidden relative">
        <Editor content={content} onChange={handleCodeChange} language={roomDetails.language} />
      </div>
    </div>
  );
}