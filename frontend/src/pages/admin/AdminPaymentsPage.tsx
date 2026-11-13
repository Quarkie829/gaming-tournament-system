import React, { useEffect, useState } from 'react';
import { financialApi } from '../../api/financialApi';
import { tournamentsApi } from '../../api/tournamentsApi';
import { registrationsApi } from '../../api/registrationsApi';
import { Payment, Tournament, Registration, PaymentStatus } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { formatINR } from '../../utils/currency';
import {
  CreditCard,
  Filter,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  X,
  IndianRupee,
  ShieldCheck,
  TrendingUp,
  Receipt
} from 'lucide-react';

export const AdminPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Manual Payment Modal State
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedRegId, setSelectedRegId] = useState<number | ''>('');
  const [payAmount, setPayAmount] = useState<number>(500);
  const [payMethod, setPayMethod] = useState<string>('UPI');
  const [payRef, setPayRef] = useState<string>('');
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchPaymentsAndTournaments = async () => {
    try {
      setLoading(true);
      const [tournRes, payRes] = await Promise.all([
        tournamentsApi.listTournaments(),
        financialApi.listPayments({
          tournament_id: selectedTournament ? parseInt(selectedTournament, 10) : undefined,
          payment_status: selectedStatus || undefined
        })
      ]);
      setTournaments(tournRes.tournaments);
      setPayments(payRes.payments);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsAndTournaments();
  }, [selectedTournament, selectedStatus]);

  const handleStatusChange = async (paymentId: number, status: PaymentStatus) => {
    try {
      await financialApi.updatePaymentStatus(paymentId, status);
      fetchPaymentsAndTournaments();
    } catch (err: any) {
      alert(err.message || 'Failed to update payment status.');
    }
  };

  const handleOpenCreateModal = async () => {
    try {
      setCreateError(null);
      setSelectedRegId('');
      setPayRef(`TXN-MANUAL-${Date.now().toString().slice(-6)}`);
      const res = await registrationsApi.listRegistrations();
      setRegistrations(res.registrations);
      setCreateModalOpen(true);
    } catch (err: any) {
      alert('Failed to load registrations: ' + err.message);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegId) {
      setCreateError('Please select a registration.');
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);
      await financialApi.createPayment({
        registration_id: Number(selectedRegId),
        amount: Number(payAmount),
        payment_method: payMethod,
        transaction_reference: payRef.trim() || undefined
      });
      setCreateModalOpen(false);
      fetchPaymentsAndTournaments();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to record payment.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Metrics Calculations
  const totalSuccess = payments
    .filter((p) => p.payment_status === 'Success')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalRefunded = payments
    .filter((p) => p.payment_status === 'Refunded')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const pendingCount = payments.filter((p) => p.payment_status === 'Pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            <CreditCard className="w-4 h-4" />
            <span>Module 6A • Financial Ledger</span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-white">
            Payments & Entry Fee Accounting (INR ₹)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Maintain transaction records in Indian Rupees (₹), verify payments, and issue refunds.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Offline / Manual Payment</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Net Collections</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-heading text-2xl font-extrabold text-emerald-400 mt-2">
            {formatINR(totalSuccess)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">From successful entry fees</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Pending Transactions</span>
            <RefreshCw className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-heading text-2xl font-extrabold text-amber-400 mt-2">
            {pendingCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Awaiting admin/bank clearance</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Refunded</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="font-heading text-2xl font-extrabold text-indigo-400 mt-2">
            {formatINR(totalRefunded)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Processed reversals in INR</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Transactions</span>
            <Receipt className="w-4 h-4 text-blue-400" />
          </div>
          <div className="font-heading text-2xl font-extrabold text-white mt-2">
            {payments.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Relational database records</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter By:</span>
          </div>

          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Tournaments</option>
            {tournaments.map((t) => (
              <option key={t.tournament_id} value={t.tournament_id}>
                {t.title}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing {payments.length} payment audit entry(ies)
        </div>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-400">Loading payment ledger from MySQL...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
          <p className="text-sm font-medium text-slate-400">No payment records found.</p>
          <p className="text-xs text-slate-500 mt-1">Payments made during tournament entry will appear here.</p>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">ID & Ref</th>
                <th className="px-4 py-3">Tournament</th>
                <th className="px-4 py-3">Entrant</th>
                <th className="px-4 py-3">Amount (INR)</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 rounded-r-lg text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {payments.map((p) => (
                <tr key={p.payment_id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono">
                    <div className="text-white font-bold">#{p.payment_id}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[140px]" title={p.transaction_reference}>
                      {p.transaction_reference}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{p.tournament_title}</div>
                    <div className="text-[10px] text-slate-500">Reg #{p.registration_id}</div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="font-semibold text-white">{p.entrant_name}</span>
                    <div className="text-[10px] text-slate-500">
                      {p.user_id ? 'Solo Player' : 'Team Entry'}
                    </div>
                  </td>

                  <td className="px-4 py-3 font-mono font-extrabold text-emerald-400 text-sm">
                    {formatINR(p.amount)}
                  </td>

                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono font-semibold">
                      {p.payment_method}
                    </span>
                  </td>

                  <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">
                    {new Date(p.paid_at).toLocaleString()}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge status={p.payment_status} />
                  </td>

                  <td className="px-4 py-3 text-right">
                    <select
                      value={p.payment_status}
                      onChange={(e) => handleStatusChange(p.payment_id, e.target.value as PaymentStatus)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Success">Success</option>
                      <option value="Failed">Failed</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Payment Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold font-heading text-white mb-1 flex items-center space-x-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>Record Manual Payment (INR ₹)</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Log an offline cash, bank deposit, or external gateway entry in Indian Rupees.
            </p>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Registration Entrant *
                </label>
                <select
                  required
                  value={selectedRegId}
                  onChange={(e) => {
                    const regId = Number(e.target.value);
                    setSelectedRegId(regId);
                    const selected = registrations.find((r) => r.registration_id === regId);
                    if (selected && selected.entry_fee !== undefined) {
                      setPayAmount(Number(selected.entry_fee));
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select registration...</option>
                  {registrations.map((r) => (
                    <option key={r.registration_id} value={r.registration_id}>
                      #{r.registration_id} - {r.tournament_title} ({r.team_name ? `Team: ${r.team_name}` : `Solo: ${r.player_username || r.username}`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Amount (₹ INR) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={0.01}
                    value={payAmount}
                    onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
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
                    <option value="UPI">UPI</option>
                    <option value="NetBanking">NetBanking</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Cash / Manual">Cash / Manual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Transaction Reference
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. UPI-REF-99281"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !selectedRegId}
                  className="px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-md shadow-emerald-600/20"
                >
                  {createLoading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};