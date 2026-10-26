import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tournamentsApi } from '../api/tournamentsApi';
import { gamesApi } from '../api/gamesApi';
import { Tournament, Game } from '../types';
import { TournamentCard } from '../components/TournamentCard';
import { Trophy, Shield, Users, Database, Sparkles, Flame, CheckCircle, ArrowRight } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [featuredTournaments, setFeaturedTournaments] = useState<Tournament[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tournRes, gamesRes] = await Promise.all([
          tournamentsApi.listTournaments({ status: 'Open' }),
          gamesApi.listGames()
        ]);
        setFeaturedTournaments(tournRes.tournaments.slice(0, 3));
        setGames(gamesRes.games);
      } catch (err) {
        console.error('Error fetching homepage data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/3 w-[450px] h-[250px] bg-indigo-600/15 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-950/70 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Official DBMS Project Platform • MySQL 8.0</span>
          </div>

          <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-none mb-6">
            COMPETITIVE GAMING <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              MANAGEMENT SYSTEM
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed mb-10">
            A unified, relational tournament infrastructure solving traditional spreadsheet chaos.
            Features strict exclusive-arc solo/team registration, real-time roster validation, and automated slot limits.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/tournaments"
              className="px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/25 transition-all transform hover:-translate-y-0.5 flex items-center space-x-2"
            >
              <Trophy className="w-4 h-4" />
              <span>Browse Tournaments</span>
            </Link>

            <Link
              to="/teams"
              className="px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all flex items-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>Explore Teams</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Database Innovations Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-2">
            Engineered Database Architecture
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Meeting strict 3NF criteria and database constraints specified in the DBMS specification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-heading">Unified Registrations</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Eliminates duplicate logic by merging solo and team entries with an exclusive-arc check constraint:
            </p>
            <code className="block p-2 rounded-lg bg-black/50 text-[11px] text-blue-300 font-mono">
              CHECK ((user_id IS NULL) &lt;&gt; (team_id IS NULL))
            </code>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-heading">Zero-Anomaly Constraints</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Unique compound indexes and triggers prevent duplicate signups, enforce registration deadlines, and maintain full status audit histories without row deletions.
            </p>
            <code className="block p-2 rounded-lg bg-black/50 text-[11px] text-purple-300 font-mono">
              UNIQUE(tournament_id, user_id/team_id)
            </code>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-heading">Team Roster Integrity</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Many-to-many relationship resolved through TeamMembers with captain permissions, role tracking, and team size validation at tournament entry time.
            </p>
            <code className="block p-2 rounded-lg bg-black/50 text-[11px] text-emerald-300 font-mono">
              PK: (team_id, user_id)
            </code>
          </div>
        </div>
      </section>

      {/* Featured Tournaments */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-2 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Flame className="w-4 h-4 text-rose-500" />
              <span>Live & Open for Registration</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white">
              Featured Tournaments
            </h2>
          </div>

          <Link
            to="/tournaments"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 rounded-2xl bg-slate-900/40 animate-pulse"></div>
            ))}
          </div>
        ) : featuredTournaments.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400">
            No open tournaments currently active.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredTournaments.map((t) => (
              <TournamentCard key={t.tournament_id} tournament={t} />
            ))}
          </div>
        )}
      </section>

      {/* Games Catalog Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-2">
            Supported Esports Titles
          </h2>
          <p className="text-sm text-slate-400">
            Official games catalog from the database specification
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {games.map((g) => (
            <div
              key={g.game_id}
              className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 text-center transition-all group"
            >
              <div className="font-heading font-bold text-sm text-white group-hover:text-blue-400 transition-colors mb-1">
                {g.game_name}
              </div>
              <div className="text-[11px] text-slate-400">{g.genre}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">{g.platform}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
