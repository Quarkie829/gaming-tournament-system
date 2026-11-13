import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { matchesApi } from '../api/matchesApi';
import { tournamentsApi } from '../api/tournamentsApi';
import { Match, Tournament } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Swords, Calendar, Clock, Trophy, Filter, ArrowRight, ShieldAlert } from 'lucide-react';

export const MatchesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tournParam = searchParams.get('tournament_id');

  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedTournament, setSelectedTournament] = useState<string>(tournParam || '');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<string>('');

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const [matchesRes, tournsRes] = await Promise.all([
        matchesApi.listMatches({
          tournament_id: selectedTournament ? parseInt(selectedTournament, 10) : undefined,
          status: selectedStatus || undefined,
          round_name: selectedRound || undefined
        }),
        tournamentsApi.listTournaments()
      ]);
      setMatches(matchesRes.matches);
      setTournaments(tournsRes.tournaments);
    } catch (err) {
      console.error('Failed to load matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [selectedTournament, selectedStatus, selectedRound]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">
          <Swords className="w-4 h-4" />
          <span>Module 5 • Esports Matches & Brackets</span>
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white">
          Tournament Matches & Schedules
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Explore scheduled, live, and completed competitive matchups, inspect scores, and track match resolutions.
        </p>
      </div>

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
            Match Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Live">Live Now</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Round
          </label>
          <input
            type="text"
            value={selectedRound}
            onChange={(e) => setSelectedRound(e.target.value)}
            placeholder="e.g. Quarterfinals, Finals"
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Matches Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-48 rounded-2xl bg-slate-900/40 animate-pulse"></div>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-20 rounded-2xl bg-slate-900/40 border border-slate-800">
          <Swords className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No matches found</h3>
          <p className="text-xs text-slate-400">
            No matches scheduled matching the selected filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((m) => {
            const p1 = m.participants?.find((p) => p.slot_number === 1);
            const p2 = m.participants?.find((p) => p.slot_number === 2);

            return (
              <div
                key={m.match_id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Meta */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-blue-400">
                      {m.round_name} • Match #{m.match_number}
                    </span>
                    <StatusBadge status={m.status} />
                  </div>

                  <div className="text-xs text-slate-400 line-clamp-1 mb-4 font-medium">
                    {m.tournament_title}
                  </div>

                  {/* Versus Matchup Box */}
                  <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2.5 mb-4">
                    {/* Participant 1 */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 truncate">
                        <span className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-300">
                          1
                        </span>
                        <span
                          className={`font-semibold truncate ${
                            p1?.outcome === 'Win' ? 'text-emerald-400' : 'text-slate-200'
                          }`}
                        >
                          {p1?.entrant_name || 'TBD (Slot 1)'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 font-mono">
                        {p1?.score !== null && p1?.score !== undefined && (
                          <span className="font-bold text-sm text-white px-1.5 py-0.5 rounded bg-slate-900">
                            {p1.score}
                          </span>
                        )}
                        {p1?.outcome && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              p1.outcome === 'Win'
                                ? 'bg-emerald-950/70 text-emerald-400'
                                : 'bg-slate-900 text-slate-500'
                            }`}
                          >
                            {p1.outcome}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-slate-700/40"></div>

                    {/* Participant 2 */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 truncate">
                        <span className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-300">
                          2
                        </span>
                        <span
                          className={`font-semibold truncate ${
                            p2?.outcome === 'Win' ? 'text-emerald-400' : 'text-slate-200'
                          }`}
                        >
                          {p2?.entrant_name || 'TBD (Slot 2)'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 font-mono">
                        {p2?.score !== null && p2?.score !== undefined && (
                          <span className="font-bold text-sm text-white px-1.5 py-0.5 rounded bg-slate-900">
                            {p2.score}
                          </span>
                        )}
                        {p2?.outcome && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              p2.outcome === 'Win'
                                ? 'bg-emerald-950/70 text-emerald-400'
                                : 'bg-slate-900 text-slate-500'
                            }`}
                          >
                            {p2.outcome}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(m.scheduled_time).toLocaleString()}</span>
                  </span>

                  <Link
                    to={`/matches/${m.match_id}`}
                    className="inline-flex items-center font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <span>Match Center</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
