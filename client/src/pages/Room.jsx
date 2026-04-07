import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import Editor from '../components/Editor';
import Spinner from '../components/Spinner';
import { Users, Copy, Save, AlertCircle, MessageSquare, Send, X, LogOut, Code2, ChevronDown, ChevronUp } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Room() {
  const { roomId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [roomDetails, setRoomDetails] = useState(null);
  const [content, setContent] = useState('');
  const [syncedContent, setSyncedContent] = useState('');
  const [currentLang, setCurrentLang] = useState('javascript');
  const debouncedContent = useDebounce(content, 500);

  const [users, setUsers] = useState([]);
  const [whoIsTyping, setWhoIsTyping] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState('');
  
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatOpen, setChatOpen] = useState(true);
  const chatEndRef = useRef(null);
  
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!user) return navigate('/login');

    const fetchRoom = async () => {
      try {
        const res = await API.get(`/api/rooms/${roomId}`);
        setRoomDetails(res.data);
        setContent(res.data.content);
        setCurrentLang(res.data.language || 'javascript');
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
    
    socketRef.current.on('language-updated', ({ language, userName }) => {
      setCurrentLang(language);
      toast('`${userName}` changed language to `${language}`', { icon: '⚙️', style: { borderRadius: '10px', background: '#333', color: '#fff' }});
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

  useEffect(() => {
    if (socketRef.current && debouncedContent !== syncedContent && roomDetails) {
      socketRef.current.emit('code-change', { roomId, content: debouncedContent });
    }
  }, [debouncedContent, roomId, roomDetails]);

  useEffect(() => {
    if(chatOpen) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatOpen]);

  const handleCodeChange = (newContent) => {
    setContent(newContent);
    if (socketRef.current) socketRef.current.emit('typing', { roomId, userName: user.name });
  };

  const changeLanguage = (e) => {
    const lang = e.target.value;
    setCurrentLang(lang);
    socketRef.current.emit('language-change', { roomId, language: lang, userName: user.name });
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
    toast.success('Session ID copied to clipboard!');
  };
  
  const handleExitRoom = () => {
    if(window.confirm("Are you sure you want to disconnect from this collaboration session?")) {
       navigate('/');
    }
  };
  
  const sendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socketRef.current.emit('send-message', { roomId, message: chatInput, userName: user.name });
    setChatInput('');
  };

  if (loading) return <Spinner />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex h-screen bg-transparent text-white overflow-hidden p-2 lg:p-4 gap-4 relative z-10">
      <div className="absolute inset-0 z-[-1] bg-gradient-to-br from-[#0c0c16] via-[#120f26] to-[#0a0a0a] animate-gradient-xy"></div>
      
      {/* Dynamic Sidebar */}
      <div className="w-full lg:w-80 hidden md:flex bg-white/5 backdrop-blur-2xl border border-white/10 flex-col flex-shrink-0 relative z-10 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Room Header Info */}
        <div className="p-4 border-b border-white/10 bg-black/20 flex flex-col gap-2">
          <div className="flex justify-between items-center">
             <h2 className="text-xl font-bold truncate bg-gradient-to-r from-blue-400 to-pink-400 bg-clip-text text-transparent flex-1 mr-2">{roomDetails.name}</h2>
          </div>
          <div className="flex items-center space-x-2 text-zinc-400 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 cursor-pointer hover:bg-black/60 transition-colors shadow-inner" onClick={copyRoomId} title="Click to Copy">
            <span className="text-xs truncate font-mono tracking-widest">{roomId}</span>
            <Copy size={13} className="text-zinc-500 shrink-0" />
          </div>
        </div>
        
        {/* Active Users */}
        <div className={`p-4 overflow-y-auto border-b border-white/10 custom-scrollbar transition-all duration-300 ${chatOpen ? 'h-40' : 'flex-1'}`}>
          <div className="flex items-center justify-between text-zinc-300 mb-4 font-semibold uppercase text-xs tracking-widest">
            <div className="flex items-center space-x-2">
               <Users size={14} className="text-green-400" />
               <span>Engineers ({users.length})</span>
            </div>
          </div>
          <ul className="space-y-2">
            {users.length === 0 && <div className="text-xs text-zinc-500 italic mt-2 px-1">Waiting for peers to connect...</div>}
            {users.map(u => (
              <li key={u.socketId} className="flex items-center justify-between text-sm bg-white/5 hover:bg-white/10 transition-colors px-3 py-2 rounded-xl border border-white/5 shadow-sm">
                <span className="truncate flex items-center space-x-3">
                   <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-glow relative">
                     {u.name.charAt(0).toUpperCase()}
                     <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border border-black shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                   </div>
                   <span className="font-medium text-zinc-200">{u.name}</span>
                </span>
                {u.userId === user._id && <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 bg-black/50 px-2 py-0.5 rounded-full">You</span>}
              </li>
            ))}
          </ul>
        </div>

        {/* Real-Time Chat Toggle Header */}
        <div onClick={() => setChatOpen(!chatOpen)} className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/5 cursor-pointer hover:bg-black/60 transition-colors z-20">
           <div className="flex items-center space-x-2">
             <MessageSquare size={16} className="text-pink-400" />
             <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">Terminal Chat</span>
           </div>
           {chatOpen ? <ChevronDown size={16} className="text-zinc-500" /> : <ChevronUp size={16} className="text-zinc-500" />}
        </div>

        {/* Real-Time Chat UI */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="flex-1 flex flex-col min-h-0 bg-black/10">
              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar display-flex flex-col">
                {messages.length === 0 ? (
                   <div className="h-full flex items-center justify-center text-[13px] font-medium text-zinc-500 italic text-center px-4">No messages yet — start the conversation!</div>
                ) : (
                    messages.map((msg, idx) => {
                      const isMe = msg.userName === user.name;
                      const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                      return (
                        <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <span className="text-[10px] font-semibold text-zinc-500 mb-1 px-1">{isMe ? 'You' : msg.userName}</span>
                          <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-[14px] shadow-sm leading-relaxed tracking-wide ${isMe ? 'bg-gradient-to-br from-blue-600 to-blue-500 rounded-tr-sm text-white shadow-blue-500/20' : 'bg-black/60 backdrop-blur-md rounded-tl-sm text-zinc-200 border border-white/10'}`}>
                            {msg.message}
                          </div>
                          <span className="text-[9px] text-zinc-600 mt-1 px-1 font-mono">{timeStr}</span>
                        </motion.div>
                      )
                    })
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={sendChatMessage} className="p-3 bg-black/30 border-t border-white/5 flex gap-2">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Send protocol..." className="flex-1 bg-black/40 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 text-white transition-all" />
                <button type="submit" disabled={!chatInput.trim()} className="bg-gradient-to-r from-pink-600 to-purple-600 disabled:opacity-50 hover:from-pink-500 hover:to-purple-500 text-white p-2.5 flex items-center justify-center rounded-full transition-all shadow-glow">
                   <Send size={14} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Status Utilities */}
        <div className="bg-black/20">
          {whoIsTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 py-2 flex items-center text-xs text-zinc-400 bg-black/40">
               <span className="typing-dots overflow-hidden relative inline-block text-[11px]">
                  <span className="text-pink-400 font-semibold">{whoIsTyping}</span> is synchronizing code...
               </span>
            </motion.div>
          )}
          {errorStatus && (
            <div className="bg-red-900/40 text-red-300 text-[11px] p-2 px-4 flex items-center space-x-2 border-t border-red-500/30">
              <AlertCircle size={14}/><span>{errorStatus}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Global Editor Core */}
      <div className="flex-1 flex flex-col relative rounded-2xl shadow-2xl border border-white/10 bg-[#1e1e1e] overflow-hidden">
        {/* Editor Top Control Bar */}
        <div className="h-14 bg-black/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 z-10 shrink-0">
           <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-black/50 px-3 py-1.5 rounded-lg border border-white/5">
                 <Code2 size={16} className="text-blue-400" />
                 <select value={currentLang} onChange={changeLanguage} className="bg-transparent text-xs font-semibold uppercase tracking-wider text-zinc-200 focus:outline-none cursor-pointer">
                    <option value="javascript" className="bg-zinc-900 text-zinc-200">JavaScript</option>
                    <option value="python" className="bg-zinc-900 text-zinc-200">Python</option>
                    <option value="html" className="bg-zinc-900 text-zinc-200">HTML</option>
                    <option value="css" className="bg-zinc-900 text-zinc-200">CSS</option>
                    <option value="cpp" className="bg-zinc-900 text-zinc-200">C++</option>
                 </select>
              </div>
              <button onClick={handleSaveVersion} className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold text-zinc-300">
                <Save size={14} className="text-green-400" />
                <span className="hidden sm:inline">Save Repo</span>
              </button>
           </div>
           
           <button onClick={handleExitRoom} className="flex items-center space-x-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-4 py-1.5 rounded-lg transition-colors text-xs font-bold text-red-400 shadow-inner">
             <LogOut size={14} />
             <span>Exit Sandbox</span>
           </button>
        </div>
        
        {/* Engine Render */}
        <div className="flex-1 relative min-h-0 bg-[#1a1a1a]">
          <Editor content={content} onChange={handleCodeChange} language={currentLang} />
        </div>
      </div>
    </motion.div>
  );
}