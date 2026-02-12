import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobAPI } from '../services/api';

function JobList() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await jobAPI.getAllJobs();
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getJobTypeLabel = (type) => {
    const labels = {
      full_time: 'Full Time',
      part_time: 'Part Time',
      contract: 'Contract',
      internship: 'Internship',
    };
    return labels[type] || type;
  };

  const getJobTypeColor = (type) => {
    const colors = {
      full_time: '#28a745',
      part_time: '#ffc107',
      contract: '#17a2b8',
      internship: '#6f42c1',
    };
    return colors[type] || '#6c757d';
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading jobs...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Available Positions</h2>
          <p style={styles.subtitle}>{jobs.length} jobs found</p>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.dashboardBtn} onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>
          {user && user.role === 'hr' && (
            <button style={styles.createBtn} onClick={() => navigate('/create-job')}>
              + Post New Job
            </button>
          )}
        </div>
      </div>

      <div style={styles.jobGrid}>
        {jobs.length === 0 ? (
          <div style={styles.emptyState}>
            <h3>No jobs available</h3>
            <p>Check back later for new opportunities!</p>
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} style={styles.jobCard}>
              <div style={styles.cardHeader}>
                <h3 style={styles.jobTitle}>{job.title}</h3>
                <span
                  style={{
                    ...styles.typeBadge,
                    backgroundColor: getJobTypeColor(job.job_type),
                  }}
                >
                  {getJobTypeLabel(job.job_type)}
                </span>
              </div>

              <div style={styles.companyInfo}>
                <span style={styles.company}>🏢 {job.company}</span>
                <span style={styles.location}>📍 {job.location}</span>
              </div>

              <div style={styles.metadata}>
                <span style={styles.metaItem}>💼 {job.experience_required}</span>
                {job.salary_range && (
                  <span style={styles.metaItem}>💰 {job.salary_range}</span>
                )}
              </div>

              <p style={styles.description}>
                {job.description.length > 150
                  ? job.description.substring(0, 150) + '...'
                  : job.description}
              </p>

              <div style={styles.cardFooter}>
                <span style={styles.postedBy}>Posted by {job.recruiter_name}</span>
                <button
                  style={styles.viewBtn}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  View Details →
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    padding: '30px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    color: '#1a1a1a',
  },
  subtitle: {
    margin: '5px 0 0 0',
    color: '#6c757d',
    fontSize: '14px',
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
  },
  dashboardBtn: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  createBtn: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  jobGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  jobCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  jobTitle: {
    margin: 0,
    fontSize: '20px',
    color: '#1a1a1a',
    flex: 1,
  },
  typeBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
    marginLeft: '10px',
  },
  companyInfo: {
    display: 'flex',
    gap: '15px',
    marginBottom: '12px',
  },
  company: {
    fontSize: '14px',
    color: '#495057',
    fontWeight: '500',
  },
  location: {
    fontSize: '14px',
    color: '#495057',
  },
  metadata: {
    display: 'flex',
    gap: '15px',
    marginBottom: '15px',
  },
  metaItem: {
    fontSize: '13px',
    color: '#6c757d',
    backgroundColor: '#f8f9fa',
    padding: '6px 12px',
    borderRadius: '6px',
  },
  description: {
    fontSize: '14px',
    color: '#495057',
    lineHeight: '1.6',
    marginBottom: '20px',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '15px',
    borderTop: '1px solid #e9ecef',
  },
  postedBy: {
    fontSize: '13px',
    color: '#6c757d',
  },
  viewBtn: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
  },
  spinner: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #007bff',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    gridColumn: '1 / -1',
  },
};

export default JobList;