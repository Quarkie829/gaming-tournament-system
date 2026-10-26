import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trophy, Shield, Users, User, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;

    try {
      setLoading(true);
      setError(null);
      await login(identifier.trim(), password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (username: string) => {
    try {
      setLoading(true);
      setError(null);
      await demoLogin(username);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-blue-600/30">
            <Trophy className="w-6 h-6" />
          </div>
          <h2 className="font-heading text-3xl font-extrabold text-white">
            Sign In to Tournament.gg
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Access your tournament registrations, teams, and administrative dashboard
          </p>
        </div>

        {/* Demo Fast Login Pill Box */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-3">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>One-Click Evaluator Personas (Password123!)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="p-2.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/40 text-left transition-all group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                <span>Admin</span>
                <Shield className="w-3.5 h-3.5" />
              </div>
              <div className="text-[10px] text-slate-400">admin</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('shroud_jr')}
              className="p-2.5 rounded-xl bg-blue-950/50 hover:bg-blue-900/60 border border-blue-500/40 text-left transition-all group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-blue-300">
                <span>Captain</span>
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="text-[10px] text-slate-400">shroud_jr</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('soloplayer1')}
              className="p-2.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-left transition-all group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                <span>Solo</span>
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="text-[10px] text-slate-400">soloplayer1</div>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Regular Login Form */}
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Username or Email
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. admin or player@game.com"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-blue-400 font-semibold hover:underline">
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
};
