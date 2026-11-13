import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Trophy,
  Users,
  Shield,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronDown
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDemoSwitch = async (username: string) => {
    await demoLogin(username);
    setDemoDropdownOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0e17]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-heading text-xl font-bold tracking-wider text-white flex items-center gap-1.5">
                Arena<span className="text-blue-500">HQ</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono block -mt-1 tracking-widest uppercase">
                Tournament System
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/tournaments"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/tournaments')
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Tournaments
            </Link>

            <Link
              to="/matches"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/matches') || location.pathname.startsWith('/matches/')
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Matches
            </Link>

            <Link
              to="/teams"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/teams')
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Teams
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                    : 'text-purple-300 hover:text-purple-200 hover:bg-purple-950/40'
                }`}
              >
                <Shield className="w-4 h-4 mr-1 text-purple-400" />
                Admin Panel
              </Link>
            )}
          </div>

          {/* Right Header: Demo Switcher & User Account */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Quick Demo Switcher */}
            <div className="relative">
              <button
                onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-slate-600 text-xs text-slate-300 font-medium transition-all"
                title="Switch demo role instantly"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Demo Switcher</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {demoDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl p-1.5 z-50">
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Instant Persona Switch
                  </div>
                  <button
                    onClick={() => handleDemoSwitch('admin')}
                    className="w-full text-left px-2.5 py-2 text-xs rounded-lg hover:bg-purple-950/50 hover:text-purple-300 text-slate-200 flex items-center justify-between transition-colors"
                  >
                    <span className="font-medium">Administrator (admin)</span>
                    <span className="text-[10px] bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded">Admin</span>
                  </button>
                  <button
                    onClick={() => handleDemoSwitch('shroud_jr')}
                    className="w-full text-left px-2.5 py-2 text-xs rounded-lg hover:bg-blue-950/50 hover:text-blue-300 text-slate-200 flex items-center justify-between transition-colors"
                  >
                    <span className="font-medium">shroud_jr (Captain)</span>
                    <span className="text-[10px] bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded">Sentinels</span>
                  </button>
                  <button
                    onClick={() => handleDemoSwitch('s1mple_king')}
                    className="w-full text-left px-2.5 py-2 text-xs rounded-lg hover:bg-blue-950/50 hover:text-blue-300 text-slate-200 flex items-center justify-between transition-colors"
                  >
                    <span className="font-medium">s1mple_king (Captain)</span>
                    <span className="text-[10px] bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded">NAVI</span>
                  </button>
                  <button
                    onClick={() => handleDemoSwitch('soloplayer1')}
                    className="w-full text-left px-2.5 py-2 text-xs rounded-lg hover:bg-emerald-950/50 hover:text-emerald-300 text-slate-200 flex items-center justify-between transition-colors"
                  >
                    <span className="font-medium">soloplayer1</span>
                    <span className="text-[10px] bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded">Solo</span>
                  </button>
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-sm text-slate-200 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {user?.username.charAt(0)}
                  </div>
                  <span className="font-medium">{user?.username}</span>
                  {isAdmin && (
                    <span className="bg-purple-900/60 text-purple-300 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                      Admin
                    </span>
                  )}
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/tournaments"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
          >
            Tournaments
          </Link>
          <Link
            to="/matches"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
          >
            Matches
          </Link>
          <Link
            to="/teams"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
          >
            Teams
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-purple-400 hover:bg-purple-950/40"
            >
              Admin Panel
            </Link>
          )}
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-800"
              >
                Profile ({user?.username})
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-rose-400 hover:bg-rose-950/30"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 rounded-lg text-base font-medium text-slate-300 bg-slate-800"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 rounded-lg text-base font-medium text-white bg-blue-600"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
