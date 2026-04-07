import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import Editor from '../components/Editor';
import Spinner from '../components/Spinner';
import { Users, Copy, Save, AlertCircle, MessageSquare, Send } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

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
  
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);
  
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!user) return navigate('/login');

    const fetchRoom = async () => {
      console.log("Room.jsx: Initializing fetch for Room ID:", roomId);
      try {
        const res = await API.get(`/api/rooms/${roomId}`);
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
    
    socketRef.current.on('receive-message', (data) => {
      setMessages((prev) => [...prev, data]);
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCodeChange = (newContent) => {
    setContent(newContent);
    if (socketRef.current) socketRef.current.emit('typing', { roomId, userName: user.name });
  };

  const handleSaveVersion = async () => {
    try {
      await API.post(`/api/rooms/${roomId}/save`, { content });
      toast.success('Architecture matrix saved successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to commit version map.');
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast.success('Session Token copied to clipboard!');
  };
  
  const sendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socketRef.current.emit('send-message', { roomId, message: chatInput, userName: user.name });
    setChatInput('');
  };

  if (loading) return <Spinner />;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex h-screen bg-transparent text-white overflow-hidden p-2 lg:p-4 gap-4">
      {/* Sidebar */}
      <div className="w-80 bg-white/5 backdrop-blur-xl border border-white/10 flex flex-col flex-shrink-0 relative z-10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 shadow-sm bg-black/20">
          <h2 className="text-xl font-bold truncate bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">{roomDetails.name}</h2>
          <div className="flex items-center space-x-2 mt-2 text-zinc-400 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 cursor-pointer hover:bg-black/60 transition-colors" onClick={copyRoomId} title="Click to Copy">
            <span className="text-xs truncate font-mono">{roomId}</span>
            <Copy size={14} className="text-zinc-500" />
          </div>
        </div>
        
        <div className="h-48 p-4 overflow-y-auto border-b border-white/10 custom-scrollbar">
          <div className="flex items-center space-x-2 text-zinc-300 mb-4 font-semibold uppercase text-xs tracking-wider">
            <Users size={14} className="text-green-400" />
            <span>Active Engineers ({users.length})</span>
          </div>
          <ul className="space-y-2">
            {users.map(u => (
              <li key={u.socketId} className="flex items-center justify-between text-sm bg-white/5 hover:bg-white/10 transition-colors px-3 py-2 rounded-lg border border-white/5">
                <span className="truncate flex items-center space-x-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                   <span>{u.name}</span>
                </span>
                {u.userId === user._id && <span className="text-xs text-zinc-500 bg-black/40 px-2 py-0.5 rounded-full">You</span>}
              </li>
            ))}
          </ul>
        </div>

        {/* Real-Time Chat Container */}
        <div className="flex-1 flex flex-col min-h-0 bg-black/10">
          <div className="flex items-center space-x-2 px-4 py-3 bg-black/20 border-b border-white/5">
            <MessageSquare size={14} className="text-blue-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Team Chat</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.length === 0 ? (
               <div className="h-full flex items-center justify-center text-xs text-zinc-600 italic text-center px-4">Direct message matrix initialized.</div>
            ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.userName === user.name;
                  return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-zinc-500 mb-1 px-1">{msg.userName}</span>
                      <div className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm shadow-sm ${isMe ? 'bg-blue-600 rounded-tr-sm text-white' : 'bg-zinc-800 rounded-tl-sm text-zinc-200 border border-white/5'}`}>
                        {msg.message}
                      </div>
                    </motion.div>
                  )
                })
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={sendChatMessage} className="p-3 bg-black/30 border-t border-white/5 flex gap-2">
            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-black/40 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 text-white transition-colors" />
            <button type="submit" disabled={!chatInput.trim()} className="bg-blue-600 disabled:opacity-50 hover:bg-blue-500 text-white p-2 flex items-center justify-center rounded-full transition-colors shadow">
               <Send size={16} />
            </button>
          </form>
        </div>
        
        {/* Typing indicator & Status */}
        {whoIsTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute bottom-[4.5rem] left-0 w-full px-4 py-1 flex items-center text-xs text-zinc-400 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
             <span className="typing-dots overflow-hidden relative inline-block">
                <span className="text-blue-400 font-semibold">{whoIsTyping}</span> is synchronizing...
             </span>
          </motion.div>
        )}

        {errorStatus && (
          <div className="bg-red-900/50 text-red-200 text-xs p-2 flex items-center space-x-2 border-t border-red-800">
            <AlertCircle size={14}/>
            <span>{errorStatus}</span>
          </div>
        )}

        <div className="p-4 border-t border-white/10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] bg-black/20">
          <button onClick={handleSaveVersion} className="w-full flex justify-center items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 py-2.5 rounded-lg transition-all text-sm font-semibold shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            <Save size={16} />
            <span>Commit Timeline</span>
          </button>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 overflow-hidden relative rounded-2xl shadow-2xl border border-white/10 bg-[#1e1e1e]">
        <Editor content={content} onChange={handleCodeChange} language={roomDetails.language} />
      </div>
    </motion.div>
  );
}