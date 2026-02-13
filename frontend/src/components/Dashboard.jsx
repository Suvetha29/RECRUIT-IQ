import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);

  const API_BASE = "http://127.0.0.1:8000";

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      navigate('/login');
    } else {
      setUser(JSON.parse(userData));
      fetchJobs(token);
    }
  }, [navigate]);

  const fetchJobs = async (token) => {
    try {
      const response = await fetch(`${API_BASE}/api/jobs/`, {
        headers: {
          "Authorization": "Bearer " + token
        }
      });

      const data = await response.json();
      if (response.ok) {
        setJobs(data);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Dashboard</h2>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div style={styles.content}>
        <div style={styles.welcomeCard}>
          <h3>Welcome back, {user.full_name}! 👋</h3>
          <p style={styles.role}>Role: {user.role.toUpperCase()}</p>
        </div>

        <div style={styles.quickActions}>
          <h4>Quick Actions</h4>
          <div style={styles.actionGrid}>
            {/* HR SPECIFIC ACTIONS */}
            {user.role === 'hr' && (
              <>
                <div
                  style={styles.actionCard}
                  onClick={() => navigate('/create-job')}
                >
                  <div style={styles.icon}>➕</div>
                  <h5>Post New Job</h5>
                  <p>Create a new job posting</p>
                </div>

                {/* NEW: HR View Applicants Button */}
                <div
                  style={styles.actionCard}
                  onClick={() => navigate('/hr/applications')}
                >
                  <div style={styles.icon}>👥</div>
                  <h5>View Applicants</h5>
                  <p>Review candidate applications</p>
                </div>
              </>
            )}

            {/* CANDIDATE SPECIFIC ACTIONS */}
            {user.role === 'candidate' && (
              <>
                {/* NEW: Candidate Browse Jobs Button */}
                <div
                  style={styles.actionCard}
                  onClick={() => navigate('/jobs')}
                >
                  <div style={styles.icon}>💼</div>
                  <h5>Browse Jobs</h5>
                  <p>Find and apply to jobs</p>
                </div>

                {/* NEW: Candidate My Applications Button */}
                <div
                  style={styles.actionCard}
                  onClick={() => navigate('/my-applications')}
                >
                  <div style={styles.icon}>📋</div>
                  <h5>My Applications</h5>
                  <p>Track your job applications</p>
                </div>
              </>
            )}

            {/* COMMON ACTION FOR BOTH ROLES */}
            <div
              style={styles.actionCard}
              onClick={() => navigate('/jobs')}
            >
              <div style={styles.icon}>💼</div>
              <h5>View All Jobs</h5>
              <p>Browse available positions</p>
            </div>
          </div>
        </div>

        {/* JOB LIST SECTION */}
        <div style={styles.jobsSection}>
          <h3>
            {user.role === 'hr' ? 'Your Posted Jobs' : 'Recent Jobs'}
            {jobs.length > 0 && <span style={styles.jobCount}>({jobs.length})</span>}
          </h3>

          {jobs.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No jobs {user.role === 'hr' ? 'posted' : 'available'} yet.</p>
              {user.role === 'hr' && (
                <button 
                  style={styles.createJobBtn}
                  onClick={() => navigate('/create-job')}
                >
                  Post Your First Job
                </button>
              )}
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} style={styles.jobCard}>
                <div style={styles.jobHeader}>
                  <h4>{job.title}</h4>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: job.status === 'open' ? '#28a745' : '#dc3545'
                  }}>
                    {job.status}
                  </span>
                </div>
                <p><strong>Company:</strong> {job.company}</p>
                <p><strong>Location:</strong> {job.location}</p>
                <p><strong>Type:</strong> {job.job_type}</p>
                <p><strong>Experience:</strong> {job.experience_required}</p>
                
                {/* NEW: Action buttons for each job */}
                <div style={styles.jobActions}>
                  <button 
                    style={styles.viewJobBtn}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    View Details
                  </button>
                  
                  {user.role === 'candidate' && (
                    <button 
                      style={styles.applyJobBtn}
                      onClick={() => navigate(`/apply/${job.id}`)}
                    >
                      Apply Now
                    </button>
                  )}
                  
                  {user.role === 'hr' && (
                    <button 
                      style={styles.viewApplicantsBtn}
                      onClick={() => navigate('/hr/applications')}
                    >
                      View Applicants
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* NEW: ATS Stats Section for HR */}
        {user.role === 'hr' && jobs.length > 0 && (
          <div style={styles.statsSection}>
            <h3>📊 Quick Stats</h3>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>{jobs.length}</div>
                <div style={styles.statLabel}>Active Jobs</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>0</div>
                <div style={styles.statLabel}>Total Applicants</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>0%</div>
                <div style={styles.statLabel}>Avg ATS Score</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f0f2f5' },
  header: {
    backgroundColor: 'white',
    padding: '20px 40px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutBtn: {
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  content: { padding: '40px', maxWidth: '1200px', margin: '0 auto' },
  welcomeCard: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    marginBottom: '30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  role: { 
    color: '#007bff', 
    fontWeight: '600', 
    marginTop: '10px',
    fontSize: '14px',
  },
  quickActions: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    marginBottom: '30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  actionCard: {
    padding: '25px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'transform 0.2s, box-shadow 0.2s',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    },
  },
  icon: { fontSize: '40px', marginBottom: '15px' },
  jobsSection: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    marginBottom: '30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  jobCount: {
    marginLeft: '10px',
    fontSize: '16px',
    color: '#6c757d',
    fontWeight: 'normal',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  createJobBtn: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '15px',
  },
  jobCard: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '15px',
    border: '1px solid #e9ecef',
  },
  jobHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  jobActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #dee2e6',
  },
  viewJobBtn: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  },
  applyJobBtn: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  },
  viewApplicantsBtn: {
    padding: '8px 16px',
    backgroundColor: '#17a2b8',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  },
  statsSection: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  statCard: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6c757d',
    marginTop: '5px',
  },
};

export default Dashboard;