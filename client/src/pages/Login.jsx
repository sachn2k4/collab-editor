import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setErrorMsg(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900">
      <div className="bg-zinc-800 p-8 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-zinc-700 w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">Log In</h2>
        
        {errorMsg && (
          <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded flex items-center space-x-2 text-sm">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" required className="w-full p-3 rounded bg-zinc-700 border border-zinc-600 focus:outline-none focus:border-blue-500 transition-colors" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" required className="w-full p-3 rounded bg-zinc-700 border border-zinc-600 focus:outline-none focus:border-blue-500 transition-colors" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button disabled={isSubmitting} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 p-3 rounded font-semibold transition-colors shadow">
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <p className="mt-4 text-center text-zinc-400">Don't have an account? <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Sign up</Link></p>
      </div>
    </div>
  );
}