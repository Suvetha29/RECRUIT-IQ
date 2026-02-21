import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const ApplyJob = ({ job, onClose, onSuccess }) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are accepted.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB.');
      return;
    }
    setError('');
    setResume(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    validateAndSetFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resume) { setError('Please upload your resume.'); return; }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('job_id', job.id);
      formData.append('resume', resume);
      if (coverLetter.trim()) formData.append('cover_letter', coverLetter);

      const response = await api.post('/api/applications/apply', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onSuccess(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-white">Apply for Position</h2>
              <p className="text-indigo-200 mt-1">{job.title} · {job.company}</p>
            </div>
            <button onClick={onClose} className="text-white hover:text-indigo-200 text-2xl leading-none">×</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Resume Upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Resume <span className="text-red-500">*</span>
              <span className="text-slate-400 font-normal ml-1">(PDF only, max 5MB)</span>
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragOver ? 'border-indigo-500 bg-indigo-50' :
                resume ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-indigo-400'
              }`}
              onClick={() => document.getElementById('resume-input').click()}
            >
              {resume ? (
                <div>
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-green-700 font-semibold">{resume.name}</p>
                  <p className="text-green-600 text-sm mt-1">{(resume.size / 1024).toFixed(1)} KB · Click to change</p>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-2">📁</div>
                  <p className="text-slate-600 font-medium">Drag & drop your resume here</p>
                  <p className="text-slate-400 text-sm mt-1">or click to browse files</p>
                </div>
              )}
              <input
                id="resume-input"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Cover Letter */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Cover Letter <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={5}
              placeholder="Tell us why you're a great fit for this role..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-slate-700"
            />
          </div>

          {/* ATS Info Banner */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="text-indigo-800 font-semibold text-sm">AI-Powered ATS Scoring</p>
              <p className="text-indigo-600 text-xs mt-1">Your resume will be automatically scored against the job requirements. You'll see your match score immediately after applying.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !resume}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-200"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Submitting & Scoring...
                </span>
              ) : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyJob;
