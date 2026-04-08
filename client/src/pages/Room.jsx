import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import Editor from '../components/Editor';
import Spinner from '../components/Spinner';
import { Users, Copy, Save, AlertCircle, MessageSquare, Send, X, LogOut, Code2, ChevronDown, ChevronUp, Check, CheckCheck } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Room() {
  const { roomId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // STEP 2: SAFE STATE INITIALIZATION
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
  const isLocalUpdateRef = useRef(false);
  const typingTimeoutRef = useRef(null);

  // STEP 4: FIX ROOM FETCH API
  useEffect(() => {
    if (!user) return navigate('/login');

    const fetchRoom = async () => {
      try {
        const res = await API.get(`/rooms/${roomId}`);
        setRoomDetails(res?.data || null);
        setContent(res?.data?.content || '');
        setCurrentLang(res?.data?.language || 'javascript');
        
        // Fetch Persistent Messages Safely
        const msgRes = await API.get(`/messages/${roomId}`);
        if (msgRes?.data) setMessages(msgRes.data);
      } catch (err) {
        console.error("Room fetch crash handled:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [roomId, user, navigate]);

  // STEP 5: SOCKET STABILITY & CLEANUP
  useEffect(() => {
    if (!roomId || !user || !roomDetails) return;

    socketRef.current = io(import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000');
    
    const joinRoom = () => {
      socketRef.current.emit('join-room', { roomId, user: { userId: user?._id, name: user?.name || 'Anonymous' } });
    };

    socketRef.current.on('connect', joinRoom);
    if (socketRef.current.connected) joinRoom();

    socketRef.current.on('user-joined', (activeUsers) => setUsers(activeUsers || []));
    socketRef.current.on('user-left', (activeUsers) => setUsers(activeUsers || []));
    socketRef.current.on('room-destroyed', () => {
      toast.error('The Administrator has permanently terminated this Sandbox.');
      navigate('/');
    });
    
    socketRef.current.on('sync-memory-state', ({ content }) => {
      // Overwrite DB latency with direct RAM snapshot mapping
      setSyncedContent(content || '');
      // Prevent standard debounce firing cycle back upward on a generic incoming sync
      isLocalUpdateRef.current = false;
      setContent(content || '');
    });

    socketRef.current.on('code-update', (newContent) => {
      setSyncedContent(newContent || '');
      isLocalUpdateRef.current = false;
      setContent(newContent || '');
    });

    socketRef.current.on('typing-indicator', ({ userName }) => {
      setWhoIsTyping(userName || 'Someone');
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setWhoIsTyping(''), 1500);
    });
    
    socketRef.current.on('receive-message', (data) => {
      if (!data) return;
      setMessages((prev) => {
        if (chatOpen && data?.userName !== user?.name) {
          socketRef.current?.emit('message-seen', { roomId, messageIds: [data?.id], userName: user?.name || 'User' });
        }
        return [...(prev || []), data];
      });
    });

    socketRef.current.on('message-seen-update', ({ messageIds, userName }) => {
      if (!messageIds || !userName) return;
      setMessages((prev) => (prev || []).map(msg => {
        if (msg?.id && messageIds.includes(msg.id)) {
           const newSeen = new Set(msg?.seenBy || []);
           newSeen.add(userName);
           return { ...msg, seenBy: Array.from(newSeen) };
        }
        return msg;
      }));
    });
    
    socketRef.current.on('language-updated', ({ language, userName }) => {
      setCurrentLang(language || 'javascript');
      toast(`${userName || 'Someone'} changed language to ${language || 'javascript'}`, { icon: '⚙️', style: { borderRadius: '10px', background: '#333', color: '#fff' }});
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
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('user-joined');
        socketRef.current.off('user-left');
        socketRef.current.off('room-destroyed');
        socketRef.current.off('sync-memory-state');
        socketRef.current.off('code-update');
        socketRef.current.off('typing-indicator');
        socketRef.current.off('receive-message');
        socketRef.current.off('message-seen-update');
        socketRef.current.off('language-updated');
        socketRef.current.off('disconnect');
        socketRef.current.off('reconnect');
        socketRef.current.emit('leave-room', { roomId });
        socketRef.current.disconnect();
      }
    };
  }, [roomId, user, roomDetails, chatOpen, navigate]);

  useEffect(() => {
    if (socketRef.current && debouncedContent !== syncedContent && roomDetails && isLocalUpdateRef.current) {
      socketRef.current.emit('code-change', { roomId, content: debouncedContent });
      isLocalUpdateRef.current = false; // Lock immediately drops back
    }
  }, [debouncedContent, roomId, roomDetails, syncedContent]);

  useEffect(() => {
    if(chatOpen) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatOpen]);

  const handleCodeChange = (newContent) => {
    isLocalUpdateRef.current = true;
    setContent(newContent || '');
    if (socketRef.current) socketRef.current.emit('typing', { roomId, userName: user?.name });
  };

  const changeLanguage = (e) => {
    const lang = e.target.value;
    setCurrentLang(lang);
    socketRef.current?.emit('language-change', { roomId, language: lang, userName: user?.name });
  };

  const handleSaveVersion = async () => {
    try {
      await API.post(`/rooms/${roomId}/save`, { content });
      toast.success('Architecture matrix saved successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to commit version map.');
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId || '');
    toast.success('Session ID copied to clipboard!');
  };
  
  const handleLeaveRoom = () => {
    if(window.confirm("Disconnect from session and return to Dashboard?")) { navigate('/'); }
  };

  const handleDestroyRoom = async () => {
    if(window.confirm("CRITICAL WARNING: Are you sure you want to permanently destory this room and all persistent chat history? This action cannot be undone.")) {
       try {
         await API.delete(`/rooms/${roomId}`);
         socketRef.current?.emit('destroy-room', { roomId });
         toast.success("Sandbox terminated permanently.");
         navigate('/');
       } catch (err) {
         toast.error("Failed to execute termination command.");
         console.error(err);
       }
    }
  };
  
  const sendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput?.trim()) return;
    
    const tempMsg = {
      id: Date.now().toString() + Math.random().toString(),
      userName: user?.name || 'Anonymous',
      message: chatInput,
      timestamp: Date.now(),
      seenBy: []
    };
    
    setMessages(prev => [...(prev || []), tempMsg]);
    
    socketRef.current?.emit('send-message', { roomId, message: chatInput, userName: user?.name });
    setChatInput('');
    
    API.post(`/messages/${roomId}`, { messageId: tempMsg.id, userName: user?.name, message: chatInput }).catch(err => console.error("Message Persistence Error:", err));
  };

  // STEP 3: ADD LOADING UI
  if (loading) return <div className="text-white text-center mt-20 flex flex-col items-center"><Spinner /><span className="mt-4 text-xs font-mono">Loading Room...</span></div>;

  // STEP 6: ERROR BOUNDARY
  if (!roomDetails) return <div className="text-red-500 text-center mt-20 font-bold bg-black/40 p-10 max-w-md mx-auto rounded-xl border border-red-500/30">ERROR: Room not found or network connection failed.</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex flex-col md:flex-row h-screen bg-transparent text-white overflow-hidden p-2 lg:p-4 gap-4 relative z-10">
      <div className="absolute inset-0 z-[-1] bg-gradient-to-br from-[#0c0c16] via-[#120f26] to-[#0a0a0a] animate-gradient-xy"></div>
      
      {/* Dynamic Sidebar */}
      <div className="w-full lg:w-80 hidden md:flex bg-white/5 backdrop-blur-2xl border border-white/10 flex-col flex-shrink-0 relative z-10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-black/20 flex flex-col gap-2">
          <div className="flex justify-between items-center">
             <h2 className="text-xl font-bold truncate bg-gradient-to-r from-blue-400 to-pink-400 bg-clip-text text-transparent flex-1 mr-2">{roomDetails?.name || 'Untitled Room'}</h2>
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
               <span>Engineers ({(users || []).length})</span>
            </div>
          </div>
          <ul className="space-y-2">
            {(!users || users.length === 0) && <div className="text-[13px] text-zinc-500 italic mt-2 px-1">Waiting for peers to connect...</div>}
            
            {/* STEP 1 & 9: PREVENT HARD CRASH WITH OPTIONAL MAP AND CHARAT */}
            {(users || []).map(u => (
              <li key={u?.socketId || Math.random()} className="flex items-center justify-between text-sm bg-white/5 hover:bg-white/10 transition-colors px-3 py-2 rounded-xl border border-white/5 shadow-sm">
                <span className="truncate flex items-center space-x-3">
                   <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-glow relative">
                     {(u?.name?.charAt(0) || '?').toUpperCase()}
                     <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border border-black shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                   </div>
                   <span className="font-medium text-zinc-200">{u?.name || 'Anonymous'}</span>
                </span>
                {u?.userId === user?._id && <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 bg-black/50 px-2 py-0.5 rounded-full">You</span>}
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
                {(!messages || messages.length === 0) ? (
                   <div className="h-full flex items-center justify-center text-[13px] font-medium text-zinc-500 italic text-center px-4">No messages yet — start the conversation!</div>
                ) : (
                    (messages || []).map((msg, idx) => {
                      if (!msg) return null;
                      const isMe = msg?.userName === user?.name;
                      const timestampVal = msg?.timestamp ? new Date(msg.timestamp) : new Date();
                      const timeStr = !isNaN(timestampVal) ? timestampVal.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...';
                      
                      return (
                        <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <span className="text-[10px] font-semibold text-zinc-500 mb-1 px-1">{isMe ? 'You' : (msg?.userName || 'User')}</span>
                          <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-[14px] shadow-sm leading-relaxed tracking-wide ${isMe ? 'bg-gradient-to-br from-blue-600 to-blue-500 rounded-tr-sm text-white shadow-blue-500/20' : 'bg-black/60 backdrop-blur-md rounded-tl-sm text-zinc-200 border border-white/10'}`}>
                            {msg?.message || ''}
                          </div>
                          
                          <div className="flex items-center space-x-1 mt-1.5 px-1">
                            <span className="text-[9px] text-zinc-600 font-mono flex-1 text-right">{timeStr}</span>
                            {isMe && (
                               msg?.seenBy?.length > 0
                                 ? <CheckCheck size={14} className="text-blue-400 drop-shadow-sm" />
                                 : <Check size={14} className="text-zinc-500" />
                            )}
                          </div>
                          
                        </motion.div>
                      )
                    })
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={sendChatMessage} className="p-3 bg-black/30 border-t border-white/5 flex gap-2">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Send protocol..." className="flex-1 bg-black/40 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 text-white transition-all" />
                <button type="submit" disabled={!chatInput?.trim()} className="bg-gradient-to-r from-pink-600 to-purple-600 disabled:opacity-50 hover:from-pink-500 hover:to-purple-500 text-white p-2.5 flex items-center justify-center rounded-full transition-all shadow-glow">
                   <Send size={14} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        
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

      <div className="flex-1 flex flex-col relative rounded-2xl shadow-2xl border border-white/10 bg-[#1e1e1e] overflow-hidden">
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
           
           {user?._id && roomDetails?.owner?._id && user._id === roomDetails.owner._id ? (
             <button onClick={handleDestroyRoom} className="flex items-center space-x-2 bg-red-600 hover:bg-red-500 px-4 py-1.5 rounded-lg transition-colors text-xs font-bold text-white shadow-glow hover:shadow-glow-lg border border-red-400">
               <LogOut size={14} />
               <span>Destroy Sandbox</span>
             </button>
           ) : (
             <button onClick={handleLeaveRoom} className="flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-1.5 rounded-lg transition-colors text-xs font-bold text-zinc-300 shadow-inner border border-zinc-600">
               <LogOut size={14} />
               <span>Leave Session</span>
             </button>
           )}
        </div>
        
        <div className="flex-1 relative min-h-0 bg-[#1a1a1a]">
          <Editor content={content} onChange={handleCodeChange} language={currentLang} />
        </div>
      </div>
    </motion.div>
  );
}