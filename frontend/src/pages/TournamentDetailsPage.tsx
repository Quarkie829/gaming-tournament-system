import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tournamentsApi } from '../api/tournamentsApi';
import { registrationsApi } from '../api/registrationsApi';
import { Tournament, UserEligibility, Registration } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { RegisterModal } from '../components/RegisterModal';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  Users,
  Trophy,
  DollarSign,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle,
  Ban,
  ArrowLeft
} from 'lucide-react';

export const TournamentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [userEligibility, setUserEligibility] = useState<UserEligibility | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await tournamentsApi.getTournament(parseInt(id, 10));
      setTournament(res.tournament);
      setRegistrations(res.registrations);
      setUserEligibility(res.user_eligibility);
    } catch (err) {
      console.error('Failed to load tournament details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id, isAuthenticated]);

  const handleCancelRegistration = async (registrationId: number) => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) return;
    try {
      setActionLoading(true);
      const res = await registrationsApi.cancelRegistration(registrationId);
      setActionMessage(res.message);
      await fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel registration.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-slate-400">Loading tournament specification & rules...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Tournament Not Found</h2>
        <Link to="/tournaments" className="text-sm text-blue-400 hover:underline">
          Return to tournament browser
        </Link>
      </div>
    );
  }

  const isSolo = tournament.participation_type === 'Solo';
  const registeredCount = tournament.registered_count || 0;
  const max = tournament.max_participants || 16;
  const percent = Math.min(100, Math.round((registeredCount / max) * 100));

  // Determine user's active registration record
  const userRegistration = registrations.find(
    (r) =>
      r.status !== 'Cancelled' &&
      (r.user_id === user?.user_id ||
        (userEligibility?.captained_teams || []).some((ct) => ct.team_id === r.team_id))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <Link
        to="/tournaments"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Tournaments</span>
      </Link>

      {/* Main Header Banner */}
      <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-600/20 text-blue-400 border border-blue-500/30">
                {tournament.game_name} ({tournament.genre})
              </span>
              <StatusBadge status={tournament.status} />
              <span className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {tournament.format}
              </span>
              <span
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  isSolo
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                    : 'bg-purple-950/60 text-purple-400 border border-purple-500/30'
                }`}
              >
                {isSolo ? 'Solo Competition' : `Team Event (${tournament.team_size || 5} Players)`}
              </span>
            </div>

            <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-white">
              {tournament.title}
            </h1>

            <p className="text-xs text-slate-400 flex items-center space-x-2">
              <span>Platform: {tournament.platform}</span>
              <span>•</span>
              <span>Publisher: {tournament.publisher}</span>
            </p>
          </div>

          {/* Quick CTA Card */}
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 min-w-[280px] space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Entry Fee</span>
              <span className="text-lg font-bold text-emerald-400">
                {Number(tournament.entry_fee) === 0 ? 'FREE ENTRY' : `$${Number(tournament.entry_fee).toFixed(2)}`}
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Slots Filled</span>
                <span className="font-semibold text-white">
                  {registeredCount} / {max}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    percent >= 100 ? 'bg-rose-500' : percent >= 75 ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
            </div>

            {/* Registration Action */}
            {isAuthenticated ? (
              userRegistration ? (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-blue-950/60 border border-blue-500/40 text-xs text-blue-300 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 font-medium">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Registered</span>
                    </span>
                    <StatusBadge status={userRegistration.status} />
                  </div>
                  <button
                    onClick={() => handleCancelRegistration(userRegistration.registration_id)}
                    disabled={actionLoading}
                    className="w-full py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-white bg-rose-950/30 hover:bg-rose-900/60 border border-rose-500/30 transition-colors"
                  >
                    Cancel Registration
                  </button>
                </div>
              ) : tournament.status !== 'Open' ? (
                <div className="p-2.5 rounded-xl bg-slate-700/50 text-center text-xs text-slate-400 font-medium">
                  Registration {tournament.status}
                </div>
              ) : userEligibility?.is_deadline_passed ? (
                <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-center text-xs text-rose-300 font-medium">
                  Registration Deadline Passed
                </div>
              ) : userEligibility?.is_full ? (
                <div className="p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/30 text-center text-xs text-amber-300 font-medium">
                  Tournament Full
                </div>
              ) : (
                <button
                  onClick={() => setModalOpen(true)}
                  className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all"
                >
                  {isSolo ? 'Register as Solo Player' : 'Register My Team'}
                </button>
              )
            ) : (
              <Link
                to="/login"
                className="block text-center w-full py-3 rounded-xl font-semibold text-xs text-white bg-blue-600 hover:bg-blue-500 transition-colors"
              >
                Sign In to Register
              </Link>
            )}
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs">
          {actionMessage}
        </div>
      )}

      {/* Grid: Rules & Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Rules & Dates */}
        <div className="lg:col-span-1 space-y-6">
          {/* Timeline Card */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Event Schedule</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="text-slate-400 mb-0.5">Registration Deadline</div>
                <div className="font-semibold text-amber-400 font-mono">
                  {new Date(tournament.registration_deadline).toLocaleString()}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="text-slate-400 mb-0.5">Tournament Starts</div>
                <div className="font-semibold text-slate-200 font-mono">
                  {new Date(tournament.start_date).toLocaleString()}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="text-slate-400 mb-0.5">Tournament Ends</div>
                <div className="font-semibold text-slate-200 font-mono">
                  {new Date(tournament.end_date).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* TournamentRules Entity Card */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Official Tournament Rules</span>
            </h3>

            <div className="space-y-2 text-xs divide-y divide-slate-800">
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Participation Type</span>
                <span className="font-semibold text-slate-200">{tournament.participation_type}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Required Team Size</span>
                <span className="font-semibold text-slate-200">{tournament.team_size || 1}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Minimum Age</span>
                <span className="font-semibold text-slate-200">
                  {tournament.min_age ? `${tournament.min_age} years` : 'No restriction'}
                </span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Region Restriction</span>
                <span className="font-semibold text-slate-200">
                  {tournament.region_restriction || 'Global'}
                </span>
              </div>
            </div>

            {tournament.rules_text && (
              <div className="pt-3 border-t border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Specific Rulebook Text
                </div>
                <p className="text-xs text-slate-300 whitespace-pre-line bg-slate-800/40 p-3 rounded-xl border border-slate-700/40 leading-relaxed">
                  {tournament.rules_text}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Registered Participants / Teams */}
        <div className="lg:col-span-2">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Registered Entrants</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {isSolo ? 'Solo competitors' : 'Registered squads & captains'}
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {registrations.length} record(s)
              </span>
            </div>

            {registrations.length === 0 ? (
              <div className="text-center py-12 rounded-xl bg-slate-800/30 border border-slate-800 text-slate-500 text-xs">
                No registrations submitted for this tournament yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">#</th>
                      <th className="px-4 py-3">{isSolo ? 'Player' : 'Team / Captain'}</th>
                      <th className="px-4 py-3">Registered On</th>
                      <th className="px-4 py-3 rounded-r-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {registrations.map((reg, idx) => (
                      <tr key={reg.registration_id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-3">
                          {isSolo ? (
                            <div className="font-semibold text-white flex items-center space-x-2">
                              <span>{reg.username}</span>
                              {reg.user_country && (
                                <span className="text-[10px] text-slate-400 font-normal">
                                  ({reg.user_country})
                                </span>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div className="font-semibold text-white">{reg.team_name}</div>
                              <div className="text-[10px] text-slate-400">
                                Captain: {reg.captain_name || 'Assigned Captain'}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400">
                          {new Date(reg.registration_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={reg.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <RegisterModal
        tournament={tournament}
        userEligibility={userEligibility}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          fetchDetails();
        }}
      />
    </div>
  );
};
