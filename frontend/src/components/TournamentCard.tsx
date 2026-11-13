import React from 'react';
import { Link } from 'react-router-dom';
import { Tournament } from '../types';
import { StatusBadge } from './StatusBadge';
import { Calendar, Users, Trophy, DollarSign, ArrowRight } from 'lucide-react';
import { formatINR } from '../utils/currency';

interface TournamentCardProps {
  tournament: Tournament;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({ tournament }) => {
  const registered = tournament.registered_count || 0;
  const max = tournament.max_participants || 16;
  const percent = Math.min(100, Math.round((registered / max) * 100));

  const isSolo = tournament.participation_type === 'Solo';

  return (
    <div className="group relative rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 flex flex-col justify-between overflow-hidden">
      {/* Top Banner Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 opacity-70 group-hover:opacity-100 transition-opacity"></div>

      <div className="p-6">
        {/* Header Tags */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 text-blue-400 border border-blue-500/20">
            {tournament.game_name || 'Game'}
          </span>
          <StatusBadge status={tournament.status} />
        </div>

        {/* Title */}
        <h3 className="font-heading text-xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1 mb-2">
          {tournament.title}
        </h3>

        {/* Meta badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-slate-400">
          <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/50">
            {tournament.format}
          </span>
          <span
            className={`px-2 py-0.5 rounded font-medium ${
              isSolo
                ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30'
                : 'bg-purple-950/50 text-purple-300 border border-purple-500/30'
            }`}
          >
            {isSolo ? 'Solo 1v1' : `Team (${tournament.team_size || 5} players)`}
          </span>
        </div>

        {/* Info Grid */}
        <div className="space-y-2 text-xs text-slate-300 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Starts
            </span>
            <span className="font-medium text-slate-200">
              {new Date(tournament.start_date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center">
              <DollarSign className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Entry Fee
            </span>
            <span className="font-semibold text-emerald-400">
              {formatINR(tournament.entry_fee, { showFreeForZero: true })}
            </span>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 flex items-center">
              <Users className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Participants
            </span>
            <span className="font-mono text-slate-300">
              <span className="font-semibold text-white">{registered}</span> / {max}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percent >= 100
                  ? 'bg-rose-500'
                  : percent >= 75
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${percent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-6 py-4 bg-slate-900/40 border-t border-slate-800/60 flex items-center justify-between">
        <span className="text-[11px] text-slate-500">
          Deadline: {new Date(tournament.registration_deadline).toLocaleDateString()}
        </span>
        <Link
          to={`/tournaments/${tournament.tournament_id}`}
          className="inline-flex items-center text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          View Details
          <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
