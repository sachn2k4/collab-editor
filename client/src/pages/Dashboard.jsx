import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      API.get('/api/rooms').then(res => setRooms(res.data)).catch(console.error);
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/api/rooms', { name: roomName });
      navigate(`/room/${res.data.roomId}`);
    } catch (err) {
      alert('Error creating room');
    }
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (joinRoomId.trim()) {
      console.log("Dashboard.jsx: Attempting to join Room ID:", joinRoomId);
      navigate(`/room/${joinRoomId}`);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-5xl w-full mx-auto p-6 lg:p-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Create New Sandbox</h3>
          <form onSubmit={handleCreateRoom} className="space-y-4 relative z-10">
            <input type="text" placeholder="Project Name" required className="w-full p-3 rounded-lg bg-black/40 border border-zinc-700/50 focus:outline-none focus:border-blue-500/50 transition-colors" value={roomName} onChange={(e) => setRoomName(e.target.value)} />
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 p-3 rounded-lg font-semibold transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)]">Create Environment</button>
          </form>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/10 relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -mr-16 -mb-16"></div>
          <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">Connect to Room</h3>
          <form onSubmit={handleJoinRoom} className="space-y-4 relative z-10">
            <input type="text" placeholder="Session ID" required className="w-full p-3 rounded-lg bg-black/40 border border-zinc-700/50 focus:outline-none focus:border-purple-500/50 transition-colors" value={joinRoomId} onChange={(e) => setJoinRoomId(e.target.value)} />
            <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 p-3 rounded-lg font-semibold transition-all shadow-[0_0_20px_rgba(147,51,234,0.2)] hover:shadow-[0_0_25px_rgba(147,51,234,0.4)]">Initialize Link</button>
          </form>
        </motion.div>

        <motion.div variants={itemVariants} className="md:col-span-2 mt-8">
          <h3 className="text-2xl font-bold mb-6 text-zinc-100 flex items-center space-x-2">
            <span>Your Workspaces</span>
            <div className="h-px bg-gradient-to-r from-zinc-700 to-transparent flex-1 ml-4"></div>
          </h3>
          {rooms.length === 0 ? (
            <p className="text-zinc-500 italic">No localized environments spawned yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map(room => (
                <div key={room._id} className="bg-white/5 hover:bg-white/10 backdrop-blur-md p-5 rounded-xl flex flex-col justify-between border border-white/10 transition-all group">
                  <div className="mb-4">
                    <h4 className="font-bold text-lg text-blue-100 group-hover:text-white transition-colors">{room.name}</h4>
                    <p className="text-xs text-zinc-500 mt-1 font-mono">{room.roomId}</p>
                  </div>
                  <button onClick={() => {
                      console.log("Dashboard.jsx: Opening Room ID:", room.roomId || room._id);
                      navigate(`/room/${room.roomId || room._id}`);
                  }} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/5">Launch IDE</button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}