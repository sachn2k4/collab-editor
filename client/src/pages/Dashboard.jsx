import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';
import { BoxSelect, Network, Orbit, Terminal } from 'lucide-react';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      API.get('/rooms').then(res => setRooms(res.data)).catch(console.error);
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/rooms', { name: roomName });
      navigate(`/room/${res.data._id}`);
    } catch (err) {
      alert('Error creating room');
    }
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (joinRoomId.trim()) navigate(`/room/${joinRoomId}`);
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } }, exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="min-h-screen flex flex-col relative">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-900 via-zinc-900 to-black animate-gradient-xy opacity-50 mix-blend-overlay pointer-events-none"></div>
      <Navbar />
      <div className="flex-1 max-w-6xl w-full mx-auto p-6 lg:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        
        <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-2xl p-8 rounded-3xl shadow-glow hover:shadow-glow-lg transition-shadow border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="flex space-x-3 items-center mb-6">
             <BoxSelect className="text-blue-400" />
             <h3 className="text-2xl font-bold text-white">Create Sandbox</h3>
          </div>
          <form onSubmit={handleCreateRoom} className="space-y-4 relative z-10">
            <input type="text" placeholder="Project Node Name" required className="w-full p-4 rounded-xl bg-black/40 border border-white/5 focus:outline-none focus:border-blue-500 transition-colors" value={roomName} onChange={(e) => setRoomName(e.target.value)} />
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 p-4 rounded-xl font-bold transition-all shadow-lg text-white tracking-widest uppercase text-sm">Deploy Environment</button>
          </form>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-2xl p-8 rounded-3xl shadow-glow hover:shadow-glow-lg transition-shadow border border-white/10 relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl -mr-16 -mb-16"></div>
          <div className="flex space-x-3 items-center mb-6">
             <Network className="text-purple-400" />
             <h3 className="text-2xl font-bold text-white">Connect to Room</h3>
          </div>
          <form onSubmit={handleJoinRoom} className="space-y-4 relative z-10">
            <input type="text" placeholder="Session Hash ID" required className="w-full p-4 rounded-xl bg-black/40 border border-white/5 focus:outline-none focus:border-purple-500 transition-colors font-mono" value={joinRoomId} onChange={(e) => setJoinRoomId(e.target.value)} />
            <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 p-4 rounded-xl font-bold transition-all shadow-lg text-white tracking-widest uppercase text-sm">Initialize Link</button>
          </form>
        </motion.div>

        <motion.div variants={itemVariants} className="md:col-span-2 mt-8">
          <h3 className="text-xl font-bold mb-6 text-zinc-100 flex items-center space-x-3">
            <Orbit size={20} className="text-zinc-400" />
            <span>Recent Sandboxes</span>
            <div className="h-px bg-gradient-to-r from-zinc-700 to-transparent flex-1 ml-4"></div>
          </h3>
          {(rooms?.length || 0) === 0 ? (
            <p className="text-zinc-500 italic text-sm">No environments populated.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(rooms || []).map(room => (
                <div key={room._id} onClick={() => navigate(`/room/${room._id}`)} className="bg-white/5 hover:bg-white/10 cursor-pointer backdrop-blur-xl p-6 rounded-2xl flex flex-col justify-between border border-white/10 transition-all hover:border-white/20 group hover:-translate-y-1 shadow-lg">
                  <div className="flex items-start justify-between mb-6">
                     <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors"><Terminal size={20} className="text-blue-400" /></div>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-zinc-100 group-hover:text-white transition-colors">{room.name}</h4>
                    <p className="text-xs text-zinc-500 mt-2 font-mono truncate">{room._id}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
