import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trophy, AlertCircle, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('India');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) return;

    try {
      setLoading(true);
      setError(null);
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        country: country.trim() || 'India'
      });
      navigate('/tournaments');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check inputs.');
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
            Create Player Profile
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Join tournaments, create or lead teams, and track your match registrations
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              type="text"
              required
              minLength={3}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. striker99"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="gamer@example.com"
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
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
              placeholder="e.g. India, USA, Canada"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-blue-400 font-semibold hover:underline">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
};
