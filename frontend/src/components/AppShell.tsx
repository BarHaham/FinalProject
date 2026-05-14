import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getStoredUser } from '../utils/storage';
import { useLanguage } from '../i18n/LanguageContext';

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
};

const navItems = [
  { to: '/dashboard', labelKey: 'nav.home' },
  { to: '/path', labelKey: 'nav.path' },
  { to: '/practice', labelKey: 'nav.practice' },
  { to: '/progress', labelKey: 'nav.progress' },
  { to: '/leaderboard', labelKey: 'nav.leaderboard' },
  { to: '/profile', labelKey: 'nav.profile' },
];

const AppShell: React.FC<AppShellProps> = ({ children, title }) => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const { language, isHebrew, setLanguage, t } = useLanguage();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#f8f7ff] text-slate-900">
      <aside className={`hidden lg:fixed lg:inset-y-0 ${isHebrew ? 'lg:right-0 lg:border-l' : 'lg:left-0 lg:border-r'} lg:flex lg:w-64 lg:flex-col lg:border-violet-100 lg:bg-white`}>
        <Link to="/dashboard" className="flex items-center gap-3 px-5 py-5">
          <div className="fitlingo-avatar-logo h-14 w-14 rounded-full border-2 border-white bg-[#f6edff] shadow-sm" />
          <span className="text-2xl font-black text-primary">FitLingo</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-2 px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-md px-4 py-3 text-sm font-bold transition ${
                  isActive ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as 'en' | 'he')}
            className="input-field text-sm font-bold"
            aria-label="Language"
          >
            <option value="en">{t('language.english')}</option>
            <option value="he">{t('language.hebrew')}</option>
          </select>
        </div>
        <div className="border-t border-slate-200 p-4">
          <p className="text-sm font-bold">{user?.name || t('nav.athlete')}</p>
          <button onClick={handleLogout} className="mt-3 text-sm font-bold text-slate-500 hover:text-danger">
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      <div className={isHebrew ? 'lg:pr-64' : 'lg:pl-64'}>
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Link to="/dashboard" className="flex items-center gap-2 text-xl font-black text-primary lg:hidden">
                <div className="fitlingo-avatar-logo h-10 w-10 rounded-full bg-[#f6edff]" />
                FitLingo
              </Link>
              {title && <h1 className="hidden text-2xl font-black lg:block">{title}</h1>}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as 'en' | 'he')}
                className="input-field hidden w-auto text-sm font-bold sm:block"
                aria-label="Language"
              >
                <option value="en">{t('language.english')}</option>
                <option value="he">{t('language.hebrew')}</option>
              </select>
              <Link to="/mission" className="btn-primary text-sm">
                {t('dashboard.startToday')}
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 pb-24 lg:px-8">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-6 border-t border-slate-200 bg-white lg:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `px-2 py-3 text-center text-xs font-bold ${isActive ? 'text-primary' : 'text-slate-500'}`
            }
          >
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default AppShell;
