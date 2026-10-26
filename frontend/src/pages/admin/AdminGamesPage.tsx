import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { gamesApi } from '../../api/gamesApi';
import { Game } from '../../types';
import {
  Gamepad2,
  Plus,
  Edit,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';

export const AdminGamesPage: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

  // Form Fields
  const [gameName, setGameName] = useState<string>('');
  const [genre, setGenre] = useState<string>('');
  const [platform, setPlatform] = useState<string>('');
  const [publisher, setPublisher] = useState<string>('');

  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const res = await gamesApi.listGames();
      setGames(res.games);
    } catch (err) {
      console.error('Failed to load games:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedGameId(null);
    setGameName('');
    setGenre('Tactical Shooter');
    setPlatform('PC');
    setPublisher('');
    setFormError(null);
    setFormSuccess(null);
    setModalOpen(true);
  };

  const openEditModal = (g: Game) => {
    setModalMode('edit');
    setSelectedGameId(g.game_id);
    setGameName(g.game_name);
    setGenre(g.genre);
    setPlatform(g.platform);
    setPublisher(g.publisher);
    setFormError(null);
    setFormSuccess(null);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameName.trim() || !genre.trim() || !platform.trim() || !publisher.trim()) return;

    try {
      setFormLoading(true);
      setFormError(null);

      const payload = {
        game_name: gameName.trim(),
        genre: genre.trim(),
        platform: platform.trim(),
        publisher: publisher.trim()
      };

      if (modalMode === 'create') {
        await gamesApi.createGame(payload);
        setFormSuccess('Game added to catalog successfully!');
      } else if (selectedGameId) {
        await gamesApi.updateGame(selectedGameId, payload);
        setFormSuccess('Game details updated successfully!');
      }

      await fetchGames();
      setTimeout(() => {
        setModalOpen(false);
        setFormSuccess(null);
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (gameId: number) => {
    if (!window.confirm('Are you sure you want to delete this game? (Fails if tournaments reference this game).')) return;
    try {
      await gamesApi.deleteGame(gameId);
      await fetchGames();
    } catch (err: any) {
      alert(err.message || 'Failed to delete game.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Admin Dashboard</span>
          </Link>
          <h1 className="font-heading text-3xl font-extrabold text-white">
            Games Catalog Management (Module 2)
          </h1>
          <p className="text-sm text-slate-400">
            Define supported competitive titles, platforms, and publishers in the Games table.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Game</span>
        </button>
      </div>

      {/* Games Table */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">ID</th>
                <th className="px-4 py-3">Game Title</th>
                <th className="px-4 py-3">Genre</th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Publisher</th>
                <th className="px-4 py-3 text-center">Tournaments Hosted</th>
                <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {games.map((g) => (
                <tr key={g.game_id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-500">#{g.game_id}</td>
                  <td className="px-4 py-3 font-semibold text-white">{g.game_name}</td>
                  <td className="px-4 py-3">{g.genre}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{g.platform}</td>
                  <td className="px-4 py-3">{g.publisher}</td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-blue-400">
                    {g.tournament_count || 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(g)}
                        className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                        title="Edit game details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(g.game_id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        title="Delete game"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-8">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-heading text-white">
                  {modalMode === 'create' ? 'Add New Game' : 'Edit Game'}
                </h2>
                <p className="text-xs text-slate-400">Stores metadata in Games table</p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Game Name
                </label>
                <input
                  type="text"
                  required
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="e.g. Overwatch 2, FIFA 26"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Genre
                </label>
                <input
                  type="text"
                  required
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="e.g. Tactical FPS, MOBA, Fighting"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Platform(s)
                </label>
                <input
                  type="text"
                  required
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  placeholder="e.g. PC, PS5, Xbox Series X, Nintendo Switch"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Publisher / Developer
                </label>
                <input
                  type="text"
                  required
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  placeholder="e.g. Blizzard Entertainment, Electronic Arts"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20"
              >
                {formLoading ? 'Saving...' : modalMode === 'create' ? 'Add Game' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
