import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      api.get('/rooms').then(res => setRooms(res.data)).catch(console.error);
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/rooms', { name: roomName });
      navigate(`/room/${res.data.roomId}`);
    } catch (err) {
      alert('Error creating room');
    }
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (joinRoomId.trim()) {
      navigate(`/room/${joinRoomId}`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-4xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <div className="bg-zinc-800 p-6 rounded-xl shadow-lg border border-zinc-700">
          <h3 className="text-2xl font-bold mb-4 text-blue-400">Create New Room</h3>
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <input type="text" placeholder="Room Name" required className="w-full p-3 rounded bg-zinc-700 border border-zinc-600 focus:outline-none focus:border-blue-500" value={roomName} onChange={(e) => setRoomName(e.target.value)} />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-semibold transition-colors">Create Room</button>
          </form>
        </div>

        <div className="bg-zinc-800 p-6 rounded-xl shadow-lg border border-zinc-700">
          <h3 className="text-2xl font-bold mb-4 text-purple-400">Join Room</h3>
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <input type="text" placeholder="Room ID" required className="w-full p-3 rounded bg-zinc-700 border border-zinc-600 focus:outline-none focus:border-purple-500" value={joinRoomId} onChange={(e) => setJoinRoomId(e.target.value)} />
            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 p-3 rounded font-semibold transition-colors">Join Room</button>
          </form>
        </div>

        <div className="md:col-span-2">
          <h3 className="text-2xl font-bold mb-4 text-zinc-300">Your Rooms</h3>
          {rooms.length === 0 ? (
            <p className="text-zinc-500">You haven't created any rooms yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rooms.map(room => (
                <div key={room._id} className="bg-zinc-800 p-4 rounded-lg flex justify-between items-center border border-zinc-700">
                  <div>
                    <h4 className="font-bold text-lg">{room.name}</h4>
                    <p className="text-sm text-zinc-500">ID: {room.roomId}</p>
                  </div>
                  <button onClick={() => navigate(`/room/${room.roomId}`)} className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded text-zinc-300">Open</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}