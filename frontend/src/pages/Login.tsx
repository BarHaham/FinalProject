import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import { apiUrl } from '../utils/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${apiUrl}/auth/login`, {
        email,
        password,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      toast.success(t('auth.loginSuccess'));
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      await axios.post(`${apiUrl}/auth/forgot-password`, { email }, { timeout: 60000 });
      toast.success(t('auth.resetSent'));
      setResetMode(false);
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        toast.error('Server is waking up, please try again in 30 seconds.');
      } else {
        toast.error(t('auth.resetFailed'));
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-start justify-center overflow-x-hidden bg-gradient-to-br from-secondary to-blue-900 p-4 py-6 sm:items-center">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="fitlingo-avatar-logo mx-auto mb-6 h-24 w-24 rounded-full border-4 border-white bg-[#f6edff] shadow-md" />
        <h1 className="text-3xl font-bold text-center mb-8 text-secondary">FitLingo</h1>
        
        {resetMode ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <h2 className="text-xl font-black">{t('auth.resetTitle')}</h2>
              <p className="mt-2 text-sm text-slate-600">{t('auth.resetCopy')}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">{t('auth.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="your@email.com"
                required
              />
            </div>
            <button type="submit" disabled={resetLoading} className="btn-secondary w-full">
              {resetLoading ? t('auth.sendingReset') : t('auth.sendReset')}
            </button>
            <button type="button" onClick={() => setResetMode(false)} className="w-full py-2 text-sm font-bold text-primary">
              {t('auth.backToLogin')}
            </button>
          </form>
        ) : (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">{t('auth.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">{t('auth.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-secondary w-full"
          >
            {loading ? t('auth.loggingIn') : t('auth.login')}
          </button>
          <button type="button" onClick={() => setResetMode(true)} className="w-full py-2 text-sm font-bold text-primary">
            {t('auth.forgotPassword')}
          </button>
        </form>
        )}

        <p className="text-center mt-4">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            {t('auth.signUp')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
