import React from 'react';

const STATUS_CONFIG = {
  pending:      { label: 'Pending',      emoji: '⏳', bg: 'bg-slate-100',  text: 'text-slate-600',  border: 'border-slate-200' },
  under_review: { label: 'Under Review', emoji: '🔍', bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200' },
  shortlisted:  { label: 'Shortlisted',  emoji: '⭐', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  interview:    { label: 'Interview',    emoji: '📅', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  hired:        { label: 'Hired! 🎉',   emoji: '✅', bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-200' },
  rejected:     { label: 'Not Selected', emoji: '❌', bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-200' },
};

const ApplicationStatus = ({ status, size = 'md' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold border ${config.bg} ${config.text} ${config.border} ${sizeClass}`}>
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
};

export default ApplicationStatus;
