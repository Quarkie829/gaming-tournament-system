import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { registrationsApi } from '../api/registrationsApi';
import { matchesApi } from '../api/matchesApi';
import { financialApi } from '../api/financialApi';
import { teamsApi } from '../api/teamsApi';
import { Registration, Match, Payment, MatchDispute, TeamJoinRequest } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { formatINR } from '../utils/currency';
import {
  User as UserIcon,
  Mail,
  Globe,
  Calendar,
  Shield,
  Trophy,
  Edit2,
  X,
  AlertCircle,
  CheckCircle2,
  Swords,
  CreditCard,
  AlertTriangle,
  ExternalLink,
  IndianRupee,
  Receipt,
  Clock,
  RefreshCw,
  Users,
  Check,
  Send
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [disputes, setDisputes] = useState<MatchDispute[]>([]);
  const [invitations, setInvitations] = useState<TeamJoinRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<TeamJoinRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'registrations' | 'matches' | 'payments' | 'disputes' | 'team_invites'>('registrations');
  const [teamActionLoading, setTeamActionLoading] = useState<boolean>(false);
  const [teamFeedback, setTeamFeedback] = useState<string | null>(null);

  // Edit Profile Modal
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editUsername, setEditUsername] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editCountry, setEditCountry] = useState<string>('');
  const [editPassword, setEditPassword] = useState<string>('');
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Pay Entry Fee Modal
  const [payModalOpen, setPayModalOpen] = useState<boolean>(false);
  const [targetRegistration, setTargetRegistration] = useState<Registration | null>(null);
  const [payMethod, setPayMethod] = useState<string>('UPI');
  const [payRef, setPayRef] = useState<string>('');
  const [payLoading, setPayLoading] = useState<boolean>(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);

  const fetchAllUserData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [userRes, regRes, matchRes, payRes, dispRes, teamReqRes] = await Promise.all([
        authApi.getUserProfile(user.user_id),
        registrationsApi.getMyRegistrations(),
        matchesApi.listMatches(),
        financialApi.listPayments(),
        matchesApi.listDisputes(),
        teamsApi.getMyRequests()
      ]);

      setProfileData(userRes);
      const userRegs = regRes.registrations;
      setRegistrations(userRegs);
      setPayments(payRes.payments);
      setDisputes(dispRes.disputes);
      setInvitations(teamReqRes.invitations || []);
      setSentRequests(teamReqRes.sent_requests || []);

      // Filter matches where user/user's team is participant
      const myRegIds = new Set(userRegs.map((r) => r.registration_id));
      const myMatches = matchRes.matches.filter((m) =>
        (m.participants || []).some((p) => myRegIds.has(p.registration_id))
      );
      setMatches(myMatches);

      setEditUsername(userRes.user.username);
      setEditEmail(userRes.user.email);
      setEditCountry(userRes.user.country);
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToTeamRequest = async (requestId: number, action: 'accept' | 'decline' | 'cancel') => {
    try {
      setTeamActionLoading(true);
      setTeamFeedback(null);
      const res = await teamsApi.respondToRequest(requestId, action);
      setTeamFeedback(res.message);
      await fetchAllUserData();
      await refreshUser();
    } catch (err: any) {
      setTeamFeedback(err.message || 'Action failed.');
    } finally {
      setTeamActionLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUserData();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setEditLoading(true);
      setEditError(null);
      await authApi.updateUserProfile(user.user_id, {
        username: editUsername.trim(),
        email: editEmail.trim(),
        country: editCountry.trim(),
        password: editPassword.trim() || undefined
      });
      setEditSuccess('Profile updated successfully!');
      await refreshUser();
      await fetchAllUserData();
      setTimeout(() => {
        setEditModalOpen(false);
        setEditSuccess(null);
      }, 1200);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update profile.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancelRegistration = async (registrationId: number) => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) return;
    try {
      await registrationsApi.cancelRegistration(registrationId);
      await fetchAllUserData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel registration.');
    }
  };

  const handleOpenPayModal = (reg: Registration) => {
    setTargetRegistration(reg);
    setPayMethod('UPI');
    setPayRef(`TXN-INR-${Date.now().toString().slice(-6)}`);
    setPayError(null);
    setPaySuccess(null);
    setPayModalOpen(true);
  };

  const handlePayEntryFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRegistration) return;

    try {
      setPayLoading(true);
      setPayError(null);
      const fee = Number(targetRegistration.entry_fee) || 0;
      await financialApi.createPayment({
        registration_id: targetRegistration.registration_id,
        amount: fee,
        payment_method: payMethod,
        transaction_reference: payRef.trim() || undefined
      });
      setPaySuccess('Entry fee paid successfully in Indian Rupees (₹)!');
      await fetchAllUserData();
      setTimeout(() => {
        setPayModalOpen(false);
        setPaySuccess(null);
      }, 1400);
    } catch (err: any) {
      setPayError(err.message || 'Failed to process payment.');
    } finally {
      setPayLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-slate-400">Loading user profile, matches & financial records...</p>
      </div>
    );
  }

  const currentUser = profileData?.user || user;

  // Set of registration IDs that have successful payments
  const paidRegIds = new Set(
    payments.filter((p) => p.payment_status === 'Success').map((p) => p.registration_id)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile Header Card */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-heading font-bold text-2xl uppercase shadow-xl shadow-blue-600/20">
            {currentUser?.username?.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-heading text-3xl font-extrabold text-white">
                {currentUser?.username}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  currentUser?.role === 'admin'
                    ? 'bg-purple-950/80 text-purple-400 border border-purple-500/30'
                    : 'bg-blue-950/80 text-blue-400 border border-blue-500/30'
                }`}
              >
                {currentUser?.role}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentUser?.email}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentUser?.country || 'India'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1 font-mono text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {new Date(currentUser?.created_at).toLocaleDateString()}</span>
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setEditModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center space-x-2 self-start md:self-auto"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Main Player Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Player Hub Tabs (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-800 space-x-6 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('registrations')}
              className={`pb-3 text-sm font-semibold transition-colors flex items-center space-x-2 border-b-2 whitespace-nowrap ${
                activeTab === 'registrations'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Registrations ({registrations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('matches')}
              className={`pb-3 text-sm font-semibold transition-colors flex items-center space-x-2 border-b-2 whitespace-nowrap ${
                activeTab === 'matches'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Swords className="w-4 h-4" />
              <span>My Matches ({matches.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`pb-3 text-sm font-semibold transition-colors flex items-center space-x-2 border-b-2 whitespace-nowrap ${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Payment History ({payments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('disputes')}
              className={`pb-3 text-sm font-semibold transition-colors flex items-center space-x-2 border-b-2 whitespace-nowrap ${
                activeTab === 'disputes'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>My Disputes ({disputes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('team_invites')}
              className={`pb-3 text-sm font-semibold transition-colors flex items-center space-x-2 border-b-2 whitespace-nowrap ${
                activeTab === 'team_invites'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Team Invites & Requests</span>
              {invitations.filter((i) => i.status === 'Pending').length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500 text-white">
                  {invitations.filter((i) => i.status === 'Pending').length}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: REGISTRATIONS */}
          {activeTab === 'registrations' && (
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-blue-400" />
                    <span>Tournament Registrations (Module 4)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Track approved, pending, and fee payment statuses in Indian Rupees (₹)
                  </p>
                </div>
              </div>

              {registrations.length === 0 ? (
                <div className="text-center py-10 rounded-xl bg-slate-800/30 border border-slate-800 text-slate-500 text-xs">
                  You have not registered for any tournaments yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="px-4 py-3 rounded-l-lg">Tournament</th>
                        <th className="px-4 py-3">Entrant</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Fee & Payment</th>
                        <th className="px-4 py-3 rounded-r-lg text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {registrations.map((r) => {
                        const isSolo = r.user_id !== null;
                        const fee = Number(r.entry_fee) || 0;
                        const hasPaid = paidRegIds.has(r.registration_id);

                        return (
                          <tr key={r.registration_id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-white">{r.tournament_title}</div>
                              <div className="text-[10px] text-slate-500">
                                Game: {r.game_name} • Reg #{r.registration_id}
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              {isSolo ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                                  Solo Entry
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-400 border border-purple-500/20 text-[10px] font-semibold">
                                  Team: {r.team_name}
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3">
                              <StatusBadge status={r.status} />
                            </td>

                            <td className="px-4 py-3">
                              <div className="font-mono font-bold text-slate-200">
                                {formatINR(fee, { showFreeForZero: true })}
                              </div>
                              {fee > 0 && (
                                <div className="mt-0.5">
                                  {r.payment_status === 'Refunded' ? (
                                    <span className="text-[10px] text-cyan-400 font-semibold flex items-center space-x-1">
                                      <RefreshCw className="w-3 h-3" />
                                      <span>Fee Refunded</span>
                                    </span>
                                  ) : hasPaid ? (
                                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Paid (INR)</span>
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleOpenPayModal(r)}
                                      className="text-[10px] font-bold text-amber-400 hover:text-amber-300 uppercase underline"
                                    >
                                      Pay Now (₹)
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-3 text-right">
                              {r.status !== 'Cancelled' && r.can_cancel && (
                                <button
                                  onClick={() => handleCancelRegistration(r.registration_id)}
                                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                                  title="Cancel registration"
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY MATCHES */}
          {activeTab === 'matches' && (
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
                    <Swords className="w-4 h-4 text-blue-400" />
                    <span>My Scheduled Matches (Module 5)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Matches where you or your team are assigned to a competitive slot
                  </p>
                </div>
              </div>

              {matches.length === 0 ? (
                <div className="text-center py-10 rounded-xl bg-slate-800/30 border border-slate-800 text-slate-500 text-xs">
                  No matches currently scheduled for your approved entries.
                </div>
              ) : (
                <div className="space-y-3">
                  {matches.map((m) => {
                    const participants = m.participants || [];

                    return (
                      <div
                        key={m.match_id}
                        className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-500/20">
                              {m.round_name} • Match #{m.match_number}
                            </span>
                            <StatusBadge status={m.status} />
                          </div>
                          <div className="font-bold text-white text-sm">{m.tournament_title}</div>
                          <div className="flex items-center space-x-2 text-slate-400">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{new Date(m.scheduled_time).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Participants VS Score */}
                        <div className="flex items-center space-x-3 bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800">
                          {participants.length === 0 ? (
                            <span className="text-slate-500 italic">Slots TBD</span>
                          ) : (
                            participants.map((p, idx) => (
                              <React.Fragment key={p.registration_id}>
                                {idx > 0 && <span className="text-slate-500 font-bold">vs</span>}
                                <div className="text-center">
                                  <div className="font-semibold text-white">{p.entrant_name}</div>
                                  <div className="font-mono text-xs font-bold text-blue-400">
                                    {p.score !== null && p.score !== undefined ? `${p.score} pts` : '—'}
                                  </div>
                                </div>
                              </React.Fragment>
                            ))
                          )}
                        </div>

                        <Link
                          to={`/matches/${m.match_id}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-center text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition-all flex items-center justify-center space-x-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Match Center</span>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PAYMENT HISTORY */}
          {activeTab === 'payments' && (
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span>Payment History & Receipts (INR ₹)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Audit log of tournament entry fee transactions
                  </p>
                </div>
              </div>

              {payments.length === 0 ? (
                <div className="text-center py-10 rounded-xl bg-slate-800/30 border border-slate-800 text-slate-500 text-xs">
                  No payment records found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="px-4 py-3 rounded-l-lg">Txn Ref</th>
                        <th className="px-4 py-3">Tournament</th>
                        <th className="px-4 py-3">Amount (INR)</th>
                        <th className="px-4 py-3">Method</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3 rounded-r-lg text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {payments.map((p) => (
                        <tr key={p.payment_id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-white">
                            {p.transaction_reference}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-200">
                            {p.tournament_title}
                          </td>
                          <td className="px-4 py-3 font-mono font-extrabold text-emerald-400 text-sm">
                            {formatINR(p.amount)}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-400">
                            {p.payment_method}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-400">
                            {new Date(p.paid_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <StatusBadge status={p.payment_status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MY DISPUTES */}
          {activeTab === 'disputes' && (
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>My Match Disputes (Module 5D)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Claims raised on match scores or rules violations
                  </p>
                </div>
              </div>

              {disputes.length === 0 ? (
                <div className="text-center py-10 rounded-xl bg-slate-800/30 border border-slate-800 text-slate-500 text-xs">
                  No disputes raised.
                </div>
              ) : (
                <div className="space-y-3">
                  {disputes.map((d) => (
                    <div
                      key={d.dispute_id}
                      className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-500/20">
                            Dispute #{d.dispute_id}
                          </span>
                          <StatusBadge status={d.status} />
                          <span className="text-slate-400">
                            {d.round_name} • Match #{d.match_number} ({d.tournament_title})
                          </span>
                        </div>
                        <span className="font-mono text-slate-500">
                          {new Date(d.raised_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="bg-slate-900/80 p-3 rounded-lg text-slate-300">
                        <strong className="text-slate-400 block mb-1">Claim:</strong>
                        {d.reason}
                      </div>

                      <div className="flex justify-end pt-1">
                        <Link
                          to={`/matches/${d.match_id}`}
                          className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View Match Center</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: TEAM INVITATIONS & REQUESTS */}
          {activeTab === 'team_invites' && (
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-6">
              <div>
                <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Team Invites & Join Requests</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Accept or decline invitations sent by team captains, and track your pending join requests.
                </p>
              </div>

              {teamFeedback && (
                <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/30 text-xs text-purple-300 flex items-center justify-between">
                  <span>{teamFeedback}</span>
                  <button onClick={() => setTeamFeedback(null)} className="text-purple-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Sub-section 1: Invitations from Captains */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                    <Send className="w-3.5 h-3.5 text-blue-400 rotate-180" />
                    <span>Invitations Received ({invitations.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {invitations.filter((i) => i.status === 'Pending').length} awaiting response
                  </span>
                </div>

                {invitations.length === 0 ? (
                  <div className="text-center py-8 rounded-xl bg-slate-800/30 border border-slate-800 text-slate-500 text-xs">
                    No team invitations received yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {invitations.map((inv) => (
                      <div
                        key={inv.request_id}
                        className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/teams/${inv.team_id}`}
                              className="font-bold text-sm text-white hover:text-blue-400 transition-colors flex items-center space-x-1"
                            >
                              <span>{inv.team_name}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </Link>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950/80 text-purple-300 border border-purple-500/30">
                              Role: {inv.member_role}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                inv.status === 'Pending'
                                  ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                                  : inv.status === 'Accepted'
                                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                                  : inv.status === 'Declined'
                                  ? 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex items-center space-x-3">
                            <span>Captain: <strong className="text-slate-300">{inv.captain_username || 'Captain'}</strong></span>
                            <span>•</span>
                            <span>Invited: {new Date(inv.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {inv.status === 'Pending' && (
                          <div className="flex items-center space-x-2 self-end sm:self-auto">
                            <button
                              onClick={() => handleRespondToTeamRequest(inv.request_id, 'accept')}
                              disabled={teamActionLoading}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept & Join</span>
                            </button>
                            <button
                              onClick={() => handleRespondToTeamRequest(inv.request_id, 'decline')}
                              disabled={teamActionLoading}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-colors disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sub-section 2: Sent Requests by User */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                    <Send className="w-3.5 h-3.5 text-purple-400" />
                    <span>My Sent Join Requests ({sentRequests.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {sentRequests.filter((r) => r.status === 'Pending').length} pending captain review
                  </span>
                </div>

                {sentRequests.length === 0 ? (
                  <div className="text-center py-8 rounded-xl bg-slate-800/30 border border-slate-800 text-slate-500 text-xs">
                    You have not sent any team join requests yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {sentRequests.map((req) => (
                      <div
                        key={req.request_id}
                        className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/teams/${req.team_id}`}
                              className="font-bold text-sm text-white hover:text-purple-400 transition-colors flex items-center space-x-1"
                            >
                              <span>{req.team_name}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </Link>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                              Applied as: {req.member_role}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                req.status === 'Pending'
                                  ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                                  : req.status === 'Accepted'
                                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                                  : req.status === 'Declined'
                                  ? 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex items-center space-x-3">
                            <span>Captain: <strong className="text-slate-300">{req.captain_username || 'Captain'}</strong></span>
                            <span>•</span>
                            <span>Requested: {new Date(req.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {req.status === 'Pending' && (
                          <button
                            onClick={() => handleRespondToTeamRequest(req.request_id, 'cancel')}
                            disabled={teamActionLoading}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-slate-700 hover:border-rose-500/30 transition-colors self-end sm:self-auto disabled:opacity-50"
                          >
                            Cancel Request
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: User Teams & Information (1 Col) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Team Memberships</span>
            </h3>

            {profileData?.teams?.length === 0 ? (
              <p className="text-xs text-slate-400">Not a member of any teams yet.</p>
            ) : (
              <div className="space-y-2">
                {profileData?.teams?.map((t: any) => (
                  <Link
                    key={t.team_id}
                    to={`/teams/${t.team_id}`}
                    className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-white">{t.team_name}</div>
                      <div className="text-[10px] text-slate-400">Role: {t.member_role}</div>
                    </div>
                    {Boolean(t.is_captain) && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-500/30">
                        Captain
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pay Entry Fee Modal */}
      {payModalOpen && targetRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8">
            <button
              onClick={() => setPayModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold font-heading text-white mb-1 flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span>Pay Entry Fee (INR ₹)</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Complete tournament registration entry fee payment in Indian Rupees.
            </p>

            {payError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{payError}</span>
              </div>
            )}

            {paySuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{paySuccess}</span>
              </div>
            )}

            <form onSubmit={handlePayEntryFee} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                <div className="text-xs text-slate-400">Tournament:</div>
                <div className="font-bold text-white text-sm">{targetRegistration.tournament_title}</div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 mt-2 text-xs">
                  <span className="text-slate-400 font-semibold">Total Fee Due:</span>
                  <span className="font-heading font-extrabold text-base text-emerald-400">
                    {formatINR(targetRegistration.entry_fee || 0)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Payment Method
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                  <option value="NetBanking">Net Banking (HDFC, SBI, ICICI, Axis)</option>
                  <option value="Credit Card">Credit Card (Visa / Mastercard / RuPay)</option>
                  <option value="Debit Card">Debit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Transaction / UTR Reference
                </label>
                <input
                  type="text"
                  required
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-md shadow-emerald-600/20"
                >
                  {payLoading ? 'Processing...' : `Pay ${formatINR(targetRegistration.entry_fee || 0)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-8">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold font-heading text-white mb-4">Edit Profile</h2>

            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {editSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{editSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Change Password (Leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Min 6 characters..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={editLoading}
                className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-md shadow-blue-600/20"
              >
                {editLoading ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};