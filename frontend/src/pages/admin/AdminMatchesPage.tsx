import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { matchesApi } from '../../api/matchesApi';
import { tournamentsApi } from '../../api/tournamentsApi';
import { registrationsApi } from '../../api/registrationsApi';
import { Match, Tournament, Registration, MatchStatus } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Swords,
  Plus,
  Calendar,
  Clock,
  Trash2,
  ExternalLink,
  UserPlus,
  UserMinus,
  CheckCircle,
  AlertCircle,
  X,
  Filter
} from 'lucide-react';

export const AdminMatchesPage: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Create Match Modal State
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [newTournamentId, setNewTournamentId] = useState<number | ''>('');
  const [newRoundName, setNewRoundName] = useState<string>('Quarterfinals');
  const [newMatchNumber, setNewMatchNumber] = useState<number>(1);
  const [newScheduledTime, setNewScheduledTime] = useState<string>('');
  const [newStatus, setNewStatus] = useState<MatchStatus>('Scheduled');
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Participant Assignment Modal State
  const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
  const [targetMatch, setTargetMatch] = useState<Match | null>(null);
  const [eligibleRegistrations, setEligibleRegistrations] = useState<Registration[]>([]);
  const [selectedRegId, setSelectedRegId] = useState<number | ''>('');
  const [slotNumber, setSlotNumber] = useState<number>(1);
  const [assignLoading, setAssignLoading] = useState<boolean>(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const fetchMatchesAndTournaments = async () => {
    try {
      setLoading(true);
      const [tournRes, matchRes] = await Promise.all([
        tournamentsApi.listTournaments(),
        matchesApi.listMatches({
          tournament_id: selectedTournament ? parseInt(selectedTournament, 10) : undefined,
          status: selectedStatus || undefined
        })
      ]);
      setTournaments(tournRes.tournaments);
      setMatches(matchRes.matches);
    } catch (err) {
      console.error('Failed to load matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchesAndTournaments();
  }, [selectedTournament, selectedStatus]);

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTournamentId) {
      setFormError('Please select a tournament.');
      return;
    }
    if (!newScheduledTime) {
      setFormError('Please select scheduled date and time.');
      return;
    }

    try {
      setCreateLoading(true);
      setFormError(null);
      await matchesApi.createMatch({
        tournament_id: Number(newTournamentId),
        round_name: newRoundName.trim(),
        match_number: Number(newMatchNumber),
        scheduled_time: newScheduledTime,
        status: newStatus
      });
      setCreateModalOpen(false);
      setNewScheduledTime('');
      fetchMatchesAndTournaments();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create match.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenAssignModal = async (match: Match) => {
    setTargetMatch(match);
    setAssignError(null);
    setSelectedRegId('');
    setSlotNumber((match.participants?.length || 0) + 1);
    try {
      const res = await registrationsApi.listRegistrations({
        tournament_id: match.tournament_id,
        status: 'Approved'
      });
      // Filter out registrations already in this match
      const assignedIds = new Set((match.participants || []).map((p) => p.registration_id));
      const unassigned = res.registrations.filter((r: Registration) => !assignedIds.has(r.registration_id));
      setEligibleRegistrations(unassigned);
      setAssignModalOpen(true);
    } catch (err: any) {
      alert('Failed to load eligible registrations: ' + err.message);
    }
  };

  const handleAssignParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMatch || !selectedRegId) return;

    try {
      setAssignLoading(true);
      setAssignError(null);
      await matchesApi.addParticipant(targetMatch.match_id, {
        registration_id: Number(selectedRegId),
        slot_number: Number(slotNumber)
      });
      setAssignModalOpen(false);
      fetchMatchesAndTournaments();
    } catch (err: any) {
      setAssignError(err.message || 'Failed to assign participant.');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveParticipant = async (matchId: number, registrationId: number) => {
    if (!window.confirm('Remove participant from this match slot?')) return;
    try {
      await matchesApi.removeParticipant(matchId, registrationId);
      fetchMatchesAndTournaments();
    } catch (err: any) {
      alert(err.message || 'Failed to remove participant.');
    }
  };

  const handleStatusChange = async (matchId: number, status: string) => {
    try {
      await matchesApi.updateStatus(matchId, status);
      fetchMatchesAndTournaments();
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const handleDeleteMatch = async (matchId: number) => {
    if (!window.confirm('Delete this match and all its participant assignments?')) return;
    try {
      await matchesApi.deleteMatch(matchId);
      fetchMatchesAndTournaments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete match.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
            <Swords className="w-4 h-4" />
            <span>Module 5 • Match Scheduling & Results</span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-white">
            Matches & Bracket Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Schedule tournament matches, assign approved participants to slots, and monitor match progressions.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setCreateModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Match</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter By:</span>
          </div>

          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Tournaments</option>
            {tournaments.map((t) => (
              <option key={t.tournament_id} value={t.tournament_id}>
                {t.title}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Match Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Live">Live</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing {matches.length} scheduled match(es)
        </div>
      </div>

      {/* Matches List */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-400">Loading matches from database...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500">
          <Swords className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
          <p className="text-sm font-medium text-slate-400">No matches found for the selected filters.</p>
          <p className="text-xs text-slate-500 mt-1">Schedule a match using the button above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {matches.map((m) => {
            const participants = m.participants || [];

            return (
              <div
                key={m.match_id}
                className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Match Metadata */}
                <div className="space-y-2 lg:max-w-md">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-950/80 text-blue-400 border border-blue-500/30">
                      {m.round_name} • Match #{m.match_number}
                    </span>
                    <StatusBadge status={m.status} />
                    <span className="text-xs text-slate-500 font-mono">ID: {m.match_id}</span>
                  </div>

                  <h3 className="font-heading text-lg font-bold text-white">
                    {m.tournament_title}
                  </h3>

                  <div className="flex items-center space-x-4 text-xs text-slate-400">
                    <span className="flex items-center space-x-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(m.scheduled_time).toLocaleString()}</span>
                    </span>
                    <span>•</span>
                    <span className="text-slate-400">Game: {m.game_name}</span>
                  </div>
                </div>

                {/* Match Participants & Score */}
                <div className="flex-1 max-w-xl bg-slate-800/40 rounded-xl p-4 border border-slate-800">
                  <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    <span>Assigned Participants ({participants.length})</span>
                    <button
                      onClick={() => handleOpenAssignModal(m)}
                      className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Assign Slot</span>
                    </button>
                  </div>

                  {participants.length === 0 ? (
                    <div className="text-center py-3 text-xs text-slate-500 italic">
                      No participants assigned yet. Assign approved tournament registrations.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {participants.map((p) => (
                        <div
                          key={p.registration_id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-700/50 text-xs"
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[10px] font-bold text-slate-300">
                              {p.slot_number}
                            </span>
                            <span className="font-semibold text-white">
                              {p.entrant_name || `Registration #${p.registration_id}`}
                            </span>
                          </div>

                          <div className="flex items-center space-x-3">
                            {p.score !== null && p.score !== undefined ? (
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-white text-sm bg-slate-800 px-2 py-0.5 rounded">
                                  {p.score}
                                </span>
                                {p.outcome && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      p.outcome === 'Win'
                                        ? 'bg-emerald-950 text-emerald-400'
                                        : p.outcome === 'Loss'
                                        ? 'bg-rose-950 text-rose-400'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {p.outcome}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">No score</span>
                            )}

                            <button
                              onClick={() => handleRemoveParticipant(m.match_id, p.registration_id)}
                              className="text-slate-500 hover:text-rose-400 transition-colors"
                              title="Remove participant from slot"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Match Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 min-w-[160px]">
                  <Link
                    to={`/matches/${m.match_id}`}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-center text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition-all flex items-center justify-center space-x-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Match Center</span>
                  </Link>

                  <select
                    value={m.status}
                    onChange={(e) => handleStatusChange(m.match_id, e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Live">Live</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>

                  <button
                    onClick={() => handleDeleteMatch(m.match_id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 border border-rose-900/30 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Match Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold font-heading text-white mb-2 flex items-center space-x-2">
              <Swords className="w-5 h-5 text-blue-400" />
              <span>Schedule New Match</span>
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Create a match entity under a tournament. Participants can be slotted immediately or later.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateMatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tournament *
                </label>
                <select
                  required
                  value={newTournamentId}
                  onChange={(e) => setNewTournamentId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select a tournament...</option>
                  {tournaments.map((t) => (
                    <option key={t.tournament_id} value={t.tournament_id}>
                      {t.title} ({t.format})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Round Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoundName}
                    onChange={(e) => setNewRoundName(e.target.value)}
                    placeholder="e.g. Semifinals, Round 1"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Match Number *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newMatchNumber}
                    onChange={(e) => setNewMatchNumber(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Scheduled Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={newScheduledTime}
                  onChange={(e) => setNewScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Initial Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as MatchStatus)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Live">Live</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-md shadow-blue-600/20"
                >
                  {createLoading ? 'Creating...' : 'Create Match'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Participant Slot Assignment Modal */}
      {assignModalOpen && targetMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8">
            <button
              onClick={() => setAssignModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold font-heading text-white mb-1 flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-blue-400" />
              <span>Assign Entrant to Slot</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              {targetMatch.round_name} • Match #{targetMatch.match_number} ({targetMatch.tournament_title})
            </p>

            {assignError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{assignError}</span>
              </div>
            )}

            <form onSubmit={handleAssignParticipant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Slot Number (1 or 2)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={16}
                  value={slotNumber}
                  onChange={(e) => setSlotNumber(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Approved Entrant Registration
                </label>
                {eligibleRegistrations.length === 0 ? (
                  <p className="text-xs text-amber-400 bg-amber-950/40 p-3 rounded-xl border border-amber-500/30">
                    No unassigned approved registrations available for this tournament. Approve registrations in the Review Queue first.
                  </p>
                ) : (
                  <select
                    required
                    value={selectedRegId}
                    onChange={(e) => setSelectedRegId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Choose approved entrant...</option>
                    {eligibleRegistrations.map((r) => (
                      <option key={r.registration_id} value={r.registration_id}>
                        {r.team_name ? `Team: ${r.team_name}` : `Solo: ${r.player_username || r.username}`} (Reg #{r.registration_id})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading || eligibleRegistrations.length === 0 || !selectedRegId}
                  className="px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-md shadow-blue-600/20"
                >
                  {assignLoading ? 'Assigning...' : 'Assign Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};