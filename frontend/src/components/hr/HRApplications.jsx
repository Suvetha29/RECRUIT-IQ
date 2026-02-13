import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobAPI, applicationAPI } from '../../services/api';

function HRApplications() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHRJobs();
  }, []);

  const fetchHRJobs = async () => {
    try {
      const response = await jobAPI.getAllJobs();
      setJobs(response.data);
      if (response.data.length > 0) {
        setSelectedJob(response.data[0].id);
        fetchApplications(response.data[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to load jobs');
      setLoading(false);
    }
  };

  const fetchApplications = async (jobId) => {
    setLoading(true);
    try {
      const response = await applicationAPI.getJobApplications(jobId);
      setApplications(response.data);
    } catch (err) {
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleJobChange = (jobId) => {
    setSelectedJob(jobId);
    fetchApplications(jobId);
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await applicationAPI.updateApplicationStatus(applicationId, newStatus);
      // Refresh applications
      fetchApplications(selectedJob);
    } catch (err) {
      setError('Failed to update status');
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

  if (loading && jobs.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading applications...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Candidate Applications</h2>
        <button style={styles.dashboardBtn} onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>

      {jobs.length === 0 ? (
        <div style={styles.emptyState}>
          <h3>No jobs posted yet</h3>
          <p>Post a job to start receiving applications</p>
          <button style={styles.postJobBtn} onClick={() => navigate('/create-job')}>
            Post a Job
          </button>
        </div>
      ) : (
        <>
          <div style={styles.jobSelector}>
            <label style={styles.label}>Select Job:</label>
            <select 
              style={styles.select}
              value={selectedJob || ''}
              onChange={(e) => handleJobChange(e.target.value)}
            >
              {jobs.map(job => (
                <option key={job.id} value={job.id}>
                  {job.title} - {job.applications_count || 0} applications
                </option>
              ))}
            </select>
          </div>

          {applications.applications && applications.applications.length > 0 ? (
            <>
              <div style={styles.statsCard}>
                <div style={styles.stat}>
                  <div style={styles.statValue}>{applications.total_applications}</div>
                  <div style={styles.statLabel}>Total Applications</div>
                </div>
                <div style={styles.stat}>
                  <div style={styles.statValue}>{applications.average_score}%</div>
                  <div style={styles.statLabel}>Avg ATS Score</div>
                </div>
              </div>

              <div style={styles.applicationList}>
                {applications.applications.map((app) => (
                  <div key={app.id} style={styles.applicationCard}>
                    <div style={styles.cardHeader}>
                      <div>
                        <h3 style={styles.candidateName}>{app.candidate_name}</h3>
                        <p style={styles.candidateEmail}>{app.candidate_email}</p>
                      </div>
                      <div style={styles.scoreBadge}>
                        <div style={styles.scoreValue}>{app.ats_score}%</div>
                        <div style={styles.scoreLabel}>ATS Score</div>
                      </div>
                    </div>

                    <div style={styles.skillsContainer}>
                      {app.matched_skills && app.matched_skills.length > 0 && (
                        <div style={styles.skillGroup}>
                          <span style={styles.skillLabel}>✅ Matched:</span>
                          <div style={styles.skills}>
                            {app.matched_skills.map((skill, i) => (
                              <span key={i} style={styles.skill.success}>{skill}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {app.missing_skills && app.missing_skills.length > 0 && (
                        <div style={styles.skillGroup}>
                          <span style={styles.skillLabel}>⚠️ Missing:</span>
                          <div style={styles.skills}>
                            {app.missing_skills.map((skill, i) => (
                              <span key={i} style={styles.skill.warning}>{skill}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={styles.statusSection}>
                      <select 
                        style={{
                          ...styles.statusSelect,
                          backgroundColor: getStatusColor(app.status),
                          color: 'white'
                        }}
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      >
                        <option value="new">New</option>
                        <option value="under_review">Under Review</option>
                        <option value="interviewed">Interviewed</option>
                        <option value="rejected">Rejected</option>
                        <option value="hired">Hired</option>
                      </select>
                      <span style={styles.date}>
                        Applied: {new Date(app.applied_date).toLocaleDateString()}
                      </span>
                    </div>

                    {app.resume_url && (
                      <a 
                        href={`http://localhost:8000${app.resume_url}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={styles.resumeLink}
                      >
                        📄 View Resume
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={styles.noApplications}>
              <h3>No applications yet</h3>
              <p>When candidates apply, they'll appear here</p>
            </div>
          )}
        </>
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
  dashboardBtn: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  jobSelector: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  label: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#495057',
  },
  select: {
    padding: '10px',
    fontSize: '16px',
    borderRadius: '6px',
    border: '1px solid #ced4da',
    flex: 1,
  },
  statsCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
  },
  stat: {
    textAlign: 'center',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6c757d',
    marginTop: '5px',
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
  candidateName: {
    margin: '0 0 5px 0',
    fontSize: '20px',
    color: '#1a1a1a',
  },
  candidateEmail: {
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
  },
  statusSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  statusSelect: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  date: {
    color: '#6c757d',
    fontSize: '13px',
  },
  resumeLink: {
    display: 'inline-block',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    color: '#007bff',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '14px',
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
    backgroundColor: 'white',
    borderRadius: '12px',
  },
  postJobBtn: {
    padding: '12px 30px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '20px',
  },
  noApplications: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '12px',
    color: '#6c757d',
  },
};

export default HRApplications;