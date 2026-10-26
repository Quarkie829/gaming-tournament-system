import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'tournament' | 'registration';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  let badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700';

  switch (status) {
    // Tournament & Registration positive
    case 'Open':
    case 'Approved':
      badgeStyle = 'bg-emerald-950/70 text-emerald-400 border-emerald-500/30';
      break;

    // In-progress / Pending
    case 'Ongoing':
      badgeStyle = 'bg-blue-950/70 text-blue-400 border-blue-500/30 animate-pulse';
      break;
    case 'Pending':
      badgeStyle = 'bg-amber-950/70 text-amber-400 border-amber-500/30';
      break;

    // Upcoming
    case 'Upcoming':
      badgeStyle = 'bg-purple-950/70 text-purple-400 border-purple-500/30';
      break;

    // Negative / Concluded
    case 'Rejected':
    case 'Cancelled':
      badgeStyle = 'bg-rose-950/70 text-rose-400 border-rose-500/30';
      break;
    case 'Completed':
      badgeStyle = 'bg-slate-900 text-slate-400 border-slate-700';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${badgeStyle} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
      {status}
    </span>
  );
};
