import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';
import logoImg from '../../assets/logo.png';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email dan password harus diisi');
      return;
    }

    setIsLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
      toast.success(res.message || 'Login berhasil!');
      localStorage.setItem('velaskara_token', res.token);
      localStorage.setItem('velaskara_user', JSON.stringify(res.user));
      onLoginSuccess(res.user);

      if (res.user.role === 'manager') {
        navigate('/audits');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Email atau password salah');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-coffee-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-coffee-800 via-coffee-950 to-neutral-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex items-center justify-center  border border-coffee-800/20 p-1">
          <img src={logoImg} alt="Velaskara Logo" className="w-44 h-auto object-contain" />
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-white font-display tracking-wide">
          Velaskara Assessment
        </h2>
        <p className="mt-2 text-sm text-coffee-300">
          Operational Excellence & Assessment System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-2xl rounded-3xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coffee-600 focus:border-coffee-600 text-sm transition-all"
                  placeholder="admin@velaskara.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coffee-600 focus:border-coffee-600 text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-coffee-800 hover:bg-coffee-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coffee-600 disabled:opacity-50 transition-all duration-200"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin -ml-1 mr-2" size={18} />
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>


        </div>
      </div>
    </div>
  );
}
