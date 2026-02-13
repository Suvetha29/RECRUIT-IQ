import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationAPI } from '../../services/api';

function MyApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await applicationAPI.getMyApplications();
      setApplications(response.data);
    } catch (err) {
      setError('Failed to load applications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      new: '#007bff',
      under_review: '#ffc107',
      interviewed: '#17a2b8',
      rejected: '#dc3545',
      hired: '#28a745'
    };
    return colors[status] || '#6c757d';
  };

  const getStatusLabel = (status) => {
    const labels = {
      new: 'New',
      under_review: 'Under Review',
      interviewed: 'Interviewed',
      rejected: 'Rejected',
      hired: 'Hired'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading your applications...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>My Applications</h2>
        <button style={styles.browseBtn} onClick={() => navigate('/jobs')}>
          Browse More Jobs
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {applications.length === 0 ? (
        <div style={styles.emptyState}>
          <h3>No applications yet</h3>
          <p>Start applying to jobs to see them here!</p>
          <button style={styles.applyBtn} onClick={() => navigate('/jobs')}>
            Browse Jobs
          </button>
        </div>
      ) : (
        <div style={styles.applicationList}>
          {applications.map((app) => (
            <div key={app.id} style={styles.applicationCard}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.jobTitle}>{app.job_title}</h3>
                  <p style={styles.company}>{app.company} • {app.location}</p>
                </div>
                <div style={styles.scoreBadge}>
                  <div style={styles.scoreValue}>{app.ats_score}%</div>
                  <div style={styles.scoreLabel}>ATS Score</div>
                </div>
              </div>

              <div style={styles.statusSection}>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(app.status),
                  color: 'white'
                }}>
                  {getStatusLabel(app.status)}
                </span>
                <span style={styles.date}>
                  Applied: {new Date(app.applied_date).toLocaleDateString()}
                </span>
              </div>

              <div style={styles.skillsContainer}>
                {app.matched_skills && app.matched_skills.length > 0 && (
                  <div style={styles.skillGroup}>
                    <span style={styles.skillLabel}>✅ Matched:</span>
                    <div style={styles.skills}>
                      {app.matched_skills.slice(0, 3).map((skill, i) => (
                        <span key={i} style={styles.skill.success}>{skill}</span>
                      ))}
                      {app.matched_skills.length > 3 && (
                        <span style={styles.skill.more}>+{app.matched_skills.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}

                {app.missing_skills && app.missing_skills.length > 0 && (
                  <div style={styles.skillGroup}>
                    <span style={styles.skillLabel}>⚠️ Missing:</span>
                    <div style={styles.skills}>
                      {app.missing_skills.slice(0, 3).map((skill, i) => (
                        <span key={i} style={styles.skill.warning}>{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button 
                style={styles.viewBtn}
                onClick={() => navigate(`/jobs/${app.job_id}`)}
              >
                View Job Details
              </button>
            </div>
          ))}
        </div>
      )}
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
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    color: '#1a1a1a',
  },
  browseBtn: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
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
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '12px',
  },
  applyBtn: {
    padding: '12px 30px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '20px',
  },
  applicationList: {
    display: 'grid',
    gap: '20px',
  },
  applicationCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
  },
  jobTitle: {
    margin: '0 0 5px 0',
    fontSize: '20px',
    color: '#1a1a1a',
  },
  company: {
    margin: 0,
    color: '#6c757d',
    fontSize: '14px',
  },
  scoreBadge: {
    textAlign: 'center',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    minWidth: '80px',
  },
  scoreValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#007bff',
  },
  scoreLabel: {
    fontSize: '11px',
    color: '#6c757d',
  },
  statusSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '1px solid #e9ecef',
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
  },
  date: {
    color: '#6c757d',
    fontSize: '13px',
  },
  skillsContainer: {
    marginBottom: '20px',
  },
  skillGroup: {
    marginBottom: '10px',
  },
  skillLabel: {
    fontSize: '13px',
    color: '#495057',
    marginRight: '10px',
  },
  skills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '5px',
  },
  skill: {
    success: {
      padding: '4px 10px',
      backgroundColor: '#d4edda',
      color: '#155724',
      borderRadius: '15px',
      fontSize: '12px',
    },
    warning: {
      padding: '4px 10px',
      backgroundColor: '#fff3cd',
      color: '#856404',
      borderRadius: '15px',
      fontSize: '12px',
    },
    more: {
      padding: '4px 10px',
      backgroundColor: '#e9ecef',
      color: '#495057',
      borderRadius: '15px',
      fontSize: '12px',
    },
  },
  viewBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    color: '#007bff',
    border: '1px solid #007bff',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
};

export default MyApplications;