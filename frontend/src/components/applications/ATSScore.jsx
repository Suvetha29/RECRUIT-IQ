import React from 'react';

const ATSScore = ({ score, feedback, matchedSkills, missingSkills, recommendations, onClose }) => {
  const getScoreColor = (score) => {
    if (score >= 75) return { ring: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200', label: 'Strong Match', badge: 'bg-green-100 text-green-700' };
    if (score >= 50) return { ring: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Good Match', badge: 'bg-yellow-100 text-yellow-700' };
    if (score >= 30) return { ring: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Partial Match', badge: 'bg-orange-100 text-orange-700' };
    return { ring: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', label: 'Weak Match', badge: 'bg-red-100 text-red-700' };
  };

  const colors = getScoreColor(score);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl text-center">
          <h2 className="text-xl font-bold text-white">🎉 Application Submitted!</h2>
          <p className="text-indigo-200 text-sm mt-1">Here's your AI-powered ATS match score</p>
        </div>

        <div className="p-6 space-y-5">

          {/* Score Circle */}
          <div className="flex flex-col items-center">
            <div className="relative w-36 h-36">
              <svg className="transform -rotate-90 w-36 h-36">
                <circle cx="72" cy="72" r="45" stroke="#e5e7eb" strokeWidth="10" fill="none" />
                <circle
                  cx="72" cy="72" r="45"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={colors.ring}
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${colors.ring}`}>{Math.round(score)}%</span>
                <span className="text-xs text-slate-500">ATS Score</span>
              </div>
            </div>
            <span className={`mt-3 px-4 py-1 rounded-full text-sm font-semibold ${colors.badge}`}>
              {colors.label}
            </span>
          </div>

          {/* Matched Skills */}
          {matchedSkills && matchedSkills.length > 0 && (
            <div className={`${colors.bg} border ${colors.border} rounded-xl p-4`}>
              <p className="text-sm font-semibold text-slate-700 mb-2">✅ Matched Skills</p>
              <div className="flex flex-wrap gap-2">
                {matchedSkills.map((skill, i) => (
                  <span key={i} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium capitalize">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing Skills */}
          {missingSkills && missingSkills.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-slate-700 mb-2">⚠️ Skills to Improve</p>
              <div className="flex flex-wrap gap-2">
                {missingSkills.map((skill, i) => (
                  <span key={i} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium capitalize">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-slate-700 mb-2">💡 Tips to Improve</p>
              <ul className="space-y-1">
                {recommendations.map((tip, i) => (
                  <li key={i} className="text-xs text-blue-700 flex gap-2">
                    <span>•</span><span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Status Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <p className="text-sm text-slate-600">Your application status is currently</p>
            <span className="inline-block mt-1 px-4 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
              ⏳ Pending Review
            </span>
            <p className="text-xs text-slate-400 mt-2">You can track your application status in "My Applications"</p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
          >
            View My Applications
          </button>
        </div>
      </div>
    </div>
  );
};

export default ATSScore;
