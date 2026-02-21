import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import ApplicationStatus from '../applications/ApplicationStatus';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await api.get('/api/applications/my');
      setApplications(response.data);
    } catch (err) {
      setError('Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (!score && score !== 0) return 'text-slate-400';
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 30) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBg = (score) => {
    if (!score && score !== 0) return 'bg-slate-100';
    if (score >= 75) return 'bg-green-50 border-green-200';
    if (score >= 50) return 'bg-yellow-50 border-yellow-200';
    if (score >= 30) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-3">⚙️</div>
        <p className="text-slate-500">Loading your applications...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
            <p className="text-slate-500 text-sm mt-0.5">{applications.length} application{applications.length !== 1 ? 's' : ''} submitted</p>
          </div>
          <button
            onClick={() => navigate('/jobs')}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Browse Jobs
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">{error}</div>
        )}

        {applications.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-slate-700">No applications yet</h3>
            <p className="text-slate-400 mt-2">Apply to jobs and track your progress here.</p>
            <button
              onClick={() => navigate('/jobs')}
              className="mt-6 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Find Jobs
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.application_id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

                  {/* Job Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-slate-900">{app.job_title}</h3>
                      <ApplicationStatus status={app.status} size="sm" />
                    </div>
                    <p className="text-slate-600 mt-1">{app.company} · {app.location}</p>
                    <p className="text-slate-400 text-xs mt-1">
                      Applied {new Date(app.applied_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>

                  {/* ATS Score */}
                  <div className={`rounded-xl border p-4 text-center min-w-[110px] ${getScoreBg(app.ats_score)}`}>
                    <p className="text-xs text-slate-500 font-medium mb-1">ATS Score</p>
                    <p className={`text-3xl font-bold ${getScoreColor(app.ats_score)}`}>
                      {app.ats_score != null ? `${Math.round(app.ats_score)}%` : '—'}
                    </p>
                  </div>
                </div>

                {/* ATS Feedback */}
                {app.ats_feedback && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 mb-2">📊 ATS Feedback</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {app.ats_feedback.split('|').map((part, i) => {
                        const [label, value] = part.split(':');
                        if (!value) return null;
                        return (
                          <div key={i} className="bg-slate-50 rounded-lg p-2">
                            <p className="text-xs text-slate-400">{label?.trim()}</p>
                            <p className="text-xs font-semibold text-slate-700 truncate">{value?.trim()}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Status Timeline */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 mb-3">Pipeline Stage</p>
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {['pending', 'under_review', 'shortlisted', 'interview', 'hired'].map((stage, index) => {
                      const stages = ['pending', 'under_review', 'shortlisted', 'interview', 'hired'];
                      const currentIndex = stages.indexOf(app.status);
                      const isRejected = app.status === 'rejected';
                      const isPast = index <= currentIndex && !isRejected;
                      const isCurrent = stage === app.status;

                      const labels = { pending: 'Pending', under_review: 'Review', shortlisted: 'Shortlist', interview: 'Interview', hired: 'Hired' };

                      return (
                        <React.Fragment key={stage}>
                          <div className="flex flex-col items-center min-w-[60px]">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                              isCurrent ? 'bg-indigo-600 border-indigo-600 text-white' :
                              isPast ? 'bg-indigo-200 border-indigo-300 text-indigo-700' :
                              'bg-white border-slate-200 text-slate-300'
                            }`}>
                              {isPast && !isCurrent ? '✓' : index + 1}
                            </div>
                            <p className={`text-xs mt-1 text-center ${isCurrent ? 'text-indigo-700 font-semibold' : isPast ? 'text-indigo-400' : 'text-slate-300'}`}>
                              {labels[stage]}
                            </p>
                          </div>
                          {index < 4 && (
                            <div className={`flex-1 h-0.5 mb-5 ${isPast && !isCurrent ? 'bg-indigo-300' : 'bg-slate-200'}`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                    {app.status === 'rejected' && (
                      <div className="ml-2 px-3 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
                        ❌ Not Selected
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;
