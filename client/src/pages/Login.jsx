import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Anchor, ShieldAlert, Zap, Globe, MessageSquare, Terminal } from 'lucide-react';
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
      {/* Animated Blueprint */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-900 via-purple-900 to-black animate-gradient-xy"></div>
      <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
      
      <div className="flex w-full max-w-5xl relative z-10 bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden min-h-[600px]">
        {/* Left Side: SaaS Marketing */}
        <div className="hidden lg:flex md:w-1/2 bg-black/40 p-12 flex-col justify-center border-r border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-glow">
              <Terminal size={24} className="text-white" />
            </div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tighter">CollabCode</h1>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-4">Code together.<br/>Build faster.<br/><span className="text-purple-400">Collaborate in real-time.</span></h2>
          <p className="text-zinc-300 xl:text-zinc-400 mb-8 text-[15px] leading-relaxed font-medium">The collaborative engine for professional engineering teams. Instantly provision sandbox environments, sync architecture logic natively, and deploy code together in real-time.</p>
          
          <div className="grid grid-cols-1 gap-4 text-sm font-medium text-zinc-300">
            <div className="flex items-center space-x-3"><Zap size={18} className="text-yellow-400" /><span>Real-time Code Synchronization</span></div>
            <div className="flex items-center space-x-3"><Globe size={18} className="text-blue-400" /><span>Multi-User Global Scale</span></div>
            <div className="flex items-center space-x-3"><MessageSquare size={18} className="text-pink-400" /><span>Live WebSockets Chat Platform</span></div>
          </div>
        </div>

        {/* Right Side: Auth */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center relative bg-black/20">
          <div className="lg:hidden flex items-center justify-center space-x-2 mb-8">
            <Terminal size={24} className="text-blue-400" />
            <h1 className="text-3xl font-extrabold text-white">CollabCode</h1>
          </div>

          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-2">Welcome Back</h2>
          <p className="text-zinc-400 text-sm mb-8">Authenticate to access your active rooms.</p>
          
          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg flex items-center space-x-3 text-sm shadow-inner">
              <ShieldAlert size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
               <input type="email" id="email" required className="peer w-full p-4 pt-6 rounded-xl bg-black/40 border border-zinc-700/50 focus:outline-none focus:border-blue-500/60 transition-all text-white placeholder-transparent" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
               <label htmlFor="email" className="absolute left-4 top-1.5 text-xs text-zinc-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-blue-400 pointer-events-none">Email Address</label>
            </div>
            <div className="relative group">
               <input type="password" id="password" required className="peer w-full p-4 pt-6 rounded-xl bg-black/40 border border-zinc-700/50 focus:outline-none focus:border-blue-500/60 transition-all text-white placeholder-transparent" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
               <label htmlFor="password" className="absolute left-4 top-1.5 text-xs text-zinc-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-blue-400 pointer-events-none">Password</label>
            </div>
            <button disabled={isSubmitting} type="submit" className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 p-4 rounded-xl font-semibold transition-all shadow-glow hover:shadow-glow-lg text-white">
              {isSubmitting ? (
                 <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>Initialize Session</span>
              )}
            </button>
          </form>
          <p className="mt-8 text-center text-zinc-400 text-sm">
            Not configured yet? <Link to="/signup" className="text-blue-400 hover:text-purple-400 font-semibold transition-colors ml-1">Create Sandbox Account</Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}