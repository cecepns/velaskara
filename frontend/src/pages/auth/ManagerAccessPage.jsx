import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Coffee, Mail, KeyRound, ArrowLeft, Loader2, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { request } from '../../utils/request';
import { API_ENDPOINTS } from '../../utils/endpoints';

export default function ManagerAccessPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState(1); // 1 = Request, 2 = Verify
  const [isLoading, setIsLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email manager harus diisi');
      return;
    }

    setIsLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.AUTH.REQUEST_OTP, { email });
      toast.success('Kode OTP berhasil dikirim ke email!');
      
      // If server returned otp_code in dev mode, display it
      if (res.otp_code) {
        setDevOtp(res.otp_code);
      }
      setStep(2);
    } catch (err) {
      toast.error(err.message || 'Gagal mengirim OTP. Pastikan email terdaftar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      toast.error('Masukkan 6 digit kode OTP');
      return;
    }

    setIsLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.AUTH.VERIFY_OTP, { email, otp_code: otpCode });
      toast.success('OTP Terverifikasi!');
      localStorage.setItem('velaskara_token', res.token);
      localStorage.setItem('velaskara_user', JSON.stringify(res.user));
      onLoginSuccess(res.user);
      navigate('/audits');
    } catch (err) {
      toast.error(err.message || 'Kode OTP tidak cocok atau kedaluwarsa');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-coffee-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-coffee-800 via-coffee-950 to-neutral-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-12 w-12 bg-coffee-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-coffee-950/50">
          <Coffee size={24} />
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-white font-display tracking-wide">
          Manager Secure Access
        </h2>
        <p className="mt-2 text-sm text-coffee-300">
          Masuk dengan verifikasi OTP untuk menandatangani form audit
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-2xl rounded-3xl sm:px-10 border border-gray-100">
          {step === 1 ? (
            <form className="space-y-6" onSubmit={handleRequestOtp}>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Email Manager Terdaftar
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail size={18} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coffee-600 focus:border-coffee-600 text-sm transition-all"
                    placeholder="manager@velaskara.com"
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
                    'Kirim Kode OTP'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              <div>
                <label htmlFor="otpCode" className="block text-sm font-semibold text-gray-700">
                  Masukkan Kode OTP
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <KeyRound size={18} />
                  </div>
                  <input
                    id="otpCode"
                    name="otpCode"
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coffee-600 focus:border-coffee-600 text-sm tracking-[0.5em] font-mono text-center transition-all"
                    placeholder="000000"
                  />
                </div>
              </div>

              {devOtp && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl flex items-start gap-3">
                  <Info className="text-amber-600 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h5 className="text-xs font-bold text-amber-800 uppercase">Dev Mode OTP</h5>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Gunakan kode berikut untuk login: <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200">{devOtp}</strong>
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-coffee-800 hover:bg-coffee-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coffee-600 disabled:opacity-50 transition-all duration-200"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin -ml-1 mr-2" size={18} />
                  ) : (
                    'Verifikasi & Masuk'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setDevOtp('');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  <ArrowLeft size={16} />
                  Kembali
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 border-t border-gray-200 pt-4 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Sign In Staff / Auditor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
