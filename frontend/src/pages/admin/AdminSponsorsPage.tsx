import React, { useEffect, useState } from 'react';
import { financialApi } from '../../api/financialApi';
import { tournamentsApi } from '../../api/tournamentsApi';
import { Sponsor, Tournament, TournamentSponsor } from '../../types';
import { formatINR } from '../../utils/currency';
import {
  Building2,
  Plus,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  IndianRupee,
  Mail,
  Globe,
  Calendar,
  Layers,
  Link as LinkIcon
} from 'lucide-react';

export const AdminSponsorsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sponsors' | 'tournaments'>('sponsors');
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Tournament Sponsorships Tab State
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | ''>('');
  const [tournamentSponsors, setTournamentSponsors] = useState<TournamentSponsor[]>([]);
  const [tournLoading, setTournLoading] = useState<boolean>(false);

  // Create/Edit Sponsor Modal State
  const [sponsorModalOpen, setSponsorModalOpen] = useState<boolean>(false);
  const [editingSponsorId, setEditingSponsorId] = useState<number | null>(null);
  const [sponsorName, setSponsorName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [country, setCountry] = useState<string>('India');
  const [sponsorSaving, setSponsorSaving] = useState<boolean>(false);
  const [sponsorError, setSponsorError] = useState<string | null>(null);

  // Attach Sponsor Modal State
  const [attachModalOpen, setAttachModalOpen] = useState<boolean>(false);
  const [attachSponsorId, setAttachSponsorId] = useState<number | ''>('');
  const [contributionAmount, setContributionAmount] = useState<number>(100000);
  const [attachLoading, setAttachLoading] = useState<boolean>(false);
  const [attachError, setAttachError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [spRes, trRes] = await Promise.all([
        financialApi.listSponsors(),
        tournamentsApi.listTournaments()
      ]);
      setSponsors(spRes.sponsors);
      setTournaments(trRes.tournaments);
      if (trRes.tournaments.length > 0 && selectedTournamentId === '') {
        setSelectedTournamentId(trRes.tournaments[0].tournament_id);
      }
    } catch (err) {
      console.error('Failed to load sponsors:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTournamentSponsors = async (tId: number) => {
    try {
      setTournLoading(true);
      const res = await financialApi.listTournamentSponsors(tId);
      setTournamentSponsors(res.sponsors);
    } catch (err) {
      console.error('Failed to load tournament sponsors:', err);
    } finally {
      setTournLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedTournamentId) {
      fetchTournamentSponsors(Number(selectedTournamentId));
    }
  }, [selectedTournamentId]);

  const handleOpenCreateSponsor = () => {
    setEditingSponsorId(null);
    setSponsorName('');
    setContactEmail('');
    setCountry('India');
    setSponsorError(null);
    setSponsorModalOpen(true);
  };

  const handleOpenEditSponsor = (s: Sponsor) => {
    setEditingSponsorId(s.sponsor_id);
    setSponsorName(s.sponsor_name);
    setContactEmail(s.contact_email || '');
    setCountry(s.country || 'India');
    setSponsorError(null);
    setSponsorModalOpen(true);
  };

  const handleSaveSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSponsorSaving(true);
      setSponsorError(null);

      if (editingSponsorId) {
        await financialApi.updateSponsor(editingSponsorId, {
          sponsor_name: sponsorName.trim(),
          contact_email: contactEmail.trim() || undefined,
          country: country.trim() || undefined
        });
      } else {
        await financialApi.createSponsor({
          sponsor_name: sponsorName.trim(),
          contact_email: contactEmail.trim() || undefined,
          country: country.trim() || undefined
        });
      }

      setSponsorModalOpen(false);
      fetchData();
    } catch (err: any) {
      setSponsorError(err.message || 'Failed to save sponsor.');
    } finally {
      setSponsorSaving(false);
    }
  };

  const handleDeleteSponsor = async (sponsorId: number) => {
    if (!window.confirm('Delete this sponsor? Note: cannot delete if active tournament sponsorships exist.')) return;
    try {
      await financialApi.deleteSponsor(sponsorId);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete sponsor.');
    }
  };

  const handleAttachSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournamentId || !attachSponsorId) return;

    try {
      setAttachLoading(true);
      setAttachError(null);
      await financialApi.addTournamentSponsor(Number(selectedTournamentId), {
        sponsor_id: Number(attachSponsorId),
        contribution_amount: Number(contributionAmount)
      });
      setAttachModalOpen(false);
      fetchTournamentSponsors(Number(selectedTournamentId));
      fetchData();
    } catch (err: any) {
      setAttachError(err.message || 'Failed to attach sponsor.');
    } finally {
      setAttachLoading(false);
    }
  };

  const handleRemoveTournamentSponsor = async (sponsorId: number) => {
    if (!selectedTournamentId) return;
    if (!window.confirm('Remove this sponsor attachment from this tournament?')) return;
    try {
      await financialApi.removeTournamentSponsor(Number(selectedTournamentId), sponsorId);
      fetchTournamentSponsors(Number(selectedTournamentId));
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove sponsor.');
    }
  };

  const totalSponsorFunding = sponsors.reduce(
    (sum, s) => sum + (Number(s.total_contribution) || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
            <Building2 className="w-4 h-4" />
            <span>Module 6C • Corporate Partners & Funding</span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-white">
            Sponsors & Partner Contributions (INR ₹)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Maintain sponsor directories, attach brand partners to tournaments, and track INR capital contributions.
          </p>
        </div>

        <button
          onClick={handleOpenCreateSponsor}
          className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/20 transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Brand Sponsor</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Sponsored Capital</span>
            <IndianRupee className="w-4 h-4 text-purple-400" />
          </div>
          <div className="font-heading text-2xl font-extrabold text-purple-400 mt-2">
            {formatINR(totalSponsorFunding)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Aggregate contributions across tournaments</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Registered Brand Partners</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="font-heading text-2xl font-extrabold text-white mt-2">
            {sponsors.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Active corporate entities</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Database Normalization</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-heading text-2xl font-extrabold text-emerald-400 mt-2">
            M:N Bridge
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Composite PK (tournament_id, sponsor_id)</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-6">
        <button
          onClick={() => setActiveTab('sponsors')}
          className={`pb-3 text-sm font-semibold transition-colors flex items-center space-x-2 border-b-2 ${
            activeTab === 'sponsors'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Sponsor Directory ({sponsors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tournaments')}
          className={`pb-3 text-sm font-semibold transition-colors flex items-center space-x-2 border-b-2 ${
            activeTab === 'tournaments'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          <span>Tournament Sponsorships (M:N)</span>
        </button>
      </div>

      {/* Tab 1: Sponsors Directory */}
      {activeTab === 'sponsors' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-slate-400">Loading sponsors from database...</p>
            </div>
          ) : sponsors.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
              <p className="text-sm font-medium text-slate-400">No brand sponsors registered yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sponsors.map((s) => (
                <div
                  key={s.sponsor_id}
                  className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-slate-500">ID #{s.sponsor_id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/70 text-purple-400 border border-purple-500/30">
                        {s.tournament_count || 0} Tournament(s)
                      </span>
                    </div>

                    <h3 className="font-heading text-lg font-bold text-white mb-2">
                      {s.sponsor_name}
                    </h3>

                    <div className="space-y-1 text-xs text-slate-400">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>{s.contact_email || 'No email provided'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Globe className="w-3.5 h-3.5 text-slate-500" />
                        <span>{s.country || 'Global'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Funded</div>
                      <div className="font-mono font-bold text-sm text-purple-400">
                        {formatINR(s.total_contribution || 0)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEditSponsor(s)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Edit sponsor"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSponsor(s.sponsor_id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        title="Delete sponsor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Tournament Sponsorships */}
      {activeTab === 'tournaments' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-400 font-semibold uppercase">Select Tournament:</span>
              <select
                value={selectedTournamentId}
                onChange={(e) => setSelectedTournamentId(Number(e.target.value))}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-purple-500"
              >
                {tournaments.map((t) => (
                  <option key={t.tournament_id} value={t.tournament_id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setAttachError(null);
                setAttachSponsorId('');
                setContributionAmount(100000);
                setAttachModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/20 transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Attach Sponsor to Tournament</span>
            </button>
          </div>

          {tournLoading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-400">Loading sponsorships...</p>
            </div>
          ) : tournamentSponsors.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500">
              <p className="text-sm font-medium text-slate-400">No sponsors attached to this tournament yet.</p>
              <p className="text-xs text-slate-500 mt-1">Attach a corporate brand sponsor above to allocate INR funding.</p>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Sponsor Brand</th>
                    <th className="px-4 py-3">Contribution (INR)</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Country</th>
                    <th className="px-4 py-3">Sponsored Date</th>
                    <th className="px-4 py-3 rounded-r-lg text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {tournamentSponsors.map((ts) => (
                    <tr key={ts.sponsor_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-white">
                        {ts.sponsor_name}
                      </td>

                      <td className="px-4 py-3 font-mono font-bold text-purple-400 text-sm">
                        {formatINR(ts.contribution_amount)}
                      </td>

                      <td className="px-4 py-3 text-slate-400">
                        {ts.contact_email || '—'}
                      </td>

                      <td className="px-4 py-3 text-slate-400">
                        {ts.country || 'Global'}
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-400">
                        {new Date(ts.sponsored_on).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRemoveTournamentSponsor(ts.sponsor_id)}
                          className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Sponsor Modal */}
      {sponsorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8">
            <button
              onClick={() => setSponsorModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold font-heading text-white mb-1 flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              <span>{editingSponsorId ? 'Edit Sponsor' : 'Add Brand Sponsor'}</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Register corporate partner profile in the central Sponsors catalog.
            </p>

            {sponsorError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{sponsorError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSponsor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Sponsor Name *
                </label>
                <input
                  type="text"
                  required
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  placeholder="e.g. Red Bull India, Intel, Razer"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="partnerships@brand.com"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. India"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSponsorModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sponsorSaving}
                  className="px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-all shadow-md shadow-purple-600/20"
                >
                  {sponsorSaving ? 'Saving...' : 'Save Sponsor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attach Sponsor Modal */}
      {attachModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8">
            <button
              onClick={() => setAttachModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold font-heading text-white mb-1 flex items-center space-x-2">
              <LinkIcon className="w-5 h-5 text-purple-400" />
              <span>Attach Sponsor to Tournament</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Allocate corporate sponsorship funding in Indian Rupees (₹).
            </p>

            {attachError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{attachError}</span>
              </div>
            )}

            <form onSubmit={handleAttachSponsor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Sponsor *
                </label>
                <select
                  required
                  value={attachSponsorId}
                  onChange={(e) => setAttachSponsorId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select a sponsor...</option>
                  {sponsors.map((s) => (
                    <option key={s.sponsor_id} value={s.sponsor_id}>
                      {s.sponsor_name} ({s.country || 'Global'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Contribution Amount (₹ INR) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={0.01}
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setAttachModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={attachLoading || !attachSponsorId}
                  className="px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-all shadow-md shadow-purple-600/20"
                >
                  {attachLoading ? 'Attaching...' : 'Confirm Sponsorship'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};