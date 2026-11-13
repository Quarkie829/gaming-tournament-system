import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { matchesApi } from '../api/matchesApi';
import { Match, MatchDispute, ResultCorrection, MatchParticipantDetail } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import {
  Swords,
  Trophy,
  Calendar,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  X,
  History,
  Edit,
  UserCheck
} from 'lucide-react';

export const MatchDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, isAuthenticated } = useAuth();

  const [match, setMatch] = useState<Match | null>(null);
  const [disputes, setDisputes] = useState<MatchDispute[]>([]);
  const [corrections, setCorrections] = useState<ResultCorrection[]>([]);
  const [userParticipant, setUserParticipant] = useState<{ is_participant: boolean; registration_id: number | null }>({
    is_participant: false,
    registration_id: null
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Dispute Modal
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputeError, setDisputeError] = useState<string | null>(null);

  // Admin Record Scores Modal
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [scoresData, setScoresData] = useState<{ [regId: number]: { score: number; outcome: string } }>({});
  const [markCompleted, setMarkCompleted] = useState(true);
  const [adminActionLoading, setAdminActionLoading] = useState(false);

  // Admin Correct Score Modal
  const [correctModalOpen, setCorrectModalOpen] = useState(false);
  const [selectedRegForCorrection, setSelectedRegForCorrection] = useState<number | ''>('');
  const [newScoreVal, setNewScoreVal] = useState<number | ''>('');
  const [linkedDisputeId, setLinkedDisputeId] = useState<number | ''>('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await matchesApi.getMatch(parseInt(id, 10));
      setMatch(res.match);
      setDisputes(res.disputes);
      setCorrections(res.corrections);
      setUserParticipant(res.user_participant);

      // Pre-fill score modal data
      const initialScores: any = {};
      (res.match.participants || []).forEach((p) => {
        initialScores[p.registration_id] = {
          score: p.score ?? 0,
          outcome: p.outcome || 'Win'
        };
      });
      setScoresData(initialScores);
    } catch (err) {
      console.error('Failed to load match:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id, user]);

  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !disputeReason.trim()) return;

    try {
      setDisputeLoading(true);
      setDisputeError(null);
      await matchesApi.raiseDispute(parseInt(id, 10), {
        reason: disputeReason.trim(),
        registration_id: userParticipant.registration_id || undefined
      });
      setFeedback({ type: 'success', text: 'Dispute submitted successfully and placed in review queue.' });
      setDisputeModalOpen(false);
      setDisputeReason('');
      await fetchDetails();
    } catch (err: any) {
      setDisputeError(err.message || 'Failed to raise dispute.');
    } finally {
      setDisputeLoading(false);
    }
  };

  const handleRecordScores = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !match?.participants) return;

    try {
      setAdminActionLoading(true);
      const payload = match.participants.map((p) => ({
        registration_id: p.registration_id,
        score: scoresData[p.registration_id]?.score ?? 0,
        outcome: scoresData[p.registration_id]?.outcome || 'Win'
      }));

      await matchesApi.recordResults(parseInt(id, 10), {
        results: payload,
        mark_completed: markCompleted
      });

      setFeedback({ type: 'success', text: 'Scores and match results recorded successfully.' });
      setScoreModalOpen(false);
      await fetchDetails();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to record results.' });
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleCorrectResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedRegForCorrection || newScoreVal === '') return;

    try {
      setAdminActionLoading(true);
      await matchesApi.correctResult(parseInt(id, 10), {
        registration_id: Number(selectedRegForCorrection),
        new_score: Number(newScoreVal),
        dispute_id: linkedDisputeId ? Number(linkedDisputeId) : null
      });

      setFeedback({ type: 'success', text: 'Score corrected and audit trail preserved!' });
      setCorrectModalOpen(false);
      setSelectedRegForCorrection('');
      setNewScoreVal('');
      setLinkedDisputeId('');
      await fetchDetails();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to correct result.' });
    } finally {
      setAdminActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-slate-400">Loading match center & scoreboard...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Match Not Found</h2>
        <Link to="/matches" className="text-sm text-blue-400 hover:underline">
          Return to matches schedule
        </Link>
      </div>
    );
  }

  const p1 = match.participants?.find((p) => p.slot_number === 1);
  const p2 = match.participants?.find((p) => p.slot_number === 2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <Link
        to="/matches"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Matches</span>
      </Link>

      {/* Header Banner */}
      <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-blue-600/20 text-blue-400 border border-blue-500/30">
                {match.game_name}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {match.round_name} • Match #{match.match_number}
              </span>
              <StatusBadge status={match.status} />
            </div>

            <h1 className="font-heading text-3xl font-extrabold text-white">
              {match.tournament_title}
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Scheduled: {new Date(match.scheduled_time).toLocaleString()}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {isAuthenticated && userParticipant.is_participant && (
              <button
                onClick={() => setDisputeModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 transition-colors flex items-center space-x-1.5"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Raise Match Dispute</span>
              </button>
            )}

            {isAdmin && (
              <>
                <button
                  onClick={() => setScoreModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-all flex items-center space-x-1.5"
                >
                  <Edit className="w-4 h-4" />
                  <span>Record Scores</span>
                </button>
                <button
                  onClick={() => setCorrectModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-purple-300 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 transition-all flex items-center space-x-1.5"
                >
                  <History className="w-4 h-4" />
                  <span>Correct Result</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center space-x-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main Scoreboard Card */}
      <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-6">
          {/* Entrant 1 */}
          <div className="md:col-span-2 space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
              Slot 1
            </span>
            <div className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
              {p1?.entrant_name || 'TBD (Slot 1)'}
            </div>
            {p1?.outcome && (
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  p1.outcome === 'Win'
                    ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {p1.outcome}
              </span>
            )}
          </div>

          {/* Versus & Scores */}
          <div className="md:col-span-1 space-y-2">
            <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">VS</div>
            <div className="flex items-center justify-center space-x-3 font-mono font-extrabold text-4xl sm:text-5xl text-white">
              <span className={p1?.outcome === 'Win' ? 'text-emerald-400' : 'text-slate-300'}>
                {p1?.score ?? '-'}
              </span>
              <span className="text-slate-600">:</span>
              <span className={p2?.outcome === 'Win' ? 'text-emerald-400' : 'text-slate-300'}>
                {p2?.score ?? '-'}
              </span>
            </div>
          </div>

          {/* Entrant 2 */}
          <div className="md:col-span-2 space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
              Slot 2
            </span>
            <div className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
              {p2?.entrant_name || 'TBD (Slot 2)'}
            </div>
            {p2?.outcome && (
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  p2.outcome === 'Win'
                    ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {p2.outcome}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Participants, Disputes, Result Corrections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Match Participants List */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-blue-400" />
            <span>Assigned Participants (MatchParticipants)</span>
          </h3>

          <div className="space-y-3">
            {match.participants?.map((p) => (
              <div
                key={p.registration_id}
                className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-sm text-white">
                    Slot #{p.slot_number}: {p.entrant_name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Registration ID: #{p.registration_id}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-base text-white">
                    {p.score !== null ? `Score: ${p.score}` : 'No score'}
                  </div>
                  {p.outcome && (
                    <span className="text-[10px] uppercase font-bold text-slate-400">{p.outcome}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disputes Section */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Match Disputes (MatchDisputes)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">{disputes.length} dispute(s)</span>
          </div>

          {disputes.length === 0 ? (
            <div className="text-center py-8 rounded-xl bg-slate-800/30 text-slate-500 text-xs">
              No disputes raised for this match.
            </div>
          ) : (
            <div className="space-y-3">
              {disputes.map((d) => (
                <div
                  key={d.dispute_id}
                  className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200">
                      Dispute #{d.dispute_id} • Raised by {d.entrant_name}
                    </span>
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="text-xs text-slate-300 italic bg-black/30 p-2.5 rounded-lg border border-slate-700/40">
                    "{d.reason}"
                  </p>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Raised: {new Date(d.raised_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Result Corrections Audit Log (Section 13 Query) */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
          <History className="w-4 h-4 text-purple-400" />
          <span>Result Corrections Audit Log (ResultCorrections)</span>
        </h3>

        {corrections.length === 0 ? (
          <div className="text-center py-6 rounded-xl bg-slate-800/30 text-slate-500 text-xs">
            No score corrections recorded for this match.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Correction ID</th>
                  <th className="px-4 py-3 font-sans">Entrant</th>
                  <th className="px-4 py-3 text-center">Old Score</th>
                  <th className="px-4 py-3 text-center">New Score</th>
                  <th className="px-4 py-3">Dispute Ref</th>
                  <th className="px-4 py-3 rounded-r-lg">Corrected At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {corrections.map((c) => (
                  <tr key={c.correction_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-slate-500">#{c.correction_id}</td>
                    <td className="px-4 py-3 font-sans font-semibold text-white">{c.entrant_name}</td>
                    <td className="px-4 py-3 text-center text-rose-400 font-bold">{c.old_score}</td>
                    <td className="px-4 py-3 text-center text-emerald-400 font-bold">{c.new_score}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {c.dispute_id ? `#${c.dispute_id}` : 'Manual Correction'}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(c.corrected_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Raise Dispute Modal */}
      {disputeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-8">
            <button
              onClick={() => setDisputeModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-heading text-white">Raise Match Dispute</h2>
                <p className="text-xs text-slate-400">Eligible participant submission</p>
              </div>
            </div>

            {disputeError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{disputeError}</span>
              </div>
            )}

            <form onSubmit={handleRaiseDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Dispute Reason & Proof Description
                </label>
                <textarea
                  rows={4}
                  required
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Detail the issue: round score error, rule violation, disconnect handling..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Disputes are reviewed by administrators. Legitimate errors will result in a recorded score correction in the audit log.
              </p>

              <button
                type="submit"
                disabled={disputeLoading || !disputeReason.trim()}
                className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 transition-all shadow-lg shadow-amber-600/20"
              >
                {disputeLoading ? 'Submitting Dispute...' : 'Submit Dispute'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Record Scores Modal */}
      {scoreModalOpen && match.participants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-8">
            <button
              onClick={() => setScoreModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold font-heading text-white mb-2">Record Match Results</h2>
            <p className="text-xs text-slate-400 mb-6">Enter scores and outcomes for match participants</p>

            <form onSubmit={handleRecordScores} className="space-y-4">
              {match.participants.map((p) => (
                <div key={p.registration_id} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                  <div className="font-semibold text-xs text-white">
                    Slot #{p.slot_number}: {p.entrant_name}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                        Score
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={scoresData[p.registration_id]?.score ?? 0}
                        onChange={(e) =>
                          setScoresData({
                            ...scoresData,
                            [p.registration_id]: {
                              ...scoresData[p.registration_id],
                              score: parseInt(e.target.value, 10) || 0
                            }
                          })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                        Outcome
                      </label>
                      <select
                        value={scoresData[p.registration_id]?.outcome || 'Win'}
                        onChange={(e) =>
                          setScoresData({
                            ...scoresData,
                            [p.registration_id]: {
                              ...scoresData[p.registration_id],
                              outcome: e.target.value
                            }
                          })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="Win">Win</option>
                        <option value="Loss">Loss</option>
                        <option value="Draw">Draw</option>
                        <option value="Forfeit">Forfeit</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={markCompleted}
                  onChange={(e) => setMarkCompleted(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Set match status to "Completed"</span>
              </label>

              <button
                type="submit"
                disabled={adminActionLoading}
                className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20"
              >
                {adminActionLoading ? 'Saving Results...' : 'Save Match Results'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Correct Result Modal */}
      {correctModalOpen && match.participants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-8">
            <button
              onClick={() => setCorrectModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold font-heading text-white mb-2">Result Correction</h2>
            <p className="text-xs text-slate-400 mb-6">
              Updates score in MatchResults while preserving old score in ResultCorrections
            </p>

            <form onSubmit={handleCorrectResult} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Participant
                </label>
                <select
                  required
                  value={selectedRegForCorrection}
                  onChange={(e) => setSelectedRegForCorrection(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Choose participant...</option>
                  {match.participants.map((p) => (
                    <option key={p.registration_id} value={p.registration_id}>
                      {p.entrant_name} (Current Score: {p.score ?? 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  New Corrected Score
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newScoreVal}
                  onChange={(e) => setNewScoreVal(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Link Dispute (Optional)
                </label>
                <select
                  value={linkedDisputeId}
                  onChange={(e) => setLinkedDisputeId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="">No linked dispute (manual adjustment)</option>
                  {disputes.map((d) => (
                    <option key={d.dispute_id} value={d.dispute_id}>
                      Dispute #{d.dispute_id} ({d.entrant_name}) - {d.status}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={adminActionLoading || !selectedRegForCorrection || newScoreVal === ''}
                className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-all shadow-lg shadow-purple-600/20"
              >
                {adminActionLoading ? 'Saving Correction...' : 'Commit Result Correction'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
