import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { registrationsApi } from '../api/registrationsApi';
import { Registration, User } from '../types';
import { StatusBadge } from '../components/StatusBadge';
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
  Ban
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editUsername, setEditUsername] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editCountry, setEditCountry] = useState<string>('');
  const [editPassword, setEditPassword] = useState<string>('');
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  const fetchProfileAndRegistrations = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [userRes, regRes] = await Promise.all([
        authApi.getUserProfile(user.user_id),
        registrationsApi.getMyRegistrations()
      ]);
      setProfileData(userRes);
      setRegistrations(regRes.registrations);

      setEditUsername(userRes.user.username);
      setEditEmail(userRes.user.email);
      setEditCountry(userRes.user.country);
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndRegistrations();
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
      await fetchProfileAndRegistrations();
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
      await fetchProfileAndRegistrations();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel registration.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-slate-400">Loading user profile & registrations...</p>
      </div>
    );
  }

  const currentUser = profileData?.user || user;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile Header */}
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

      {/* Grid: Registrations & Teams */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: My Registrations (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
                  <Trophy className="w-4 h-4 text-blue-400" />
                  <span>My Tournament Registrations (Module 4)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Track approved, pending, and previous entries with live status history
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {registrations.length} record(s)
              </span>
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
                      <th className="px-4 py-3">Type / Entrant</th>
                      <th className="px-4 py-3">Registered On</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 rounded-r-lg text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {registrations.map((r) => {
                      const isSolo = r.user_id !== null;

                      return (
                        <tr key={r.registration_id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-white">{r.tournament_title}</div>
                            <div className="text-[10px] text-slate-500">
                              Game: {r.game_name} • Fee: ${Number(r.entry_fee || 0).toFixed(2)}
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
                          <td className="px-4 py-3 font-mono text-slate-400">
                            {new Date(r.registration_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={r.status} />
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
        </div>

        {/* Right Column: User's Teams (1 col) */}
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
                  <div
                    key={t.team_id}
                    className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between text-xs"
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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
