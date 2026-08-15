import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import api from '../utils/api';
import { getStoredUser } from '../utils/storage';
import { useLanguage } from '../i18n/LanguageContext';

type LeaderboardEntry = {
  user_id: number;
  name: string;
  league: string;
  weekly_xp: number;
  rank_position: number;
};

type UserRank = {
  league: string;
  weekly_xp: number;
  rank_position: number;
};

const LEAGUE_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

const leagueColor: Record<string, string> = {
  Bronze: 'text-amber-700',
  Silver: 'text-slate-500',
  Gold: 'text-yellow-500',
  Platinum: 'text-cyan-600',
  Diamond: 'text-violet-600',
};

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [selectedLeague, setSelectedLeague] = useState('Bronze');
  const [loading, setLoading] = useState(true);
  // Jump to the user's own league only on the first load — after that the
  // league tabs must stay wherever the user clicked.
  const leagueInitialized = useRef(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) { navigate('/login'); return; }

    const fetchData = async () => {
      try {
        const [rankRes, entriesRes] = await Promise.all([
          api.get<UserRank>(`/leaderboard/user/${user.id}`),
          api.get<LeaderboardEntry[]>(`/leaderboard/current/${selectedLeague}`),
        ]);

        if (rankRes.data?.league) {
          setUserRank(rankRes.data);
          if (!leagueInitialized.current) {
            leagueInitialized.current = true;
            if (rankRes.data.league !== selectedLeague) {
              setSelectedLeague(rankRes.data.league);
            }
          }
        }
        setEntries(entriesRes.data);
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, selectedLeague]);

  const userId = getStoredUser()?.id;

  return (
    <AppShell title={t('leaderboard.title')}>
      <div className="grid gap-6">
        <section>
          <p className="text-sm font-black uppercase tracking-wide text-primary">{t('leaderboard.kicker')}</p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">{t('leaderboard.heading')}</h2>
          <p className="mt-2 max-w-2xl text-slate-600">{t('leaderboard.copy')}</p>
        </section>

        {userRank && (
          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{t('leaderboard.yourRank')}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
              <div>
                <p className={`text-2xl font-black ${leagueColor[userRank.league] || 'text-primary'}`}>
                  {userRank.league}
                </p>
                <p className="text-sm text-slate-500">{t('leaderboard.league')}</p>
              </div>
              <div>
                <p className="text-2xl font-black text-primary">#{userRank.rank_position}</p>
                <p className="text-sm text-slate-500">{t('leaderboard.rank')}</p>
              </div>
              <div>
                <p className="text-2xl font-black">{userRank.weekly_xp}</p>
                <p className="text-sm text-slate-500">{t('leaderboard.weeklyXp')}</p>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-black">{t('leaderboard.rankings')}</h3>
            <div className="flex flex-wrap gap-2">
              {LEAGUE_ORDER.map((league) => (
                <button
                  key={league}
                  onClick={() => setSelectedLeague(league)}
                  className={`rounded-full px-3 py-1 text-xs font-black transition ${
                    selectedLeague === league
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {league}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">{t('leaderboard.loading')}</p>
          ) : entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">{t('leaderboard.empty')}</p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, index) => {
                const rank = index + 1;
                const isCurrentUser = entry.user_id === userId;
                return (
                  <div
                    key={entry.user_id}
                    className={`flex items-center justify-between rounded-md p-3 ${
                      isCurrentUser ? 'border-2 border-primary bg-primary/5' : 'bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 text-center text-sm font-black ${
                        rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-slate-400' : rank === 3 ? 'text-amber-600' : 'text-slate-500'
                      }`}>
                        {rank <= 3 ? ['1st', '2nd', '3rd'][rank - 1] : `#${rank}`}
                      </span>
                      <p className={`font-bold ${isCurrentUser ? 'text-primary' : 'text-slate-800'}`}>
                        {entry.name}{isCurrentUser ? ` (${t('leaderboard.you')})` : ''}
                      </p>
                    </div>
                    <span className="text-sm font-black text-slate-600">{entry.weekly_xp} XP</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black">🏆 {t('leaderboard.howTitle')}</h3>
          <ul className="mt-4 space-y-3 text-slate-600">
            <li className="flex gap-3">
              <span aria-hidden="true">📈</span>
              <span>{t('leaderboard.rulePromote')}</span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true">📉</span>
              <span>{t('leaderboard.ruleDemote')}</span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true">🔄</span>
              <span>{t('leaderboard.ruleReset')}</span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true">🥇</span>
              <span>{t('leaderboard.ruleLeagues')}</span>
            </li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
};

export default Leaderboard;
