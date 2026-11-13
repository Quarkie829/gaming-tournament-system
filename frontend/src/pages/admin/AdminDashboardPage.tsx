import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tournamentsApi } from '../../api/tournamentsApi';
import { formatINR } from '../../utils/currency';
import {
  Shield,
  Trophy,
  Users,
  Clock,
  CheckCircle,
  Database,
  ArrowRight,
  Plus,
  Gamepad2,
  Swords,
  AlertTriangle,
  CreditCard,
  Building2,
  IndianRupee,
  ShieldAlert
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await tournamentsApi.getStats();
        setStats(res);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-slate-400">Loading administrator metrics from MySQL database...</p>
      </div>
    );
  }

  const m = stats?.metrics || {};
  const breakdown = stats?.registration_breakdown || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
            <Shield className="w-4 h-4" />
            <span>Administrator Control Center • Modules 1–6</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white">
            System Overview & Metrics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time aggregates querying the relational MySQL database with all financial figures in Indian Rupees (₹).
          </p>
        </div>

        {/* Quick Admin Actions */}
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/tournaments"
            className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tournaments</span>
          </Link>
          <Link
            to="/admin/matches"
            className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all flex items-center space-x-1.5"
          >
            <Swords className="w-4 h-4" />
            <span>Matches</span>
          </Link>
          <Link
            to="/admin/registrations"
            className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-purple-300 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 transition-all flex items-center space-x-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Registrations ({m.pending_registrations || 0})</span>
          </Link>
        </div>
      </div>

      {/* Primary Metric Cards Grid (6 Modules) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Total Tournaments</div>
          <div className="font-heading text-3xl font-extrabold text-white">
            {m.total_tournaments || 0}
          </div>
          <div className="text-[10px] text-blue-400 mt-1">{m.open_tournaments || 0} Open for Registration</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Registered Users & Teams</div>
          <div className="font-heading text-3xl font-extrabold text-white">
            {m.total_users || 0} <span className="text-lg text-slate-500 font-normal">/ {m.total_teams || 0} tms</span>
          </div>
          <div className="text-[10px] text-purple-400 mt-1">Users & Teams tables</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Total Matches Scheduled</div>
          <div className="font-heading text-3xl font-extrabold text-indigo-400">
            {m.total_matches || 0}
          </div>
          <div className="text-[10px] text-indigo-400 mt-1">Matches & MatchParticipants</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Open Disputes</div>
          <div className="font-heading text-3xl font-extrabold text-amber-400">
            {m.open_disputes || 0}
          </div>
          <div className="text-[10px] text-amber-400 mt-1">Pending review & correction</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Net Entry Fee Revenue</div>
          <div className="font-heading text-2xl font-extrabold text-emerald-400">
            {formatINR(m.total_revenue || 0)}
          </div>
          <div className="text-[10px] text-emerald-500 mt-1">Successful Payments in INR (₹)</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Total Prize Pool Allocated</div>
          <div className="font-heading text-2xl font-extrabold text-amber-400">
            {formatINR(m.total_prize_pool || 0)}
          </div>
          <div className="text-[10px] text-amber-500 mt-1">Configured Prize Tiers in INR (₹)</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Pending Review Queue</div>
          <div className="font-heading text-3xl font-extrabold text-rose-400">
            {m.pending_registrations || 0}
          </div>
          <div className="text-[10px] text-rose-400 mt-1">{m.approved_registrations || 0} Approved entries</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Sponsors & Brand Partners</div>
          <div className="font-heading text-3xl font-extrabold text-purple-400">
            {m.total_sponsors || 0}
          </div>
          <div className="text-[10px] text-purple-400 mt-1">Sponsors & TournamentSponsors</div>
        </div>
      </div>

      {/* Solo vs Team Query Result Breakdown */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span>Solo vs Team Registrations Breakdown (DBMS Section 13 Query)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Aggregated directly from the unified <code>Registrations</code> table:
              <code> SUM(r.user_id IS NOT NULL) AS solo_entries, SUM(r.team_id IS NOT NULL) AS team_entries</code>
            </p>
          </div>
        </div>

        {breakdown.length === 0 ? (
          <div className="text-center py-8 rounded-xl bg-slate-800/30 text-slate-500 text-xs">
            No registrations to aggregate.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Tournament Title</th>
                  <th className="px-4 py-3 text-center">Solo Entrants</th>
                  <th className="px-4 py-3 text-center">Team Entrants</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Total Active Entries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                {breakdown.map((row: any, i: number) => {
                  const solo = Number(row.solo_entries) || 0;
                  const team = Number(row.team_entries) || 0;

                  return (
                    <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-sans font-semibold text-white">
                        {row.title}
                      </td>
                      <td className="px-4 py-3 text-center text-emerald-400 font-bold">
                        {solo}
                      </td>
                      <td className="px-4 py-3 text-center text-purple-400 font-bold">
                        {team}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-200 font-bold">
                        {solo + team}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Navigation Shortcut Cards Across All 6 Modules */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
          Management Portals (Modules 1–6)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Module 2: Tournaments */}
          <Link
            to="/admin/tournaments"
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-3">
                <Trophy className="w-5 h-5" />
              </div>
              <h4 className="font-heading text-base font-bold text-white group-hover:text-blue-400 transition-colors mb-1">
                Tournaments & Rules
              </h4>
              <p className="text-xs text-slate-400">
                Formats, dates, deadlines, entry fees, and 1:1 TournamentRules.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-400">
              <span>Manage Tournaments</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Module 4: Registrations */}
          <Link
            to="/admin/registrations"
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-3">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h4 className="font-heading text-base font-bold text-white group-hover:text-purple-400 transition-colors mb-1">
                Registrations Queue
              </h4>
              <p className="text-xs text-slate-400">
                Approve or reject participant registrations and view slot limits.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-purple-400">
              <span>Review Queue</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Module 5A & 5B: Matches */}
          <Link
            to="/admin/matches"
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-3">
                <Swords className="w-5 h-5" />
              </div>
              <h4 className="font-heading text-base font-bold text-white group-hover:text-indigo-400 transition-colors mb-1">
                Matches & Brackets
              </h4>
              <p className="text-xs text-slate-400">
                Schedule rounds, assign approved participants to slots, and track scores.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-400">
              <span>Manage Matches</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Module 5D & 5E: Disputes */}
          <Link
            to="/admin/disputes"
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center mb-3">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h4 className="font-heading text-base font-bold text-white group-hover:text-amber-400 transition-colors mb-1">
                Disputes & Corrections
              </h4>
              <p className="text-xs text-slate-400">
                Review player claims and log audited score corrections.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-amber-400">
              <span>Manage Disputes</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Module 6A: Payments */}
          <Link
            to="/admin/payments"
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-3">
                <CreditCard className="w-5 h-5" />
              </div>
              <h4 className="font-heading text-base font-bold text-white group-hover:text-emerald-400 transition-colors mb-1">
                Payments & Ledger
              </h4>
              <p className="text-xs text-slate-400">
                Audit entry fee collections in INR (₹), update statuses, and issue refunds.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-400">
              <span>Financial Ledger</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Module 6B: Prizes */}
          <Link
            to="/admin/prizes"
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center mb-3">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <h4 className="font-heading text-base font-bold text-white group-hover:text-amber-400 transition-colors mb-1">
                Prize Pools & Awards
              </h4>
              <p className="text-xs text-slate-400">
                Configure placement rewards in INR (₹) and award champion registrations.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-amber-400">
              <span>Prize Distribution</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Module 6C: Sponsors */}
          <Link
            to="/admin/sponsors"
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-3">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="font-heading text-base font-bold text-white group-hover:text-purple-400 transition-colors mb-1">
                Sponsors & Partners
              </h4>
              <p className="text-xs text-slate-400">
                Maintain brand catalog and link sponsorship capital to tournaments.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-purple-400">
              <span>Manage Sponsors</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Module 2: Games */}
          <Link
            to="/admin/games"
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-3">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <h4 className="font-heading text-base font-bold text-white group-hover:text-emerald-400 transition-colors mb-1">
                Games Catalog
              </h4>
              <p className="text-xs text-slate-400">
                Supported game titles, genres, platforms, and publisher metadata.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-400">
              <span>Manage Games</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};