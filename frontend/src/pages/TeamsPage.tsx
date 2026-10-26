import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { teamsApi } from '../api/teamsApi';
import { Team } from '../types';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, Shield, Search, ArrowRight, X, AlertCircle } from 'lucide-react';

export const TeamsPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mineOnly, setMineOnly] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  // Create Team Modal State
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await teamsApi.listTeams({
        mine: mineOnly,
        search: search.trim() || undefined
      });
      setTeams(res.teams);
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [mineOnly, search]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      setCreateLoading(true);
      setCreateError(null);
      await teamsApi.createTeam(newTeamName.trim());
      setNewTeamName('');
      setCreateModalOpen(false);
      await fetchTeams();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create team.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
            <Users className="w-4 h-4" />
            <span>Module 3 • Team Rosters</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white">
            Esports Teams & Clubs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Form competitive squads, designate captains, manage rosters, and register for team tournaments.
          </p>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all flex items-center space-x-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Team</span>
          </button>
        )}
      </div>

      {/* Filter and Tab controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setMineOnly(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              !mineOnly
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Teams
          </button>
          {isAuthenticated && (
            <button
              onClick={() => setMineOnly(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                mineOnly
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              My Teams ({teams.filter((t) => t.captain_id === user?.user_id).length > 0 ? 'Member/Captain' : 'Filter'})
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-48 rounded-2xl bg-slate-900/40 animate-pulse"></div>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-20 rounded-2xl bg-slate-900/40 border border-slate-800">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No teams found</h3>
          <p className="text-xs text-slate-400 mb-4">
            {mineOnly
              ? "You haven't created or joined any teams yet."
              : 'No teams match your search criteria.'}
          </p>
          {isAuthenticated && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
            >
              Create the First Team
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((t) => {
            const isUserCaptain = user?.user_id === t.captain_id;

            return (
              <div
                key={t.team_id}
                className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-heading font-bold text-base">
                      {t.team_name.substring(0, 2).toUpperCase()}
                    </span>
                    {isUserCaptain && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-950/70 text-purple-400 border border-purple-500/30">
                        You're Captain
                      </span>
                    )}
                  </div>

                  <h3 className="font-heading text-xl font-bold text-white group-hover:text-purple-400 transition-colors mb-2">
                    {t.team_name}
                  </h3>

                  <div className="space-y-1 text-xs text-slate-400 mb-6">
                    <div className="flex justify-between">
                      <span>Team Captain:</span>
                      <span className="font-semibold text-slate-200">{t.captain_username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Roster Count:</span>
                      <span className="font-semibold text-slate-200">{t.member_count || 1} players</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                      <span>Created:</span>
                      <span>{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end">
                  <Link
                    to={`/teams/${t.team_id}`}
                    className="inline-flex items-center text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <span>View Roster & Manage</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Team Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-8">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-heading text-white">Create New Team</h2>
                <p className="text-xs text-slate-400">You will be designated as the Team Captain</p>
              </div>
            </div>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Team Name
                </label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Cloud9 Elite, NAVI Legion"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                By creating this team, you will be assigned the Captain role in the database Teams and TeamMembers tables, allowing you to invite players and enter tournaments.
              </p>

              <button
                type="submit"
                disabled={createLoading || !newTeamName.trim()}
                className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20"
              >
                {createLoading ? 'Creating Team...' : 'Create Team & Assume Captaincy'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
