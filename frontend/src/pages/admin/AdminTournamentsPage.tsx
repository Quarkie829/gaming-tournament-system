import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tournamentsApi } from '../../api/tournamentsApi';
import { gamesApi } from '../../api/gamesApi';
import { Tournament, Game, TournamentStatus, ParticipationType } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Trophy,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Users,
  DollarSign,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';

export const AdminTournamentsPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedTournId, setSelectedTournId] = useState<number | null>(null);

  // Form Fields
  const [gameId, setGameId] = useState<number | ''>('');
  const [title, setTitle] = useState<string>('');
  const [format, setFormat] = useState<string>('Single Elimination');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [regDeadline, setRegDeadline] = useState<string>('');
  const [entryFee, setEntryFee] = useState<string>('0');
  const [maxParticipants, setMaxParticipants] = useState<string>('16');
  const [status, setStatus] = useState<TournamentStatus>('Upcoming');

  // Rules fields (TournamentRules entity)
  const [participationType, setParticipationType] = useState<ParticipationType>('Solo');
  const [teamSize, setTeamSize] = useState<string>('1');
  const [minAge, setMinAge] = useState<string>('16');
  const [regionRestriction, setRegionRestriction] = useState<string>('Global');
  const [rulesText, setRulesText] = useState<string>('');

  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchTournamentsAndGames = async () => {
    try {
      setLoading(true);
      const [tournRes, gamesRes] = await Promise.all([
        tournamentsApi.listTournaments(),
        gamesApi.listGames()
      ]);
      setTournaments(tournRes.tournaments);
      setGames(gamesRes.games);
      if (gamesRes.games.length > 0 && !gameId) {
        setGameId(gamesRes.games[0].game_id);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournamentsAndGames();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedTournId(null);
    setTitle('');
    setFormat('Single Elimination');
    setStartDate('2026-11-20T10:00');
    setEndDate('2026-11-25T18:00');
    setRegDeadline('2026-11-19T23:59');
    setEntryFee('0');
    setMaxParticipants('16');
    setStatus('Upcoming');
    setParticipationType('Solo');
    setTeamSize('1');
    setMinAge('16');
    setRegionRestriction('Global');
    setRulesText('Standard tournament competitive rules apply.');
    setFormError(null);
    setFormSuccess(null);
    setModalOpen(true);
  };

  const openEditModal = (t: Tournament) => {
    setModalMode('edit');
    setSelectedTournId(t.tournament_id);
    setGameId(t.game_id);
    setTitle(t.title);
    setFormat(t.format);
    setStartDate(t.start_date.substring(0, 16));
    setEndDate(t.end_date.substring(0, 16));
    setRegDeadline(t.registration_deadline.substring(0, 16));
    setEntryFee(String(t.entry_fee));
    setMaxParticipants(String(t.max_participants));
    setStatus(t.status);
    setParticipationType(t.participation_type || 'Solo');
    setTeamSize(String(t.team_size || 1));
    setMinAge(String(t.min_age || 16));
    setRegionRestriction(t.region_restriction || 'Global');
    setRulesText(t.rules_text || '');
    setFormError(null);
    setFormSuccess(null);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameId || !title.trim()) return;

    try {
      setFormLoading(true);
      setFormError(null);

      const payload = {
        game_id: Number(gameId),
        title: title.trim(),
        format: format.trim(),
        start_date: startDate.replace('T', ' ') + ':00',
        end_date: endDate.replace('T', ' ') + ':00',
        registration_deadline: regDeadline.replace('T', ' ') + ':00',
        entry_fee: parseFloat(entryFee) || 0,
        max_participants: parseInt(maxParticipants, 10) || 16,
        status,
        participation_type: participationType,
        team_size: participationType === 'Solo' ? 1 : parseInt(teamSize, 10) || 5,
        min_age: parseInt(minAge, 10) || null,
        region_restriction: regionRestriction.trim() || 'Global',
        rules_text: rulesText.trim()
      };

      if (modalMode === 'create') {
        await tournamentsApi.createTournament(payload);
        setFormSuccess('Tournament and rules created successfully in MySQL!');
      } else if (selectedTournId) {
        await tournamentsApi.updateTournament(selectedTournId, payload);
        setFormSuccess('Tournament updated successfully!');
      }

      await fetchTournamentsAndGames();
      setTimeout(() => {
        setModalOpen(false);
        setFormSuccess(null);
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (tournId: number, newStatus: string) => {
    try {
      await tournamentsApi.updateStatus(tournId, newStatus);
      await fetchTournamentsAndGames();
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const handleDelete = async (tournId: number) => {
    if (!window.confirm('Are you sure you want to delete this tournament? This will also remove rules.')) return;
    try {
      await tournamentsApi.deleteTournament(tournId);
      await fetchTournamentsAndGames();
    } catch (err: any) {
      alert(err.message || 'Failed to delete tournament.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Admin Dashboard</span>
          </Link>
          <h1 className="font-heading text-3xl font-extrabold text-white">
            Tournament & Rules Management (Module 2)
          </h1>
          <p className="text-sm text-slate-400">
            Create tournaments, configure constraints (dates, entry fees, limits), and manage 1:1 TournamentRules.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Tournament</span>
        </button>
      </div>

      {/* Tournaments Table */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">ID</th>
                <th className="px-4 py-3">Tournament / Game</th>
                <th className="px-4 py-3">Format / Type</th>
                <th className="px-4 py-3">Dates & Deadline</th>
                <th className="px-4 py-3">Slots</th>
                <th className="px-4 py-3">Fee</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {tournaments.map((t) => (
                <tr key={t.tournament_id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-500">#{t.tournament_id}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/tournaments/${t.tournament_id}`}
                      className="font-semibold text-white hover:text-blue-400 transition-colors"
                    >
                      {t.title}
                    </Link>
                    <div className="text-[10px] text-slate-400">{t.game_name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{t.format}</div>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        t.participation_type === 'Solo'
                          ? 'bg-emerald-950/60 text-emerald-400'
                          : 'bg-purple-950/60 text-purple-400'
                      }`}
                    >
                      {t.participation_type} ({t.team_size || 1})
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                    <div>Start: {new Date(t.start_date).toLocaleDateString()}</div>
                    <div className="text-amber-400">
                      Reg DL: {new Date(t.registration_deadline).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <span className="font-semibold text-white">{t.registered_count || 0}</span> /{' '}
                    {t.max_participants}
                  </td>
                  <td className="px-4 py-3 font-semibold text-emerald-400 font-mono">
                    {Number(t.entry_fee) === 0 ? 'FREE' : `$${Number(t.entry_fee).toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t.tournament_id, e.target.value)}
                      className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Upcoming">Upcoming</option>
                      <option value="Open">Open</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(t)}
                        className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                        title="Edit tournament and rules"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.tournament_id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        title="Delete tournament"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Tournament Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-heading text-white">
                  {modalMode === 'create' ? 'Create Tournament & Rules' : 'Edit Tournament & Rules'}
                </h2>
                <p className="text-xs text-slate-400">
                  Defines Tournament (dates, fee, limits) and 1:1 TournamentRules atomically
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-5">
              {/* Row 1: Game & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Game
                  </label>
                  <select
                    value={gameId}
                    onChange={(e) => setGameId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  >
                    {games.map((g) => (
                      <option key={g.game_id} value={g.game_id}>
                        {g.game_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Tournament Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Apex Legends Fall Masters"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Row 2: Format, Status, Fee, Slots */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full px-2 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Single Elimination">Single Elimination</option>
                    <option value="Double Elimination">Double Elimination</option>
                    <option value="Round Robin">Round Robin</option>
                    <option value="Swiss System">Swiss System</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Initial Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TournamentStatus)}
                    className="w-full px-2 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Open">Open</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Entry Fee ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={entryFee}
                    onChange={(e) => setEntryFee(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Max Slots
                  </label>
                  <input
                    type="number"
                    min="2"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Row 3: Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">
                    Reg Deadline (Checked by trigger)
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={regDeadline}
                    onChange={(e) => setRegDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Rules Divider */}
              <div className="pt-3 border-t border-slate-800">
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">
                  TournamentRules Entity Configuration (1:1 Relationship)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Participation Type
                    </label>
                    <select
                      value={participationType}
                      onChange={(e) => setParticipationType(e.target.value as ParticipationType)}
                      className="w-full px-2 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="Solo">Solo (1v1)</option>
                      <option value="Team">Team</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Team Size
                    </label>
                    <input
                      type="number"
                      min="1"
                      disabled={participationType === 'Solo'}
                      value={participationType === 'Solo' ? '1' : teamSize}
                      onChange={(e) => setTeamSize(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white disabled:opacity-50 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Min Age
                    </label>
                    <input
                      type="number"
                      min="10"
                      value={minAge}
                      onChange={(e) => setMinAge(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Region
                    </label>
                    <input
                      type="text"
                      value={regionRestriction}
                      onChange={(e) => setRegionRestriction(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Official Rules Text
                  </label>
                  <textarea
                    rows={3}
                    value={rulesText}
                    onChange={(e) => setRulesText(e.target.value)}
                    placeholder="Match format, ban lists, dispute handling rules..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20"
              >
                {formLoading ? 'Saving Tournament...' : modalMode === 'create' ? 'Create Tournament' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
