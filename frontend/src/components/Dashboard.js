import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = "http://127.0.0.1:8000";

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchJobs(token);
    }
  }, [navigate]);

  const fetchJobs = async (token) => {
    try {
      const response = await fetch(`${API_BASE}/api/jobs/`, {
        headers: {
          Authorization: "Bearer " + token
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

  const handleDelete = async (jobId) => {
    const token = localStorage.getItem("token");
    if (!window.confirm("Are you sure you want to delete this job?")) return;

    try {
      const response = await fetch(`${API_BASE}/api/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + token
        }
      });

      if (response.ok) {
        alert("Job deleted successfully");
        fetchJobs(token);
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleApply = async (jobId) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({
          resume_link: "",
          cover_letter: "I am interested in this position."
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Application submitted successfully!");
      } else {
        alert(data.detail);
      }
    } catch (error) {
      console.error("Apply error:", error);
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
            {user.role === 'hr' && (
              <div
                style={styles.actionCard}
                onClick={() => navigate('/create-job')}
              >
                <div style={styles.icon}>➕</div>
                <h5>Post New Job</h5>
                <p>Create a new job posting</p>
              </div>
            )}

            <div
              style={styles.actionCard}
              onClick={() => fetchJobs(localStorage.getItem("token"))}
            >
              <div style={styles.icon}>💼</div>
              <h5>Refresh Jobs</h5>
              <p>Reload latest job openings</p>
            </div>
          </div>
        </div>

        {/* JOB LIST */}
        <div style={styles.jobsSection}>
          <h3>Job Openings</h3>

          {jobs.length === 0 ? (
            <p>No jobs available.</p>
          ) : (
            jobs.map((job) => (
              <div key={job.id} style={styles.jobCard}>
                <h4>{job.title}</h4>
                <p><strong>Company:</strong> {job.company}</p>
                <p><strong>Location:</strong> {job.location}</p>
                <p><strong>Type:</strong> {job.job_type}</p>
                <p><strong>Experience:</strong> {job.experience_required}</p>
                <p><strong>Status:</strong> {job.status}</p>

                {/* HR Controls */}
                {user.role === "hr" && job.posted_by === user.id && (
                  <div style={styles.buttonGroup}>
                    <button
                      style={styles.editBtn}
                      onClick={() => navigate(`/edit-job/${job.id}`)}
                    >
                      Edit
                    </button>

                    <button
                      style={styles.deleteBtn}
                      onClick={() => handleDelete(job.id)}
                    >
                      Delete
                    </button>

                    <button
                      style={styles.viewBtn}
                      onClick={() => navigate(`/applications/${job.id}`)}
                    >
                      View Applicants
                    </button>
                  </div>
                )}

                {/* Candidate Apply */}
                {user.role === "candidate" && (
                  <div style={styles.buttonGroup}>
                    <button
                      style={styles.applyBtn}
                      onClick={() => handleApply(job.id)}
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
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
  },
  content: { padding: '40px', maxWidth: '1200px', margin: '0 auto' },
  welcomeCard: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    marginBottom: '30px',
  },
  role: { color: '#007bff', fontWeight: '600', marginTop: '10px' },
  quickActions: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    marginBottom: '30px',
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  actionCard: {
    padding: '30px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'center',
  },
  icon: { fontSize: '40px', marginBottom: '15px' },

  jobsSection: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
  },
  jobCard: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '15px',
  },
  buttonGroup: {
    marginTop: '15px',
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  editBtn: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  deleteBtn: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  applyBtn: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  viewBtn: {
    backgroundColor: '#6f42c1',
    color: 'white',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '5px',
    cursor: 'pointer'
  }
};

export default Dashboard;
