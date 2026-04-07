import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Code2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-zinc-900 to-black"></div>
      
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} className="bg-white/5 backdrop-blur-xl p-8 sm:p-10 rounded-2xl shadow-2xl border border-white/10 w-full max-w-md relative z-10 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col items-center mb-8 relative z-10">
           <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
             <Code2 size={32} className="text-blue-400" />
           </div>
           <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Welcome Back</h2>
           <p className="text-zinc-400 mt-2 text-sm">Sign in to sync your collaborative environments</p>
        </div>
        
        {errorMsg && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg flex items-center space-x-3 text-sm shadow-inner relative z-10">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
             <input type="email" placeholder="Email Address" required className="w-full p-3.5 rounded-lg bg-black/40 border border-zinc-700/50 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60 transition-all text-white placeholder-zinc-500" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
             <input type="password" placeholder="Password" required className="w-full p-3.5 rounded-lg bg-black/40 border border-zinc-700/50 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60 transition-all text-white placeholder-zinc-500" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button disabled={isSubmitting} type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 p-3.5 rounded-lg font-semibold transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] text-white tracking-wide mt-2">
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
        <p className="mt-8 text-center text-zinc-400 text-sm relative z-10">
          New to the platform? <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors ml-1">Create an account</Link>
        </p>
      </motion.div>
    </motion.div>
  );
}