import React, { createContext, useState, useEffect } from 'react';
import API from '../utils/api';
import Spinner from '../components/Spinner';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = (localStorage.getItem('token') || null);
      if (token) {
        try {
          const res = await API.get('/api/auth/me');
          setUser(res.data);
        } catch (err) {
          console.error('Session expired', err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await API.post('/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data);
    } catch (err) {
      throw err.response?.data?.message || 'Login failed';
    }
  };

  const signup = async (name, email, password) => {
    try {
        const res = await API.post('/api/auth/signup', { name, email, password });
        localStorage.setItem('token', res.data.token);
        setUser(res.data);
    } catch (err) {
        throw err.response?.data?.message || 'Registration failed';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) return <div className="h-screen"><Spinner /></div>;

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};