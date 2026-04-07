import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-zinc-800 border-b border-zinc-700 w-full px-6 py-4 flex justify-between items-center text-white">
      <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-blue-400">
        <Code2 size={24} />
        <span>CollabCode</span>
      </Link>
      {user && (
        <div className="flex items-center space-x-4">
          <span className="text-zinc-300">Hello, <span className="font-semibold text-white">{user.name}</span></span>
          <button onClick={handleLogout} className="flex items-center space-x-1 text-red-400 hover:text-red-500 transition-colors">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
}