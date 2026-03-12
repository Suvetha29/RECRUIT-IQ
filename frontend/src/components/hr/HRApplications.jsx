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
        <div style={modalStyles.header}>
          <h2 style={modalStyles.headerTitle}>📅 Schedule Interview</h2>
          <p style={modalStyles.headerSub}>{applicant.candidate_name} · {jobTitle}</p>
        </div>
        <div style={modalStyles.body}>
          {error && <div style={modalStyles.error}>{error}</div>}
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Interview Date <span style={{color:'red'}}>*</span></label>
            <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} style={modalStyles.input} />
            {date && <p style={modalStyles.preview}>📅 {formatDate(date)}</p>}
          </div>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Interview Time <span style={{color:'red'}}>*</span></label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={modalStyles.input} />
            {time && <p style={modalStyles.preview}>⏰ {time}</p>}
          </div>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Notes <span style={{color:'#888', fontWeight:'normal'}}>(Optional)</span></label>
            <textarea rows={3} placeholder="e.g. Video call via Jitsi Meet. Please be ready 5 mins early." value={notes} onChange={(e) => setNotes(e.target.value)} style={{...modalStyles.input, resize:'none'}} />
          </div>
          <div style={modalStyles.emailInfo}>
            <span style={{fontSize:'20px'}}>📧</span>
            <div>
              <p style={{margin:0, fontWeight:'600', fontSize:'14px'}}>Email + Jitsi link will be sent automatically</p>
              <p style={{margin:0, fontSize:'12px', color:'#666'}}>
                {applicant.candidate_name} will receive details at {applicant.candidate_email}
              </p>
            </div>
          </div>
          <div style={modalStyles.actions}>
            <button style={modalStyles.cancelBtn} onClick={onCancel}>Cancel</button>
            <button style={modalStyles.confirmBtn} onClick={handleConfirm}>✅ Confirm & Send Email</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Recording Upload Modal
const RecordingModal = ({ applicant, onConfirm, onCancel }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!file) { setError('Please select a recording file.'); return; }
    setUploading(true);
    const formData = new FormData();
    formData.append('application_id', applicant.application_id);
    formData.append('recording', file);
    try {
      const res = await api.post('/api/evaluation/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onConfirm(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.box}>
        <div style={{...modalStyles.header, background: 'linear-gradient(135deg, #0D9488, #0369a1)'}}>
          <h2 style={modalStyles.headerTitle}>🎙️ Upload Interview Recording</h2>
          <p style={modalStyles.headerSub}>{applicant.candidate_name}</p>
        </div>
        <div style={modalStyles.body}>
          {error && <div style={modalStyles.error}>{error}</div>}
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Recording File (mp3, mp4, wav, m4a)</label>
            <input
              type="file"
              accept=".mp3,.mp4,.wav,.m4a,.webm"
              onChange={(e) => setFile(e.target.files[0])}
              style={modalStyles.input}
            />
          </div>
          <div style={modalStyles.emailInfo}>
            <span style={{fontSize:'20px'}}>🤖</span>
            <div>
              <p style={{margin:0, fontWeight:'600', fontSize:'14px'}}>AI will automatically:</p>
              <p style={{margin:0, fontSize:'12px', color:'#666'}}>
                Transcribe audio → Evaluate performance → Give hire/reject recommendation
              </p>
            </div>
          </div>
          {uploading && (
            <div style={{textAlign:'center', padding:'20px', color:'#0D9488'}}>
              <p>⏳ Transcribing and evaluating... This may take 30-60 seconds.</p>
            </div>
          )}
          <div style={modalStyles.actions}>
            <button style={modalStyles.cancelBtn} onClick={onCancel} disabled={uploading}>Cancel</button>
            <button style={{...modalStyles.confirmBtn, backgroundColor:'#0D9488'}} onClick={handleUpload} disabled={uploading}>
              {uploading ? '⏳ Processing...' : '🚀 Upload & Evaluate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// AI Result Modal
const AIResultModal = ({ result, onClose }) => (
  <div style={modalStyles.overlay}>
    <div style={modalStyles.box}>
      <div style={{...modalStyles.header, background: result.recommendation === 'hire' ? 'linear-gradient(135deg, #22C55E, #16A34A)' : 'linear-gradient(135deg, #EF4444, #DC2626)'}}>
        <h2 style={modalStyles.headerTitle}>
          {result.recommendation === 'hire' ? '✅ Recommended: HIRE' : '❌ Recommended: REJECT'}
        </h2>
        <p style={modalStyles.headerSub}>AI Score: {result.ai_score}%</p>
      </div>
      <div style={modalStyles.body}>
        <div style={{marginBottom:'16px'}}>
          <p style={modalStyles.label}>📝 Summary</p>
          <p style={{fontSize:'14px', color:'#333'}}>{result.summary}</p>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px'}}>
          <div style={{backgroundColor:'#F0FDF4', borderRadius:'8px', padding:'12px'}}>
            <p style={{margin:0, fontWeight:'600', fontSize:'13px', color:'#16A34A'}}>💪 Strengths</p>
            <p style={{margin:'6px 0 0', fontSize:'13px', color:'#333'}}>{result.strengths}</p>
          </div>
          <div style={{backgroundColor:'#FEF2F2', borderRadius:'8px', padding:'12px'}}>
            <p style={{margin:0, fontWeight:'600', fontSize:'13px', color:'#DC2626'}}>⚠️ Weaknesses</p>
            <p style={{margin:'6px 0 0', fontSize:'13px', color:'#333'}}>{result.weaknesses}</p>
          </div>
        </div>
        {result.transcript && (
          <div style={{marginBottom:'16px'}}>
            <p style={modalStyles.label}>📄 Transcript Preview</p>
            <div style={{backgroundColor:'#F8FAFC', borderRadius:'8px', padding:'12px', maxHeight:'150px', overflowY:'auto', fontSize:'13px', color:'#555'}}>
              {result.transcript.substring(0, 500)}...
            </div>
          </div>
        )}
        <button style={{...modalStyles.confirmBtn, width:'100%'}} onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

const HRApplications = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [interviewModal, setInterviewModal] = useState(null);
  const [recordingModal, setRecordingModal] = useState(null);
  const [aiResult, setAiResult] = useState(null);

  useEffect(() => { fetchData(); }, [jobId]);

  const fetchData = async () => {
    try {
      const [appRes, jobRes] = await Promise.all([
        api.get(`/api/applications/job/${jobId}`),
        api.get(`/api/jobs/${jobId}`)
      ]);
      setApplicants(appRes.data);
      setJobTitle(jobRes.data.title);
    } catch (err) {
      setError('Failed to load applicants.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicant, newStatus) => {
    if (newStatus === 'interview') {
      setInterviewModal(applicant);
      return;
    }
    await submitStatusUpdate(applicant.application_id, newStatus, null, null, null);
  };

  const handleInterviewConfirm = async ({ date, time, notes }) => {
    await submitStatusUpdate(interviewModal.application_id, 'interview', date, time, notes);
    setInterviewModal(null);
    fetchData();
  };

  const handleRecordingConfirm = (result) => {
    setRecordingModal(null);
    setAiResult(result);
    fetchData();
  };

  const submitStatusUpdate = async (applicationId, status, date, time, notes) => {
    setUpdatingId(applicationId);
    try {
      await api.patch(`/api/applications/${applicationId}/status`, {
        status,
        interview_date: date || null,
        interview_time: time || null,
        interview_notes: notes || null,
      });
      setApplicants(prev =>
        prev.map(app =>
          app.application_id === applicationId ? { ...app, status } : app
        )
      );
      if (status === 'shortlisted') alert('✅ Candidate shortlisted! Email sent.');
      if (status === 'interview') alert('✅ Interview scheduled! Jitsi link + email sent to candidate.');
    } catch (err) {
      alert(typeof err.response?.data?.detail === 'string' ? err.response?.data?.detail : 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const generateOfferLetter = async (applicationId, candidateName) => {
    try {
      const response = await api.post(
        `/api/evaluation/offer-letter/${applicationId}`,
        {},
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Offer_Letter_${candidateName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate offer letter.');
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
          <h1 style={styles.title}><b>Application Tracking System</b></h1>
          <p style={styles.subtitle}>{jobTitle} · {applicants.length} applicant{applicants.length !== 1 ? 's' : ''} · Ranked by ATS Score</p>
        </div>
        <button
          style={styles.createAssessmentBtn}
          onClick={() => navigate(`/hr/assessment/${jobId}`)}
        >
          📝 Create Assessment
        </button>
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

                    {/* Assessment Result Badge */}
                    {app.assessment_result && (
                      <div style={{marginTop:'6px'}}>
                        <span style={{
                          fontSize:'12px', fontWeight:'600', padding:'3px 10px', borderRadius:'20px',
                          backgroundColor: app.assessment_result.passed ? '#d4edda' : '#f8d7da',
                          color: app.assessment_result.passed ? '#155724' : '#721c24'
                        }}>
                          {app.assessment_result.passed ? '✅ Assessment Passed' : '❌ Assessment Failed'} — {app.assessment_result.score}%
                        </span>
                      </div>
                    )}

                    {/* AI Evaluation Badge */}
                    {app.ai_score && (
                      <div style={{marginTop:'6px'}}>
                        <span style={{
                          fontSize:'12px', fontWeight:'600', padding:'3px 10px', borderRadius:'20px',
                          backgroundColor: app.ai_recommendation === 'hire' ? '#d4edda' : '#f8d7da',
                          color: app.ai_recommendation === 'hire' ? '#155724' : '#721c24'
                        }}>
                          🤖 AI Score: {app.ai_score}% — {app.ai_recommendation === 'hire' ? 'Recommend Hire' : 'Recommend Reject'}
                        </span>
                      </div>
                    )}
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

                    {/* Meet Link */}
                    {app.meet_link && (
                      <a href={app.meet_link} target="_blank" rel="noopener noreferrer" style={{...styles.resumeBtn, backgroundColor:'#EBF5FB', color:'#1A5276'}}>
                        🎥 Join Interview
                      </a>
                    )}

                    {/* Upload Recording */}
                    {app.status === 'interview' && (
                      <button
                        style={{...styles.resumeBtn, backgroundColor:'#F0FDF4', color:'#166534', border:'1px solid #BBF7D0', cursor:'pointer'}}
                        onClick={() => setRecordingModal(app)}
                      >
                        🎙️ Upload Recording
                      </button>
                    )}

                    {/* Generate Offer Letter */}
                    {app.status === 'hired' && (
                      <button
                        style={{...styles.resumeBtn, backgroundColor:'#FEF9C3', color:'#854D0E', border:'1px solid #FDE68A', cursor:'pointer'}}
                        onClick={() => generateOfferLetter(app.application_id, app.candidate_name)}
                      >
                        📄 Offer Letter
                      </button>
                    )}

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
                    {/* Interview Details */}
                    {app.meet_link && (
                      <div style={{marginBottom:'16px', backgroundColor:'#EBF5FB', borderRadius:'8px', padding:'14px'}}>
                        <p style={styles.sectionLabel}>🎥 Interview Scheduled</p>
                        <p style={{margin:'4px 0', fontSize:'14px'}}>📅 {app.interview_date} &nbsp; ⏰ {app.interview_time}</p>
                        <p style={{margin:'4px 0', fontSize:'13px', color:'#1A5276'}}>🔗 {app.meet_link}</p>
                      </div>
                    )}

                    {/* ATS Breakdown */}
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

                    {/* Cover Letter */}
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

      {/* Modals */}
      {interviewModal && (
        <InterviewModal
          applicant={interviewModal}
          jobTitle={jobTitle}
          onConfirm={handleInterviewConfirm}
          onCancel={() => setInterviewModal(null)}
        />
      )}

      {recordingModal && (
        <RecordingModal
          applicant={recordingModal}
          onConfirm={handleRecordingConfirm}
          onCancel={() => setRecordingModal(null)}
        />
      )}

      {aiResult && (
        <AIResultModal
          result={aiResult}
          onClose={() => setAiResult(null)}
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
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  backBtn: { background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '14px', padding: '0 0 8px 0' },
  title: { margin: '0', fontSize: '26px', color: '#1a1a1a' },
  subtitle: { margin: '4px 0 0 0', color: '#6c757d', fontSize: '14px' },
  createAssessmentBtn: {
    padding: '10px 20px', backgroundColor: '#0D9488', color: 'white',
    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600'
  },
  content: { maxWidth: '900px', margin: '0 auto', padding: '0 20px 40px' },
  errorBox: { background: '#f8d7da', border: '1px solid #f5c6cb', color: '#721c24', padding: '12px', borderRadius: '8px', marginBottom: '20px' },
  empty: { textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '12px' },
  card: { backgroundColor: 'white', borderRadius: '12px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' },
  cardMain: { padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' },
  rank: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e8f0fe', color: '#3d5afe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 },
  info: { flex: 1, minWidth: '200px' },
  name: { margin: '0', fontSize: '18px', color: '#1a1a1a' },
  email: { margin: '4px 0 0', color: '#6c757d', fontSize: '14px' },
  phone: { margin: '2px 0 0', color: '#6c757d', fontSize: '13px' },
  date: { margin: '4px 0 0', color: '#adb5bd', fontSize: '12px' },
  scoreBox: { padding: '12px 16px', borderRadius: '10px', textAlign: 'center', minWidth: '90px' },
  scoreLabel: { margin: '0', fontSize: '11px', fontWeight: '600', opacity: 0.7 },
  scoreValue: { margin: '4px 0 0', fontSize: '26px', fontWeight: 'bold' },
  actions: { display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px' },
  select: { width: '100%', padding: '8px 10px', border: '1px solid #dee2e6', borderRadius: '8px', fontSize: '13px', backgroundColor: 'white', cursor: 'pointer' },
  resumeBtn: { display: 'block', textAlign: 'center', padding: '8px', backgroundColor: '#f8f9fa', color: '#495057', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '500', border: '1px solid #dee2e6' },
  expandBtn: { padding: '8px', backgroundColor: 'white', border: '1px solid #dee2e6', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#6c757d' },
  expanded: { borderTop: '1px solid #f0f0f0', padding: '20px' },
  sectionLabel: { margin: '0 0 10px', fontSize: '13px', fontWeight: '600', color: '#6c757d' },
  feedbackGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' },
  feedbackItem: { backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '10px' },
  feedbackLabel: { margin: '0', fontSize: '11px', color: '#adb5bd' },
  feedbackValue: { margin: '4px 0 0', fontSize: '12px', fontWeight: '600', color: '#495057' },
  coverLetter: { backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '15px', fontSize: '14px', color: '#495057', whiteSpace: 'pre-wrap' },
};

const modalStyles = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  box: { backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  header: { background: 'linear-gradient(135deg, #f093fb, #f5576c)', padding: '24px', textAlign: 'center' },
  headerTitle: { margin: 0, color: 'white', fontSize: '22px' },
  headerSub: { margin: '6px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '14px' },
  body: { padding: '24px' },
  error: { background: '#f8d7da', color: '#721c24', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  field: { marginBottom: '18px' },
  label: { display: 'block', fontWeight: '600', fontSize: '14px', color: '#333', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 14px', border: '1px solid #dee2e6', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  preview: { margin: '6px 0 0', fontSize: '13px', color: '#6c757d', fontStyle: 'italic' },
  emailInfo: { display: 'flex', gap: '12px', alignItems: 'flex-start', backgroundColor: '#e8f4fd', borderRadius: '8px', padding: '14px', marginBottom: '20px' },
  actions: { display: 'flex', gap: '10px' },
  cancelBtn: { flex: 1, padding: '12px', backgroundColor: 'white', color: '#6c757d', border: '1px solid #dee2e6', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  confirmBtn: { flex: 2, padding: '12px', backgroundColor: '#f5576c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
};

export default HRApplications;