import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { applicationAPI } from '../../services/api';

function ApplyJob() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [atsResult, setAtsResult] = useState(null);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileType = file.name.split('.').pop().toLowerCase();
      if (fileType !== 'pdf' && fileType !== 'docx') {
        setError('Please upload PDF or DOCX file only');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }
      setResume(file);
      setFileName(file.name);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resume) {
      setError('Please select a resume file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('resume', resume);

    try {
      const response = await applicationAPI.applyToJob(jobId, formData);
      setAtsResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error applying to job');
    } finally {
      setUploading(false);
    }
  };

  if (atsResult) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>🎉 Application Submitted!</h2>
          
          <div style={styles.scoreCard}>
            <div style={styles.scoreCircle}>
              <div style={styles.scoreNumber}>{atsResult.ats_score}%</div>
              <div style={styles.scoreLabel}>ATS Score</div>
            </div>
          </div>

          <div style={styles.statsGrid}>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{atsResult.skills_score}%</div>
              <div style={styles.statLabel}>Skills Match</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{atsResult.experience_score}%</div>
              <div style={styles.statLabel}>Experience</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{atsResult.keyword_score}%</div>
              <div style={styles.statLabel}>Keywords</div>
            </div>
          </div>

          <div style={styles.skillsSection}>
            {atsResult.matched_skills && atsResult.matched_skills.length > 0 && (
              <>
                <h3 style={styles.sectionTitle}>✅ Matched Skills</h3>
                <div style={styles.skillsList}>
                  {atsResult.matched_skills.map((skill, index) => (
                    <span key={index} style={styles.skillBadge.success}>
                      {skill}
                    </span>
                  ))}
                </div>
              </>
            )}

            {atsResult.missing_skills && atsResult.missing_skills.length > 0 && (
              <>
                <h3 style={styles.sectionTitle}>⚠️ Skills to Improve</h3>
                <div style={styles.skillsList}>
                  {atsResult.missing_skills.map((skill, index) => (
                    <span key={index} style={styles.skillBadge.warning}>
                      {skill}
                    </span>
                  ))}
                </div>
              </>
            )}

            {atsResult.recommendations && atsResult.recommendations.length > 0 && (
              <>
                <h3 style={styles.sectionTitle}>💡 Recommendations</h3>
                <ul style={styles.recommendations}>
                  {atsResult.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div style={styles.buttonGroup}>
            <button 
              style={styles.button.primary}
              onClick={() => navigate('/my-applications')}
            >
              View My Applications
            </button>
            <button 
              style={styles.button.secondary}
              onClick={() => navigate('/jobs')}
            >
              Browse More Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Apply for Job</h2>
        <p style={styles.subtitle}>Upload your resume (PDF or DOCX, max 5MB)</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.fileInput}>
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              disabled={uploading}
              id="resume-upload"
              style={{ display: 'none' }}
            />
            <label htmlFor="resume-upload" style={styles.fileLabel}>
              {fileName ? `📄 ${fileName}` : 'Choose Resume File'}
            </label>
          </div>

          <button 
            type="submit" 
            style={{
              ...styles.submitButton,
              opacity: (!resume || uploading) ? 0.6 : 1,
              cursor: (!resume || uploading) ? 'not-allowed' : 'pointer'
            }}
            disabled={!resume || uploading}
          >
            {uploading ? 'Analyzing Resume...' : 'Submit Application'}
          </button>
        </form>

        <p style={styles.note}>
          Your resume will be analyzed by our ATS system to calculate your match score
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    maxWidth: '600px',
    width: '100%',
  },
  title: {
    margin: '0 0 10px 0',
    color: '#1a1a1a',
    fontSize: '28px',
    textAlign: 'center',
  },
  subtitle: {
    margin: '0 0 20px 0',
    color: '#6c757d',
    fontSize: '16px',
    textAlign: 'center',
  },
  fileInput: {
    margin: '20px 0',
    padding: '30px',
    border: '2px dashed #007bff',
    borderRadius: '8px',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
  },
  fileLabel: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'inline-block',
  },
  submitButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
    border: '1px solid #f5c6cb',
  },
  note: {
    marginTop: '20px',
    color: '#6c757d',
    fontSize: '14px',
    textAlign: 'center',
  },
  scoreCard: {
    display: 'flex',
    justifyContent: 'center',
    margin: '20px 0',
  },
  scoreCircle: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #007bff, #00d4ff)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    boxShadow: '0 4px 10px rgba(0,123,255,0.3)',
  },
  scoreNumber: {
    fontSize: '48px',
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: '16px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px',
    margin: '30px 0',
  },
  statItem: {
    textAlign: 'center',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    fontSize: '12px',
    color: '#6c757d',
    marginTop: '5px',
  },
  skillsSection: {
    marginTop: '30px',
  },
  sectionTitle: {
    fontSize: '18px',
    margin: '20px 0 10px 0',
    color: '#1a1a1a',
  },
  skillsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '20px',
  },
  skillBadge: {
    success: {
      padding: '6px 12px',
      backgroundColor: '#d4edda',
      color: '#155724',
      borderRadius: '20px',
      fontSize: '14px',
      border: '1px solid #c3e6cb',
    },
    warning: {
      padding: '6px 12px',
      backgroundColor: '#fff3cd',
      color: '#856404',
      borderRadius: '20px',
      fontSize: '14px',
      border: '1px solid #ffeeba',
    },
  },
  recommendations: {
    listStyleType: 'disc',
    paddingLeft: '20px',
    color: '#495057',
    lineHeight: '1.6',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '30px',
  },
  button: {
    primary: {
      flex: 1,
      padding: '12px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
    },
    secondary: {
      flex: 1,
      padding: '12px',
      backgroundColor: '#6c757d',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
    },
  },
};

export default ApplyJob;