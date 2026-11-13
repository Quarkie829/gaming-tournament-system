import React, { useEffect, useState } from 'react';
import { financialApi } from '../../api/financialApi';
import { tournamentsApi } from '../../api/tournamentsApi';
import { registrationsApi } from '../../api/registrationsApi';
import { Prize, Tournament, Registration } from '../../types';
import { formatINR } from '../../utils/currency';
import {
  Trophy,
  Filter,
  Plus,
  Trash2,
  Award,
  X,
  AlertCircle,
  IndianRupee,
  Medal,
  CheckCircle2
} from 'lucide-react';

export const AdminPrizesPage: React.FC = () => {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTournament, setSelectedTournament] = useState<string>('');

  // Create Prize Modal State
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [newTournamentId, setNewTournamentId] = useState<number | ''>('');
  const [newPlacement, setNewPlacement] = useState<number>(1);
  const [newAmount, setNewAmount] = useState<number>(50000);
  const [newDescription, setNewDescription] = useState<string>('Grand Champion Cash Prize');
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Award Prize Modal State
  const [awardModalOpen, setAwardModalOpen] = useState<boolean>(false);
  const [targetPrize, setTargetPrize] = useState<Prize | null>(null);
  const [eligibleRegistrations, setEligibleRegistrations] = useState<Registration[]>([]);
  const [awardedRegId, setAwardedRegId] = useState<number | ''>('');
  const [awardLoading, setAwardLoading] = useState<boolean>(false);
  const [awardError, setAwardError] = useState<string | null>(null);

  const fetchPrizesAndTournaments = async () => {
    try {
      setLoading(true);
      const [tournRes, prizeRes] = await Promise.all([
        tournamentsApi.listTournaments(),
        financialApi.listPrizes({
          tournament_id: selectedTournament ? parseInt(selectedTournament, 10) : undefined
        })
      ]);
      setTournaments(tournRes.tournaments);
      setPrizes(prizeRes.prizes);
    } catch (err) {
      console.error('Failed to load prizes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrizesAndTournaments();
  }, [selectedTournament]);

  const handleCreatePrize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTournamentId) {
      setCreateError('Please select a tournament.');
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);
      await financialApi.createPrize({
        tournament_id: Number(newTournamentId),
        placement: Number(newPlacement),
        prize_amount: Number(newAmount),
        description: newDescription.trim() || undefined
      });
      setCreateModalOpen(false);
      fetchPrizesAndTournaments();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create prize tier.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenAwardModal = async (prize: Prize) => {
    setTargetPrize(prize);
    setAwardError(null);
    setAwardedRegId(prize.awarded_registration_id || '');
    try {
      const res = await registrationsApi.listRegistrations({
        tournament_id: prize.tournament_id,
        status: 'Approved'
      });
      setEligibleRegistrations(res.registrations);
      setAwardModalOpen(true);
    } catch (err: any) {
      alert('Failed to load approved entrants: ' + err.message);
    }
  };

  const handleAwardPrize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrize) return;

    try {
      setAwardLoading(true);
      setAwardError(null);
      await financialApi.awardPrize(
        targetPrize.prize_id,
        awardedRegId ? Number(awardedRegId) : null
      );
      setAwardModalOpen(false);
      fetchPrizesAndTournaments();
    } catch (err: any) {
      setAwardError(err.message || 'Failed to award prize.');
    } finally {
      setAwardLoading(false);
    }
  };

  const handleDeletePrize = async (prizeId: number) => {
    if (!window.confirm('Delete this prize tier?')) return;
    try {
      await financialApi.deletePrize(prizeId);
      fetchPrizesAndTournaments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete prize.');
    }
  };

  const totalPrizePool = prizes.reduce((sum, p) => sum + Number(p.prize_amount), 0);
  const totalAwarded = prizes
    .filter((p) => p.awarded_registration_id !== null)
    .reduce((sum, p) => sum + Number(p.prize_amount), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
            <Trophy className="w-4 h-4" />
            <span>Module 6B • Prize Pools & Awards</span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-white">
            Tournament Prize Management (INR ₹)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure placement tiers, allocate INR reward pools, and award winners.
          </p>
        </div>

        <button
          onClick={() => {
            setCreateError(null);
            setCreateModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-600/20 transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Prize Tier</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Configured Prize Pool</span>
            <IndianRupee className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-heading text-2xl font-extrabold text-amber-400 mt-2">
            {formatINR(totalPrizePool)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Across all matching tournament tiers</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Awarded Payouts</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-heading text-2xl font-extrabold text-emerald-400 mt-2">
            {formatINR(totalAwarded)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Allocated to verified tournament winners</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Placement Tiers</span>
            <Medal className="w-4 h-4 text-purple-400" />
          </div>
          <div className="font-heading text-2xl font-extrabold text-white mt-2">
            {prizes.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Active placement rewards</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Tournament:</span>
          </div>

          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Tournaments</option>
            {tournaments.map((t) => (
              <option key={t.tournament_id} value={t.tournament_id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          {prizes.length} placement tier(s)
        </div>
      </div>

      {/* Prizes Table */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-400">Loading prizes from MySQL database...</p>
        </div>
      ) : prizes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
          <p className="text-sm font-medium text-slate-400">No prize tiers defined yet.</p>
          <p className="text-xs text-slate-500 mt-1">Configure placements and cash rewards in INR using the button above.</p>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Placement</th>
                <th className="px-4 py-3">Tournament</th>
                <th className="px-4 py-3">Reward Amount (INR)</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Awarded Winner</th>
                <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {prizes.map((p) => {
                const isAwarded = p.awarded_registration_id !== null;

                return (
                  <tr key={p.prize_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <span className="w-7 h-7 rounded-lg bg-amber-950/70 border border-amber-500/40 text-amber-400 flex items-center justify-center font-heading font-extrabold text-sm">
                        #{p.placement}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{p.tournament_title}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Prize ID: {p.prize_id}</div>
                    </td>

                    <td className="px-4 py-3 font-mono font-extrabold text-amber-400 text-sm">
                      {formatINR(p.prize_amount)}
                    </td>

                    <td className="px-4 py-3 text-slate-300">
                      {p.description || <span className="text-slate-500 italic">None</span>}
                    </td>

                    <td className="px-4 py-3">
                      {isAwarded ? (
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-semibold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{p.winner_name || `Reg #${p.awarded_registration_id}`}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">Unawarded</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenAwardModal(p)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-400 hover:bg-amber-950/40 border border-amber-500/30 transition-colors flex items-center space-x-1"
                        >
                          <Award className="w-3 h-3" />
                          <span>{isAwarded ? 'Reassign' : 'Award'}</span>
                        </button>

                        <button
                          onClick={() => handleDeletePrize(p.prize_id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                          title="Delete prize tier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Prize Tier Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold font-heading text-white mb-1 flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Add Prize Tier (INR ₹)</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Define placement ranking and prize pool in Indian Rupees. Placements must be unique per tournament.
            </p>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePrize} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tournament *
                </label>
                <select
                  required
                  value={newTournamentId}
                  onChange={(e) => setNewTournamentId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select a tournament...</option>
                  {tournaments.map((t) => (
                    <option key={t.tournament_id} value={t.tournament_id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Placement Rank *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newPlacement}
                    onChange={(e) => setNewPlacement(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-500">1 for 1st place, 2 for 2nd</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Prize Amount (₹ INR) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={0.01}
                    value={newAmount}
                    onChange={(e) => setNewAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Description / Title
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g. 1st Place Champion & Ring"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
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
                  className="px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 transition-all shadow-md shadow-amber-600/20"
                >
                  {createLoading ? 'Saving...' : 'Add Prize Tier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Award Prize Modal */}
      {awardModalOpen && targetPrize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8">
            <button
              onClick={() => setAwardModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold font-heading text-white mb-1 flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Award Prize #{targetPrize.placement}</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Assign reward of <strong className="text-amber-400">{formatINR(targetPrize.prize_amount)}</strong> to an approved entrant of <strong>{targetPrize.tournament_title}</strong>.
            </p>

            {awardError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{awardError}</span>
              </div>
            )}

            <form onSubmit={handleAwardPrize} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Winner Registration
                </label>
                <select
                  value={awardedRegId}
                  onChange={(e) => setAwardedRegId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Clear / Unawarded --</option>
                  {eligibleRegistrations.map((r) => (
                    <option key={r.registration_id} value={r.registration_id}>
                      {r.team_name ? `Team: ${r.team_name}` : `Solo: ${r.player_username || r.username}`} (Reg #{r.registration_id})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Enforces database constraint: winner registration must belong to this tournament.
                </span>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setAwardModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={awardLoading}
                  className="px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 transition-all shadow-md shadow-amber-600/20"
                >
                  {awardLoading ? 'Saving...' : 'Confirm Award'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};