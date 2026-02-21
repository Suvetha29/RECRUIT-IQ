import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import ApplicationStatus from '../applications/ApplicationStatus';

const STATUS_OPTIONS = [
  { value: 'pending',      label: '⏳ Pending' },
  { value: 'under_review', label: '🔍 Under Review' },
  { value: 'shortlisted',  label: '⭐ Shortlisted' },
  { value: 'interview',    label: '📅 Schedule Interview' },
  { value: 'hired',        label: '✅ Hired' },
  { value: 'rejected',     label: '❌ Rejected' },
];

// Interview Scheduler Modal
const InterviewModal = ({ applicant, jobTitle, onConfirm, onCancel }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const handleConfirm = () => {
    if (!date) { setError('Please select an interview date.'); return; }
    if (!time) { setError('Please select an interview time.'); return; }
    setError('');
    onConfirm({ date, time, notes });
  };

  const formatDate = (d) => {
    if (!d) return '';
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.box}>
        {/* Header */}
        <div style={modalStyles.header}>
          <h2 style={modalStyles.headerTitle}>📅 Schedule Interview</h2>
          <p style={modalStyles.headerSub}>{applicant.candidate_name} · {jobTitle}</p>
        </div>

        <div style={modalStyles.body}>
          {error && <div style={modalStyles.error}>{error}</div>}

          {/* Date Picker */}
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Interview Date <span style={{color:'red'}}>*</span></label>
            <input
              type="date"
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={modalStyles.input}
            />
            {date && <p style={modalStyles.preview}>📅 {formatDate(date)}</p>}
          </div>

          {/* Time Picker */}
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Interview Time <span style={{color:'red'}}>*</span></label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              style={modalStyles.input}
            />
            {time && <p style={modalStyles.preview}>⏰ {time}</p>}
          </div>

          {/* Notes */}
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Notes for Candidate <span style={{color:'#888', fontWeight:'normal'}}>(Optional)</span></label>
            <textarea
              rows={3}
              placeholder="e.g. This will be a video call via Google Meet. Please be ready 5 mins early."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{...modalStyles.input, resize:'none'}}
            />
          </div>

          {/* Email info */}
          <div style={modalStyles.emailInfo}>
            <span style={{fontSize:'20px'}}>📧</span>
            <div>
              <p style={{margin:0, fontWeight:'600', fontSize:'14px'}}>Email will be sent automatically</p>
              <p style={{margin:0, fontSize:'12px', color:'#666'}}>
                {applicant.candidate_name} will receive interview details at {applicant.candidate_email}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div style={modalStyles.actions}>
            <button style={modalStyles.cancelBtn} onClick={onCancel}>Cancel</button>
            <button style={modalStyles.confirmBtn} onClick={handleConfirm}>
              ✅ Confirm & Send Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HRApplications = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [interviewModal, setInterviewModal] = useState(null); // applicant to schedule interview for

  useEffect(() => { fetchData(); }, [jobId]);

  const fetchData = async () => {
    try {
      const [appRes, jobRes] = await Promise.all([
        api.get(`/api/applications/job/${jobId}`),
        api.get(`/api/jobs/${jobId}`)
      ]);
      setApplicants(appRes.data);
      setJobTitle(jobRes.data.title);
      setJobCompany(jobRes.data.company);
    } catch (err) {
      setError('Failed to load applicants.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicant, newStatus) => {
    // If interview status → open calendar modal
    if (newStatus === 'interview') {
      setInterviewModal(applicant);
      return;
    }
    await submitStatusUpdate(applicant.application_id, newStatus, null, null, null);
  };

  const handleInterviewConfirm = async ({ date, time, notes }) => {
    await submitStatusUpdate(
      interviewModal.application_id,
      'interview',
      date,
      time,
      notes
    );
    setInterviewModal(null);
  };

  const submitStatusUpdate = async (applicationId, status, date, time, notes) => {
    setUpdatingId(applicationId);
    try {
      await api.patch(`/api/applications/${applicationId}/status`, {
        status: status,
        interview_date: date ? date : null,
        interview_time: time ? time : null,
        interview_notes: notes ? notes : null,
       });
      setApplicants(prev =>
        prev.map(app =>
          app.application_id === applicationId ? { ...app, status } : app
        )
      );

      if (status === 'shortlisted') alert('Candidate shortlisted! Email sent.');
if (status === 'interview') alert('Interview scheduled! Email sent to candidate.'); 

    } catch (err) {
      alert(typeof err.response?.data?.detail === 'string' ? err.response?.data?.detail : 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return { color: '#155724', background: '#d4edda', border: '#c3e6cb' };
    if (score >= 50) return { color: '#856404', background: '#fff3cd', border: '#ffeeba' };
    if (score >= 30) return { color: '#7e4800', background: '#ffe8cc', border: '#ffd5a8' };
    return { color: '#721c24', background: '#f8d7da', border: '#f5c6cb' };
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p>Loading applicants...</p>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Back</button>
        <h1 style={styles.title}> <b> Application Tracking System </b> </h1>
          <p style={styles.subtitle}>{jobTitle} · {applicants.length} applicant{applicants.length !== 1 ? 's' : ''} · Ranked by ATS Score</p>
        </div>
      </div>

      <div style={styles.content}>
        {error && <div style={styles.errorBox}>{error}</div>}

        {applicants.length === 0 ? (
          <div style={styles.empty}>
            <div style={{fontSize:'60px'}}>👥</div>
            <h3>No applicants yet</h3>
            <p style={{color:'#6c757d'}}>Share the job listing to attract candidates.</p>
          </div>
        ) : (
          applicants.map((app, index) => {
            const scoreColors = getScoreColor(app.ats_score);
            return (
              <div key={app.application_id} style={styles.card}>
                <div style={styles.cardMain}>
                  {/* Rank */}
                  <div style={styles.rank}>#{index + 1}</div>

                  {/* Info */}
                  <div style={styles.info}>
                    <div style={{display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap'}}>
                      <h3 style={styles.name}>{app.candidate_name}</h3>
                      <ApplicationStatus status={app.status} size="sm" />
                    </div>
                    <p style={styles.email}>{app.candidate_email}</p>
                    {app.candidate_phone && <p style={styles.phone}>{app.candidate_phone}</p>}
                    <p style={styles.date}>Applied {new Date(app.applied_at).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}</p>
                  </div>

                  {/* ATS Score */}
                  <div style={{ ...styles.scoreBox, color: scoreColors.color, background: scoreColors.background, border: `1px solid ${scoreColors.border}` }}>
                    <p style={styles.scoreLabel}>ATS Score</p>
                    <p style={styles.scoreValue}>{Math.round(app.ats_score)}%</p>
                  </div>

                  {/* Actions */}
                  <div style={styles.actions}>
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app, e.target.value)}
                      disabled={updatingId === app.application_id}
                      style={styles.select}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>

                    <a href={app.resume_url} target="_blank" rel="noopener noreferrer" style={styles.resumeBtn}>
                      📄 Resume
                    </a>

                    <button
                      style={styles.expandBtn}
                      onClick={() => setExpandedId(expandedId === app.application_id ? null : app.application_id)}
                    >
                      {expandedId === app.application_id ? '▲ Less' : '▼ Details'}
                    </button>
                  </div>
                </div>

                {/* Expanded */}
                {expandedId === app.application_id && (
                  <div style={styles.expanded}>
                    {app.ats_feedback && (
                      <div>
                        <p style={styles.sectionLabel}>📊 ATS Breakdown</p>
                        <div style={styles.feedbackGrid}>
                          {app.ats_feedback.split('|').map((part, i) => {
                            const [label, value] = part.split(':');
                            if (!value || !label) return null;
                            return (
                              <div key={i} style={styles.feedbackItem}>
                                <p style={styles.feedbackLabel}>{label.trim()}</p>
                                <p style={styles.feedbackValue}>{value.trim()}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {app.cover_letter && (
                      <div style={{marginTop:'15px'}}>
                        <p style={styles.sectionLabel}>📝 Cover Letter</p>
                        <div style={styles.coverLetter}>{app.cover_letter}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Interview Modal */}
      {interviewModal && (
        <InterviewModal
          applicant={interviewModal}
          jobTitle={jobTitle}
          onConfirm={handleInterviewConfirm}
          onCancel={() => setInterviewModal(null)}
        />
      )}
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f0f2f5' },
  header: {
    backgroundColor: 'white', padding: '20px 40px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '30px',
  },
  backBtn: {
    background: 'none', border: 'none', color: '#007bff',
    cursor: 'pointer', fontSize: '14px', padding: '0 0 8px 0',
  },
  title: { margin: '0', fontSize: '26px', color: '#1a1a1a' },
  subtitle: { margin: '4px 0 0 0', color: '#6c757d', fontSize: '14px' },
  content: { maxWidth: '900px', margin: '0 auto', padding: '0 20px 40px' },
  errorBox: { background: '#f8d7da', border: '1px solid #f5c6cb', color: '#721c24', padding: '12px', borderRadius: '8px', marginBottom: '20px' },
  empty: { textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '12px' },
  card: { backgroundColor: 'white', borderRadius: '12px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' },
  cardMain: { padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' },
  rank: {
    width: '40px', height: '40px', borderRadius: '50%',
    backgroundColor: '#e8f0fe', color: '#3d5afe',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 'bold', fontSize: '14px', flexShrink: 0,
  },
  info: { flex: 1, minWidth: '200px' },
  name: { margin: '0', fontSize: '18px', color: '#1a1a1a' },
  email: { margin: '4px 0 0', color: '#6c757d', fontSize: '14px' },
  phone: { margin: '2px 0 0', color: '#6c757d', fontSize: '13px' },
  date: { margin: '4px 0 0', color: '#adb5bd', fontSize: '12px' },
  scoreBox: { padding: '12px 16px', borderRadius: '10px', textAlign: 'center', minWidth: '90px' },
  scoreLabel: { margin: '0', fontSize: '11px', fontWeight: '600', opacity: 0.7 },
  scoreValue: { margin: '4px 0 0', fontSize: '26px', fontWeight: 'bold' },
  actions: { display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px' },
  select: {
    width: '100%', padding: '8px 10px', border: '1px solid #dee2e6',
    borderRadius: '8px', fontSize: '13px', backgroundColor: 'white', cursor: 'pointer',
  },
  resumeBtn: {
    display: 'block', textAlign: 'center', padding: '8px',
    backgroundColor: '#f8f9fa', color: '#495057', borderRadius: '8px',
    textDecoration: 'none', fontSize: '13px', fontWeight: '500',
    border: '1px solid #dee2e6',
  },
  expandBtn: {
    padding: '8px', backgroundColor: 'white', border: '1px solid #dee2e6',
    borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#6c757d',
  },
  expanded: { borderTop: '1px solid #f0f0f0', padding: '20px' },
  sectionLabel: { margin: '0 0 10px', fontSize: '13px', fontWeight: '600', color: '#6c757d' },
  feedbackGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' },
  feedbackItem: { backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '10px' },
  feedbackLabel: { margin: '0', fontSize: '11px', color: '#adb5bd' },
  feedbackValue: { margin: '4px 0 0', fontSize: '12px', fontWeight: '600', color: '#495057' },
  coverLetter: { backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '15px', fontSize: '14px', color: '#495057', whiteSpace: 'pre-wrap' },
};

const modalStyles = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
  },
  box: { backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  header: { background: 'linear-gradient(135deg, #f093fb, #f5576c)', padding: '24px', textAlign: 'center' },
  headerTitle: { margin: 0, color: 'white', fontSize: '22px' },
  headerSub: { margin: '6px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '14px' },
  body: { padding: '24px' },
  error: { background: '#f8d7da', color: '#721c24', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  field: { marginBottom: '18px' },
  label: { display: 'block', fontWeight: '600', fontSize: '14px', color: '#333', marginBottom: '6px' },
  input: {
    width: '100%', padding: '10px 14px', border: '1px solid #dee2e6',
    borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  },
  preview: { margin: '6px 0 0', fontSize: '13px', color: '#6c757d', fontStyle: 'italic' },
  emailInfo: {
    display: 'flex', gap: '12px', alignItems: 'flex-start',
    backgroundColor: '#e8f4fd', borderRadius: '8px', padding: '14px', marginBottom: '20px',
  },
  actions: { display: 'flex', gap: '10px' },
  cancelBtn: {
    flex: 1, padding: '12px', backgroundColor: 'white', color: '#6c757d',
    border: '1px solid #dee2e6', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
  },
  confirmBtn: {
    flex: 2, padding: '12px', backgroundColor: '#f5576c', color: 'white',
    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
  },
};

export default HRApplications;
