import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobAPI } from '../services/api';

function CreateJob() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    job_type: 'full_time',
    experience_required: '',
    salary_range: '',
    description: '',
    requirements: '',
    responsibilities: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAIGenerate = async () => {
    if (!formData.title || !formData.company) {
      alert('Please enter Job Title and Company first!');
      return;
    }

    setAiLoading(true);
    setError('');

    try {
      const response = await jobAPI.generateJobDescription({
        title: formData.title,
        company: formData.company,
      });

      setFormData({
        ...formData,
        description: response.data.description,
        requirements: response.data.requirements,
        responsibilities: response.data.responsibilities,
      });

      alert('✨ AI generated job details successfully!');
    } catch (err) {
      console.error('AI Error:', err);
      setError(err.response?.data?.detail || 'AI generation failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await jobAPI.createJob(formData);
      alert('Job posted successfully!');
      navigate('/jobs');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Create New Job Posting</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          {/* AI Generation Section */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-2">
                  <span className="text-2xl">✨</span>
                  AI-Powered Job Description Generator
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Enter job title and company, then let AI generate professional descriptions, requirements, and responsibilities!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAIGenerate}
              disabled={aiLoading || !formData.title || !formData.company}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
            >
              {aiLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating with AI...
                </span>
              ) : (
                '🤖 Generate Job Details with AI'
              )}
            </button>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                name="title"
                placeholder="e.g., Senior React Developer"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company *
              </label>
              <input
                type="text"
                name="company"
                placeholder="e.g., Tech Corp"
                value={formData.company}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                name="location"
                placeholder="e.g., Remote / New York"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Type *
              </label>
              <select
                name="job_type"
                value={formData.job_type}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              >
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Required *
              </label>
              <input
                type="text"
                name="experience_required"
                placeholder="e.g., 2-4 years"
                value={formData.experience_required}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salary Range
              </label>
              <input
                type="text"
                name="salary_range"
                placeholder="e.g., $80k - $100k"
                value={formData.salary_range}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Text Areas */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description *
              </label>
              <textarea
                name="description"
                placeholder="Describe the role..."
                value={formData.description}
                onChange={handleChange}
                rows="4"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements *
              </label>
              <textarea
                name="requirements"
                placeholder="List required skills and qualifications..."
                value={formData.requirements}
                onChange={handleChange}
                rows="4"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsibilities *
              </label>
              <textarea
                name="responsibilities"
                placeholder="What will the candidate do?"
                value={formData.responsibilities}
                onChange={handleChange}
                rows="4"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg text-lg"
            >
              {loading ? 'Creating Job...' : '✓ Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateJob;