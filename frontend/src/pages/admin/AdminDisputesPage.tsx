import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { matchesApi } from '../../api/matchesApi';
import { tournamentsApi } from '../../api/tournamentsApi';
import { MatchDispute, Tournament, DisputeStatus } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import {
  AlertTriangle,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Edit3,
  X,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';

export const AdminDisputesPage: React.FC = () => {
  const [disputes, setDisputes] = useState<MatchDispute[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Correction Modal State
  const [correctionModalOpen, setCorrectionModalOpen] = useState<boolean>(false);
  const [targetDispute, setTargetDispute] = useState<MatchDispute | null>(null);
  const [newScore, setNewScore] = useState<number>(0);
  const [resolveDisputeCheck, setResolveDisputeCheck] = useState<boolean>(true);
  const [correctionLoading, setCorrectionLoading] = useState<boolean>(false);
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  const fetchDisputesAndTournaments = async () => {
    try {
      setLoading(true);
      const [tournRes, dispRes] = await Promise.all([
        tournamentsApi.listTournaments(),
        matchesApi.listDisputes({
          tournament_id: selectedTournament ? parseInt(selectedTournament, 10) : undefined,
          status: selectedStatus || undefined
        })
      ]);
      setTournaments(tournRes.tournaments);
      setDisputes(dispRes.disputes);
    } catch (err) {
      console.error('Failed to load disputes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputesAndTournaments();
  }, [selectedTournament, selectedStatus]);

  const handleStatusChange = async (disputeId: number, status: DisputeStatus) => {
    try {
      await matchesApi.updateDisputeStatus(disputeId, status);
      fetchDisputesAndTournaments();
    } catch (err: any) {
      alert(err.message || 'Failed to update dispute status.');
    }
  };

  const handleOpenCorrection = (dispute: MatchDispute) => {
    setTargetDispute(dispute);
    setNewScore(0);
    setResolveDisputeCheck(true);
    setCorrectionError(null);
    setCorrectionModalOpen(true);
  };

  const handleApplyCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDispute) return;

    try {
      setCorrectionLoading(true);
      setCorrectionError(null);

      // 1. Submit result correction
      await matchesApi.correctResult(targetDispute.match_id, {
        registration_id: targetDispute.registration_id,
        new_score: Number(newScore),
        dispute_id: targetDispute.dispute_id
      });

      // 2. Optionally resolve dispute
      if (resolveDisputeCheck) {
        await matchesApi.updateDisputeStatus(targetDispute.dispute_id, 'Resolved');
      }

      setCorrectionModalOpen(false);
      fetchDisputesAndTournaments();
    } catch (err: any) {
      setCorrectionError(err.message || 'Failed to apply correction.');
    } finally {
      setCorrectionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
          <ShieldAlert className="w-4 h-4" />
          <span>Module 5D & 5E • Conflict Resolution</span>
        </div>
        <h1 className="font-heading text-3xl font-extrabold text-white">
          Match Disputes & Score Corrections
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review participant dispute claims, investigate outcomes, and log immutable score corrections.
        </p>
      </div>

      {/* Filters */}
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
            <option value="">All Dispute Statuses</option>
            <option value="Open">Open</option>
            <option value="Under Review">Under Review</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          {disputes.length} dispute record(s)
        </div>
      </div>

      {/* Dispute Records */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-400">Loading dispute records from database...</p>
        </div>
      ) : disputes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
          <p className="text-sm font-medium text-slate-400">No disputes found matching current filters.</p>
          <p className="text-xs text-slate-500 mt-1">Disputes raised by participants in Match Center will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => (
            <div
              key={d.dispute_id}
              className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950/80 text-amber-400 border border-amber-500/30">
                    Dispute #{d.dispute_id}
                  </span>
                  <StatusBadge status={d.status} />
                  <span className="text-xs text-slate-500 font-mono">
                    Raised: {new Date(d.raised_at).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={d.status}
                    onChange={(e) => handleStatusChange(d.dispute_id, e.target.value as DisputeStatus)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Open">Open</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                  </select>

                  <Link
                    to={`/matches/${d.match_id}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="View Match Center"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Match & Entrant Context */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800/40 p-4 rounded-xl text-xs">
                <div>
                  <div className="text-slate-400 font-semibold mb-1">Tournament & Match:</div>
                  <div className="text-white font-bold">{d.tournament_title}</div>
                  <div className="text-slate-400 mt-0.5">
                    {d.round_name} • Match #{d.match_number} (Match ID: {d.match_id})
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 font-semibold mb-1">Disputing Entrant:</div>
                  <div className="text-amber-400 font-bold">{d.entrant_name}</div>
                  <div className="text-slate-400 mt-0.5">
                    Registration ID: #{d.registration_id}
                  </div>
                </div>
              </div>

              {/* Dispute Reason */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
                <span className="font-semibold text-slate-300 block mb-1">Dispute Reason / Claim:</span>
                <p className="text-slate-300 whitespace-pre-wrap">{d.reason}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => handleOpenCorrection(d)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-amber-400 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 transition-all flex items-center space-x-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Log Result Correction & Resolve</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Result Correction Modal */}
      {correctionModalOpen && targetDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8">
            <button
              onClick={() => setCorrectionModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold font-heading text-white mb-1 flex items-center space-x-2">
              <Edit3 className="w-5 h-5 text-amber-400" />
              <span>Correct Score (Module 5E)</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Apply audited score adjustment linked to Dispute #{targetDispute.dispute_id}.
            </p>

            {correctionError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{correctionError}</span>
              </div>
            )}

            <form onSubmit={handleApplyCorrection} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-800/60 text-xs space-y-1">
                <div className="text-slate-400">Entrant: <strong className="text-white">{targetDispute.entrant_name}</strong></div>
                <div className="text-slate-400">Match: <span className="text-white">{targetDispute.round_name} • #{targetDispute.match_number}</span></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  New Adjusted Score
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newScore}
                  onChange={(e) => setNewScore(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="resolveCheck"
                  checked={resolveDisputeCheck}
                  onChange={(e) => setResolveDisputeCheck(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                />
                <label htmlFor="resolveCheck" className="text-xs text-slate-300 select-none cursor-pointer">
                  Automatically mark Dispute #{targetDispute.dispute_id} as <strong>Resolved</strong>
                </label>
              </div>

              <div className="pt-3 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setCorrectionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={correctionLoading}
                  className="px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 transition-all shadow-md shadow-amber-600/20"
                >
                  {correctionLoading ? 'Applying...' : 'Apply Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};