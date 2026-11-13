import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tournamentsApi } from '../api/tournamentsApi';
import { registrationsApi } from '../api/registrationsApi';
import { matchesApi } from '../api/matchesApi';
import { financialApi } from '../api/financialApi';
import { Tournament, UserEligibility, Registration, Match, Prize, TournamentSponsor } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { RegisterModal } from '../components/RegisterModal';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/currency';
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
  ArrowLeft,
  Swords,
  Gift,
  Building2,
  ExternalLink
} from 'lucide-react';

export const TournamentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'matches' | 'prizes' | 'sponsors'>('overview');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [sponsors, setSponsors] = useState<TournamentSponsor[]>([]);
  const [userEligibility, setUserEligibility] = useState<UserEligibility | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchDetails = async () => {
    if (!id) return;
    const tournId = parseInt(id, 10);
    if (isNaN(tournId)) return;

    try {
      setLoading(true);

      // 1. Fetch primary tournament specification & rules
      const tournRes = await tournamentsApi.getTournament(tournId);
      if (tournRes?.tournament) {
        setTournament(tournRes.tournament);
        setRegistrations(tournRes.registrations || []);
        setUserEligibility(tournRes.user_eligibility || null);
      }

      // 2. Fetch auxiliary module data safely (don't break tournament page if secondary module is empty)
      const [matchesResult, prizesResult, sponsorsResult] = await Promise.allSettled([
        matchesApi.listMatches({ tournament_id: tournId }),
        financialApi.listPrizes({ tournament_id: tournId }),
        financialApi.listTournamentSponsors(tournId)
      ]);

      if (matchesResult.status === 'fulfilled') {
        setMatches(matchesResult.value.matches || []);
      }
      if (prizesResult.status === 'fulfilled') {
        setPrizes(prizesResult.value.prizes || []);
      }
      if (sponsorsResult.status === 'fulfilled') {
        setSponsors(sponsorsResult.value.sponsors || []);
      }
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
                {Number(tournament.entry_fee) === 0 ? 'FREE ENTRY' : formatINR(tournament.entry_fee)}
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

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 space-x-1 sm:space-x-3 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Overview & Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('participants')}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'participants'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Participants ({registrations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('matches')}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'matches'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Swords className="w-3.5 h-3.5" />
          <span>Matches & Schedule ({matches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('prizes')}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'prizes'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          <span>Prizes ({prizes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sponsors')}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'sponsors'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Sponsors ({sponsors.length})</span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
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
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Official Tournament Rules (TournamentRules Entity)</span>
              </h3>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                  <span className="text-slate-400 block mb-1">Participation Type</span>
                  <span className="font-semibold text-slate-200 text-sm">{tournament.participation_type}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                  <span className="text-slate-400 block mb-1">Required Team Size</span>
                  <span className="font-semibold text-slate-200 text-sm">{tournament.team_size || 1} Player(s)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                  <span className="text-slate-400 block mb-1">Minimum Age</span>
                  <span className="font-semibold text-slate-200 text-sm">
                    {tournament.min_age ? `${tournament.min_age} years` : 'No restriction'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                  <span className="text-slate-400 block mb-1">Region Restriction</span>
                  <span className="font-semibold text-slate-200 text-sm">{tournament.region_restriction || 'Global'}</span>
                </div>
              </div>

              {tournament.rules_text && (
                <div className="pt-3 border-t border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Rulebook Text & Details
                  </div>
                  <p className="text-xs text-slate-300 whitespace-pre-line bg-slate-800/40 p-4 rounded-xl border border-slate-700/40 leading-relaxed">
                    {tournament.rules_text}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Participants */}
      {activeTab === 'participants' && (
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Registered Entrants</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">{registrations.length} record(s)</span>
          </div>

          {registrations.length === 0 ? (
            <div className="text-center py-12 rounded-xl bg-slate-800/30 text-slate-500 text-xs">
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
                          <div className="font-semibold text-white">
                            {reg.username} {reg.user_country && `(${reg.user_country})`}
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
      )}

      {/* Tab 3: Matches & Schedule (Module 5) */}
      {activeTab === 'matches' && (
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
              <Swords className="w-4 h-4 text-rose-400" />
              <span>Tournament Match Schedule</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">{matches.length} match(es)</span>
          </div>

          {matches.length === 0 ? (
            <div className="text-center py-12 rounded-xl bg-slate-800/30 text-slate-500 text-xs">
              No matches have been scheduled for this tournament yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((m) => {
                const p1 = m.participants?.find((p) => p.slot_number === 1);
                const p2 = m.participants?.find((p) => p.slot_number === 2);

                return (
                  <Link
                    key={m.match_id}
                    to={`/matches/${m.match_id}`}
                    className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-blue-500/50 transition-all block group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-blue-400">
                        {m.round_name} • Match #{m.match_number}
                      </span>
                      <StatusBadge status={m.status} />
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-700/40 space-y-2 mb-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className={p1?.outcome === 'Win' ? 'font-bold text-emerald-400' : 'text-slate-300'}>
                          {p1?.entrant_name || 'TBD (Slot 1)'}
                        </span>
                        <span className="font-mono font-bold text-white">{p1?.score ?? '-'}</span>
                      </div>
                      <div className="border-t border-slate-800"></div>
                      <div className="flex justify-between items-center text-xs">
                        <span className={p2?.outcome === 'Win' ? 'font-bold text-emerald-400' : 'text-slate-300'}>
                          {p2?.entrant_name || 'TBD (Slot 2)'}
                        </span>
                        <span className="font-mono font-bold text-white">{p2?.score ?? '-'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>{new Date(m.scheduled_time).toLocaleString()}</span>
                      <span className="text-blue-400 font-semibold flex items-center group-hover:translate-x-0.5 transition-transform">
                        Match Center <ArrowLeft className="w-3 h-3 ml-1 rotate-180" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Prizes (Module 6B) */}
      {activeTab === 'prizes' && (
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
              <Gift className="w-4 h-4 text-emerald-400" />
              <span>Prize Pool & Placements (INR ₹)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Total Pool: {formatINR(prizes.reduce((sum, p) => sum + Number(p.prize_amount || 0), 0))}
            </span>
          </div>

          {prizes.length === 0 ? (
            <div className="text-center py-12 rounded-xl bg-slate-800/30 text-slate-500 text-xs">
              No prizes configured for this tournament yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {prizes.map((pz) => (
                <div
                  key={pz.prize_id}
                  className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                        #{pz.placement}
                      </span>
                      <span className="font-heading font-extrabold text-xl text-emerald-400">
                        {formatINR(pz.prize_amount)}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-white mb-1">
                      Placement #{pz.placement} Award
                    </h4>
                    <p className="text-xs text-slate-400 mb-4">{pz.description || 'Awarded placement prize'}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-700/60 text-xs">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Winner</span>
                    <span className="font-semibold text-slate-200">
                      {pz.winner_name ? (
                        <span className="text-emerald-400 flex items-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                          {pz.winner_name}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Not awarded yet</span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Sponsors (Module 6C & 6D) */}
      {activeTab === 'sponsors' && (
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              <span>Official Event Sponsors (TournamentSponsors)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Total Backing: {formatINR(sponsors.reduce((sum, s) => sum + Number(s.contribution_amount || 0), 0))}
            </span>
          </div>

          {sponsors.length === 0 ? (
            <div className="text-center py-12 rounded-xl bg-slate-800/30 text-slate-500 text-xs">
              No sponsors attached to this tournament yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sponsors.map((sp) => (
                <div
                  key={sp.sponsor_id}
                  className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-base text-white">{sp.sponsor_name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30">
                      {sp.country || 'Global'}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Contribution:</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {formatINR(sp.contribution_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Sponsored Date:</span>
                      <span>{new Date(sp.sponsored_on).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
