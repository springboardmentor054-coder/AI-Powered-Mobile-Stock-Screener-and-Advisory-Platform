import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      toast.success('Welcome back');
      navigate('/query');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F7] p-4 font-sans">
      
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <div className="bg-gradient-to-tr from-[#0071e3] to-[#42a5f5] text-white p-3.5 rounded-2xl inline-flex mb-4 shadow-xl shadow-blue-500/20">
          <TrendingUp className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">StockOS</h1>
        <p className="text-gray-500 mt-2 font-medium">Intelligent market analysis.</p>
      </div>
      
      {/* Login Card */}
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 w-full max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border-transparent focus:bg-white border focus:border-[#0071e3]/30 focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all text-gray-900 font-medium placeholder:text-gray-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border-transparent focus:bg-white border focus:border-[#0071e3]/30 focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all text-gray-900 font-medium placeholder:text-gray-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full bg-[#0071e3] hover:bg-[#0077ED] text-white py-3.5 rounded-2xl font-semibold shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex justify-center items-center gap-2 group mt-2"
          >
            Sign In 
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>

        {/* Footer Link */}
        <p className="mt-8 text-center text-sm text-gray-500 font-medium">
          No account?{' '}
          <Link to="/register" className="text-[#0071e3] hover:text-[#0077ED] hover:underline decoration-2 underline-offset-4 transition-all">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}