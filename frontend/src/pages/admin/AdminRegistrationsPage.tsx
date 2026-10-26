import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { registrationsApi } from '../../api/registrationsApi';
import { tournamentsApi } from '../../api/tournamentsApi';
import { Registration, Tournament } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import {
  CheckCircle,
  XCircle,
  Filter,
  Users,
  User,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock
} from 'lucide-react';

export const AdminRegistrationsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchRegistrationsAndTournaments = async () => {
    try {
      setLoading(true);
      const [regRes, tournRes] = await Promise.all([
        registrationsApi.listAllRegistrations({
          tournament_id: selectedTournament ? parseInt(selectedTournament, 10) : undefined,
          status: selectedStatus || undefined,
          type: (selectedType as any) || undefined
        }),
        tournamentsApi.listTournaments()
      ]);
      setRegistrations(regRes.registrations);
      setTournaments(tournRes.tournaments);
    } catch (err: any) {
      console.error('Failed to load registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrationsAndTournaments();
  }, [selectedTournament, selectedStatus, selectedType]);

  const handleUpdateStatus = async (regId: number, newStatus: string) => {
    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await registrationsApi.updateStatus(regId, newStatus);
      setFeedback({ type: 'success', text: res.message });
      await fetchRegistrationsAndTournaments();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update status.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <Link
          to="/admin"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Admin Dashboard</span>
        </Link>
        <h1 className="font-heading text-3xl font-extrabold text-white">
          Registrations Review Queue (Module 4)
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review, approve, reject, or audit solo and team registrations from the unified <code>Registrations</code> table.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
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

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Tournament Filter
          </label>
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Tournaments</option>
            {tournaments.map((t) => (
              <option key={t.tournament_id} value={t.tournament_id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Status Filter
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Entrant Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Entrant Types</option>
            <option value="Solo">Solo Players</option>
            <option value="Team">Teams</option>
          </select>
        </div>
      </div>

      {/* Registrations Review Table */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{registrations.length} registration record(s)</span>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Loading registrations...</p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs rounded-xl bg-slate-800/30">
            No registrations match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Reg ID</th>
                  <th className="px-4 py-3">Tournament</th>
                  <th className="px-4 py-3">Entrant (Solo / Team)</th>
                  <th className="px-4 py-3">Submission Date</th>
                  <th className="px-4 py-3">Current Status</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {registrations.map((r) => {
                  const isSolo = r.user_id !== null;

                  return (
                    <tr key={r.registration_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-500">#{r.registration_id}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{r.tournament_title}</div>
                        <div className="text-[10px] text-slate-400">
                          {r.game_name} • {r.format}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isSolo ? (
                          <div>
                            <div className="font-semibold text-emerald-400 flex items-center space-x-1.5">
                              <User className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{r.player_username || r.username}</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {r.player_email} ({r.player_country || 'Global'})
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold text-purple-400 flex items-center space-x-1.5">
                              <Users className="w-3.5 h-3.5 text-purple-400" />
                              <span>{r.team_name}</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Captain: {r.captain_username}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">
                        {new Date(r.registration_date).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {r.status !== 'Approved' && (
                            <button
                              onClick={() => handleUpdateStatus(r.registration_id, 'Approved')}
                              disabled={actionLoading}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 transition-colors"
                            >
                              Approve
                            </button>
                          )}

                          {r.status !== 'Rejected' && (
                            <button
                              onClick={() => handleUpdateStatus(r.registration_id, 'Rejected')}
                              disabled={actionLoading}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 transition-colors"
                            >
                              Reject
                            </button>
                          )}

                          {r.status !== 'Pending' && (
                            <button
                              onClick={() => handleUpdateStatus(r.registration_id, 'Pending')}
                              disabled={actionLoading}
                              className="px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                              title="Reset to Pending"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
