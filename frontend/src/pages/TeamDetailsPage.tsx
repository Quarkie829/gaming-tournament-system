import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { teamsApi } from '../api/teamsApi';
import { Team, TeamMember, Registration, TeamJoinRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import {
  Users,
  Shield,
  UserPlus,
  UserMinus,
  Crown,
  Trash2,
  LogOut,
  ArrowLeft,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trophy,
  Mail,
  Send,
  Clock,
  XCircle,
  Check
} from 'lucide-react';

export const TeamDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [permissions, setPermissions] = useState<any>(null);
  const [requests, setRequests] = useState<TeamJoinRequest[]>([]);
  const [userRequest, setUserRequest] = useState<TeamJoinRequest | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Add / Invite Member State
  const [addUsername, setAddUsername] = useState<string>('');
  const [addRole, setAddRole] = useState<string>('Starter');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTeamDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await teamsApi.getTeam(parseInt(id, 10));
      setTeam(res.team);
      setMembers(res.members);
      setRegistrations(res.registrations);
      setPermissions(res.user_permissions);
      setRequests(res.requests || []);
      setUserRequest(res.user_request || null);
    } catch (err: any) {
      console.error('Failed to load team:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamDetails();
  }, [id, user]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !addUsername.trim()) return;

    try {
      setActionLoading(true);
      setFeedbackMsg(null);
      const res = await teamsApi.invitePlayer(parseInt(id, 10), {
        username: addUsername.trim(),
        member_role: addRole
      });
      setFeedbackMsg({ type: 'success', text: res.message });
      setAddUsername('');
      await fetchTeamDetails();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to send invitation.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestToJoin = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      setFeedbackMsg(null);
      const res = await teamsApi.requestToJoinTeam(parseInt(id, 10));
      setFeedbackMsg({ type: 'success', text: res.message });
      await fetchTeamDetails();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to submit join request.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespondToRequest = async (requestId: number, action: 'accept' | 'decline' | 'cancel') => {
    try {
      setActionLoading(true);
      setFeedbackMsg(null);
      const res = await teamsApi.respondToRequest(requestId, action);
      setFeedbackMsg({ type: 'success', text: res.message });
      await fetchTeamDetails();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update request.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (userId: number, username?: string) => {
    if (!id) return;
    const isSelf = user?.user_id === userId;
    const confirmText = isSelf
      ? 'Are you sure you want to leave this team?'
      : `Are you sure you want to remove ${username || 'this player'} from the team?`;

    if (!window.confirm(confirmText)) return;

    try {
      setActionLoading(true);
      const res = await teamsApi.removeMember(parseInt(id, 10), userId);
      setFeedbackMsg({ type: 'success', text: res.message });
      if (isSelf) {
        navigate('/teams');
      } else {
        await fetchTeamDetails();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Action failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = async (userId: number, newRole: string) => {
    if (!id) return;
    try {
      setActionLoading(true);
      const res = await teamsApi.updateMemberRole(parseInt(id, 10), userId, newRole);
      setFeedbackMsg({ type: 'success', text: res.message });
      await fetchTeamDetails();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update role.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to disband this team? This action cannot be undone.')) return;

    try {
      setActionLoading(true);
      await teamsApi.deleteTeam(parseInt(id, 10));
      alert('Team disbanded successfully.');
      navigate('/teams');
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to disband team.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-slate-400">Loading team roster and members...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Team Not Found</h2>
        <Link to="/teams" className="text-sm text-blue-400 hover:underline">
          Return to teams directory
        </Link>
      </div>
    );
  }

  const isCaptain = permissions?.is_captain;
  const isMember = permissions?.is_member;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <Link
        to="/teams"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Teams</span>
      </Link>

      {/* Team Header */}
      <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-heading font-bold text-2xl shadow-xl shadow-purple-600/20">
            {team.team_name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-heading text-3xl font-extrabold text-white">{team.team_name}</h1>
              {isCaptain && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950/80 text-purple-400 border border-purple-500/30 flex items-center space-x-1">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>Captain</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Captain: <span className="text-slate-200 font-semibold">{team.captain_username}</span> • Founded on{' '}
              {new Date(team.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-2">
          {isMember && !isCaptain && (
            <button
              onClick={() => handleRemoveMember(user!.user_id)}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-white bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/30 transition-colors flex items-center space-x-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Leave Team</span>
            </button>
          )}

          {isCaptain && (
            <button
              onClick={handleDeleteTeam}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-white bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/30 transition-colors flex items-center space-x-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Disband Team</span>
            </button>
          )}
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Grid: Roster & Tournament Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Team Roster (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Team Roster (TeamMembers)</span>
                </h3>
                <p className="text-xs text-slate-400">Current players linked to this team</p>
              </div>
              <span className="text-xs text-slate-400 font-mono">{members.length} player(s)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Player</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Joined Date</th>
                    {isCaptain && <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {members.map((m) => {
                    const isRowCaptain = m.is_captain;
                    const isSelf = user?.user_id === m.user_id;

                    return (
                      <tr key={m.user_id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white flex items-center space-x-2">
                            <span>{m.username}</span>
                            {isRowCaptain && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                            {isSelf && (
                              <span className="text-[10px] bg-slate-800 text-blue-400 px-1.5 py-0.2 rounded">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500">{m.country || 'Global'}</div>
                        </td>

                        <td className="px-4 py-3">
                          {isCaptain && !isRowCaptain ? (
                            <select
                              value={m.member_role}
                              onChange={(e) => handleChangeRole(m.user_id, e.target.value)}
                              className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                            >
                              <option value="Starter">Starter</option>
                              <option value="Substitute">Substitute</option>
                              <option value="Member">Member</option>
                              <option value="Captain">Transfer Captaincy</option>
                            </select>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                isRowCaptain
                                  ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {m.member_role}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 font-mono text-slate-400">
                          {new Date(m.joined_at).toLocaleDateString()}
                        </td>

                        {isCaptain && (
                          <td className="px-4 py-3 text-right">
                            {!isRowCaptain && (
                              <button
                                onClick={() => handleRemoveMember(m.user_id, m.username)}
                                disabled={actionLoading}
                                className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                                title="Remove from team"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Team Join Requests & Invitations Queue (For Captains) */}
          {isCaptain && (
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-amber-400" />
                    <span>Join Requests & Invitations Queue</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Review incoming join requests from players and monitor outgoing invitations
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {requests.filter((r) => r.status === 'Pending').length} pending
                </span>
              </div>

              {requests.filter((r) => r.status === 'Pending').length === 0 ? (
                <div className="text-center py-6 rounded-xl bg-slate-800/30 border border-slate-800 text-slate-500 text-xs">
                  No pending requests or outgoing invitations.
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Incoming Requests from Players */}
                  {requests
                    .filter((r) => r.type === 'Request' && r.status === 'Pending')
                    .map((reqItem) => (
                      <div
                        key={reqItem.request_id}
                        className="p-3.5 rounded-xl bg-slate-800/60 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-xs text-white">{reqItem.username}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-500/30 font-medium">
                              Requested to Join
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {reqItem.email} • {reqItem.country || 'Global'} • Requested on{' '}
                            {new Date(reqItem.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 self-end sm:self-auto">
                          <button
                            onClick={() => handleRespondToRequest(reqItem.request_id, 'accept')}
                            disabled={actionLoading}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center space-x-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleRespondToRequest(reqItem.request_id, 'decline')}
                            disabled={actionLoading}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/30 transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}

                  {/* Outgoing Invitations Sent to Players */}
                  {requests
                    .filter((r) => r.type === 'Invitation' && r.status === 'Pending')
                    .map((invItem) => (
                      <div
                        key={invItem.request_id}
                        className="p-3.5 rounded-xl bg-slate-800/40 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-xs text-white">{invItem.username}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/70 text-blue-300 border border-blue-500/30 font-medium">
                              Invited as {invItem.member_role}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Invitation sent on {new Date(invItem.created_at).toLocaleDateString()} • Awaiting player acceptance
                          </div>
                        </div>

                        <button
                          onClick={() => handleRespondToRequest(invItem.request_id, 'cancel')}
                          disabled={actionLoading}
                          className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-300 hover:bg-slate-800 transition-colors self-end sm:self-auto"
                        >
                          Cancel Invite
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Tournament Registrations for this team */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-blue-400" />
              <span>Tournament Participation History</span>
            </h3>

            {registrations.length === 0 ? (
              <div className="text-center py-8 rounded-xl bg-slate-800/30 border border-slate-800 text-slate-500 text-xs">
                This team has not registered for any tournaments yet.
              </div>
            ) : (
              <div className="space-y-3">
                {registrations.map((r) => (
                  <div
                    key={r.registration_id}
                    className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-sm text-white">{r.tournament_title}</div>
                      <div className="text-xs text-slate-400">
                        Game: {r.game_name} • Registered on {new Date(r.registration_date).toLocaleDateString()}
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Captain Recruitment OR Player Join Controls */}
        <div className="lg:col-span-1 space-y-6">
          {isCaptain ? (
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-purple-400" />
                  <span>Invite Player to Team</span>
                </h3>
              </div>

              <p className="text-[11px] text-slate-400">
                Send an official team invitation. The player will receive the invitation in their profile and must accept it before they are added to the roster.
              </p>

              <form onSubmit={handleInviteMember} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Player Username
                  </label>
                  <input
                    type="text"
                    required
                    value={addUsername}
                    onChange={(e) => setAddUsername(e.target.value)}
                    placeholder="Enter player's username..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    e.g. s1mple_king, b1t_pro, soloplayer2, etc.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Team Role
                  </label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Substitute">Substitute</option>
                    <option value="Member">Member</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || !addUsername.trim()}
                  className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-all shadow-md shadow-purple-600/20 flex items-center justify-center space-x-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{actionLoading ? 'Sending...' : 'Send Team Invitation'}</span>
                </button>
              </form>
            </div>
          ) : !isMember ? (
            /* Player Join Request Controls for Non-Members */
            <div className="space-y-4">
              {userRequest && userRequest.status === 'Pending' ? (
                userRequest.type === 'Request' ? (
                  <div className="p-6 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-3">
                    <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Join Request Pending</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Your request to join <strong>{team.team_name}</strong> was submitted on{' '}
                      {new Date(userRequest.created_at).toLocaleDateString()}. Waiting for captain{' '}
                      <strong>{team.captain_username}</strong> to review.
                    </p>
                    <button
                      onClick={() => handleRespondToRequest(userRequest.request_id, 'cancel')}
                      disabled={actionLoading}
                      className="w-full py-2.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/30 transition-colors"
                    >
                      {actionLoading ? 'Cancelling...' : 'Cancel Join Request'}
                    </button>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-blue-950/50 border border-blue-500/40 space-y-3">
                    <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
                      <Mail className="w-4 h-4" />
                      <span>Team Invitation Received!</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Captain <strong>{team.captain_username}</strong> has invited you to join{' '}
                      <strong>{team.team_name}</strong> as <strong>{userRequest.member_role}</strong>!
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleRespondToRequest(userRequest.request_id, 'accept')}
                        disabled={actionLoading}
                        className="py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
                      >
                        Accept & Join
                      </button>
                      <button
                        onClick={() => handleRespondToRequest(userRequest.request_id, 'decline')}
                        disabled={actionLoading}
                        className="py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mx-auto">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">Join this Team</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Interested in competing with <strong>{team.team_name}</strong>? Submit a join request directly to
                    Captain <strong>{team.captain_username}</strong>.
                  </p>
                  {user ? (
                    <button
                      onClick={handleRequestToJoin}
                      disabled={actionLoading}
                      className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-purple-600 hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20"
                    >
                      {actionLoading ? 'Submitting...' : 'Request to Join Team'}
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      className="block w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 transition-all text-center"
                    >
                      Login to Request Join
                    </Link>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 text-center space-y-2">
              <Shield className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">Active Team Member</h4>
              <p className="text-xs text-slate-400">
                You are currently an active member of this squad roster. Only Captain {team.captain_username} can configure team settings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
