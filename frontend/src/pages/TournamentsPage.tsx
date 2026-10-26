import React, { useEffect, useState } from 'react';
import { tournamentsApi } from '../api/tournamentsApi';
import { gamesApi } from '../api/gamesApi';
import { Tournament, Game } from '../types';
import { TournamentCard } from '../components/TournamentCard';
import { Search, Filter, Trophy, X } from 'lucide-react';

export const TournamentsPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const res = await tournamentsApi.listTournaments({
        search: search.trim() || undefined,
        game_id: selectedGame ? parseInt(selectedGame, 10) : undefined,
        status: selectedStatus || undefined,
        participation_type: selectedType || undefined
      });
      setTournaments(res.tournaments);
    } catch (err) {
      console.error('Failed to load tournaments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    gamesApi.listGames().then((res) => setGames(res.games)).catch(console.error);
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchTournaments();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [search, selectedGame, selectedStatus, selectedType]);

  const clearFilters = () => {
    setSearch('');
    setSelectedGame('');
    setSelectedStatus('');
    setSelectedType('');
  };

  const hasActiveFilters = search || selectedGame || selectedStatus || selectedType;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
          <Trophy className="w-4 h-4" />
          <span>Esports Events</span>
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white">
          Browse Tournaments
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Explore upcoming and live tournaments across games, inspect rules, and register your team or solo entry.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tournament or game..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Game Filter */}
          <div>
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Games</option>
              {games.map((g) => (
                <option key={g.game_id} value={g.game_id}>
                  {g.game_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Formats (Solo / Team)</option>
              <option value="Solo">Solo (1v1)</option>
              <option value="Team">Team</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
            <span className="text-slate-400">
              Filtering results ({tournaments.length} found)
            </span>
            <button
              onClick={clearFilters}
              className="flex items-center space-x-1 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-72 rounded-2xl bg-slate-900/40 animate-pulse"></div>
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-20 rounded-2xl bg-slate-900/40 border border-slate-800">
          <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No tournaments found</h3>
          <p className="text-xs text-slate-400">
            Try adjusting your search criteria or clear the filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((t) => (
            <TournamentCard key={t.tournament_id} tournament={t} />
          ))}
        </div>
      )}
    </div>
  );
};
