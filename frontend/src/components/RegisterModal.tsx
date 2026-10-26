import React, { useState } from 'react';
import { Tournament, UserEligibility } from '../types';
import { registrationsApi } from '../api/registrationsApi';
import { X, ShieldAlert, CheckCircle2, Users, User, ArrowRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RegisterModalProps {
  tournament: Tournament;
  userEligibility: UserEligibility | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  tournament,
  userEligibility,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isSolo = tournament.participation_type === 'Solo';
  const teams = userEligibility?.captained_teams || [];

  const handleRegisterSolo = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await registrationsApi.registerSolo(tournament.tournament_id);
      setSuccessMsg(res.message);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterTeam = async () => {
    if (!selectedTeamId) {
      setError('Please select a team to register.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await registrationsApi.registerTeam(tournament.tournament_id, Number(selectedTeamId));
      setSuccessMsg(res.message);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Team registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            {isSolo ? <User className="w-5 h-5" /> : <Users className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-xl font-bold font-heading text-white">
              {isSolo ? 'Solo Player Registration' : 'Team Tournament Entry'}
            </h2>
            <p className="text-xs text-slate-400">{tournament.title}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content depending on Solo vs Team */}
        {isSolo ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Tournament Format:</span>
                <span className="font-medium text-slate-200">{tournament.format}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Entry Fee:</span>
                <span className="font-semibold text-emerald-400">
                  {Number(tournament.entry_fee) === 0 ? 'FREE ENTRY' : `$${Number(tournament.entry_fee).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Registration Deadline:</span>
                <span className="font-mono text-slate-300">
                  {new Date(tournament.registration_deadline).toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              By confirming, your registration will be placed in <strong>Pending</strong> status for administrator review.
              Per database integrity constraints, your profile will be registered exclusively for slot allocation.
            </p>

            <button
              onClick={handleRegisterSolo}
              disabled={loading || !!successMsg}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20"
            >
              {loading ? 'Submitting Registration...' : 'Confirm Solo Registration'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Required Team Size:</span>
                <span className="font-semibold text-purple-400">{tournament.team_size || 5} Players</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Entry Fee (Per Team):</span>
                <span className="font-semibold text-emerald-400">
                  {Number(tournament.entry_fee) === 0 ? 'FREE ENTRY' : `$${Number(tournament.entry_fee).toFixed(2)}`}
                </span>
              </div>
            </div>

            {teams.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs space-y-3">
                <p>
                  You are not currently the captain of any teams. Only team captains can enter a squad into team tournaments.
                </p>
                <Link
                  to="/teams"
                  onClick={onClose}
                  className="inline-flex items-center text-xs font-semibold text-blue-400 hover:underline"
                >
                  Create a Team now <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Select Captained Team
                </label>
                <div className="space-y-2">
                  {teams.map((t) => {
                    const meetsSize = t.meets_size_requirement;
                    const isAlreadyReg = t.is_registered;

                    return (
                      <label
                        key={t.team_id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedTeamId === t.team_id
                            ? 'bg-blue-950/60 border-blue-500 text-white'
                            : isAlreadyReg || !meetsSize
                            ? 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                            : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="teamSelect"
                            disabled={isAlreadyReg || !meetsSize}
                            checked={selectedTeamId === t.team_id}
                            onChange={() => setSelectedTeamId(t.team_id)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-semibold text-sm">{t.team_name}</div>
                            <div className="text-[11px] text-slate-400">
                              Roster: {t.member_count} / {tournament.team_size || 5} players
                            </div>
                          </div>
                        </div>

                        <div>
                          {isAlreadyReg ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                              Already Entered
                            </span>
                          ) : !meetsSize ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/70 text-amber-400">
                              Roster too small
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-400">
                              Eligible
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                <button
                  onClick={handleRegisterTeam}
                  disabled={loading || !selectedTeamId || !!successMsg}
                  className="w-full mt-4 py-3 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20"
                >
                  {loading ? 'Submitting Team...' : 'Confirm Team Registration'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
