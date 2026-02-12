import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobAPI } from '../services/api';

function EditJob() {
  const navigate = useNavigate();
  const { jobId } = useParams();
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobData();
  }, [jobId]);

  const fetchJobData = async () => {
    try {
      const response = await jobAPI.getJobDetail(jobId);
      const job = response.data;
      setFormData({
        title: job.title,
        company: job.company,
        location: job.location,
        job_type: job.job_type,
        experience_required: job.experience_required,
        salary_range: job.salary_range || '',
        description: job.description,
        requirements: job.requirements,
        responsibilities: job.responsibilities,
      });
    } catch (err) {
      setError('Failed to load job details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await jobAPI.updateJob(jobId, formData);
      alert('Job updated successfully!');
      navigate('/jobs');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update job');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading job details...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Edit Job Posting</h2>
        <button style={styles.backBtn} onClick={() => navigate('/jobs')}>
          ← Back to Jobs
        </button>
      </div>

      <div style={styles.formContainer}>
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Job Title *</label>
              <input
                style={styles.input}
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Company *</label>
              <input
                style={styles.input}
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Location *</label>
              <input
                style={styles.input}
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Job Type *</label>
              <select
                style={styles.input}
                name="job_type"
                value={formData.job_type}
                onChange={handleChange}
                required
              >
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Experience Required *</label>
              <input
                style={styles.input}
                type="text"
                name="experience_required"
                value={formData.experience_required}
                onChange={handleChange}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Salary Range</label>
              <input
                style={styles.input}
                type="text"
                name="salary_range"
                value={formData.salary_range}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Job Description *</label>
            <textarea
              style={styles.textarea}
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Requirements *</label>
            <textarea
              style={styles.textarea}
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              rows="4"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Responsibilities *</label>
            <textarea
              style={styles.textarea}
              name="responsibilities"
              value={formData.responsibilities}
              onChange={handleChange}
              rows="4"
              required
            />
          </div>

          <button style={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? 'Updating...' : '✓ Update Job'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  backBtn: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  formContainer: {
    maxWidth: '900px',
    margin: '0 auto',
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px',
  },
  field: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#333',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '20px',
  },
  error: {
    padding: '12px',
    marginBottom: '20px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '6px',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '18px',
  },
};

export default EditJob;