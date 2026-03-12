import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const Assessment = () => {
  const { jobId, applicationId } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAssessment();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0 || result) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, result]);

  const fetchAssessment = async () => {
    try {
      const res = await api.get(`/api/assessments/${jobId}`);
      setAssessment(res.data);
      setAnswers(new Array(res.data.questions.length).fill(-1));
      setTimeLeft(res.data.time_limit * 60);
    } catch (err) {
      setError('No assessment found for this job.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post('/api/assessments/submit', {
        application_id: parseInt(applicationId),
        answers: answers
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft > 300) return '#22C55E';
    if (timeLeft > 60) return '#F59E0B';
    return '#EF4444';
  };

  if (loading) return (
    <div style={styles.center}>
      <div style={{fontSize:'40px'}}>⏳</div>
      <p>Loading assessment...</p>
    </div>
  );

  if (error) return (
    <div style={styles.center}>
      <div style={{fontSize:'40px'}}>❌</div>
      <p style={{color:'#EF4444'}}>{error}</p>
      <button onClick={() => navigate('/my-applications')} style={styles.btn}>
        Back to Applications
      </button>
    </div>
  );

  // Result screen
  if (result) return (
    <div style={styles.center}>
      <div style={{fontSize:'60px'}}>{result.passed ? '🎉' : '😔'}</div>
      <h2 style={{color: result.passed ? '#22C55E' : '#EF4444', fontSize:'28px'}}>
        {result.passed ? 'Congratulations! You Passed!' : 'Better Luck Next Time'}
      </h2>
      <div style={styles.resultBox}>
        <div style={styles.resultStat}>
          <p style={styles.statNum}>{result.score}%</p>
          <p style={styles.statLabel}>Your Score</p>
        </div>
        <div style={styles.resultStat}>
          <p style={styles.statNum}>{result.correct}/{result.total}</p>
          <p style={styles.statLabel}>Correct Answers</p>
        </div>
      </div>
      <p style={{color:'#64748B', textAlign:'center', maxWidth:'400px'}}>{result.message}</p>
      <button onClick={() => navigate('/my-applications')} style={styles.btn}>
        View My Applications
      </button>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📝 Skill Assessment</h1>
          <p style={styles.subtitle}>{assessment?.total_questions} Questions · Pass score: {assessment?.passing_score}%</p>
        </div>
        <div style={{...styles.timer, color: getTimerColor(), borderColor: getTimerColor()}}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress bar */}
      <div style={styles.progressBar}>
        <div style={{
          ...styles.progressFill,
          width: `${(answers.filter(a => a !== -1).length / assessment.questions.length) * 100}%`
        }} />
      </div>
      <p style={styles.progressText}>
        {answers.filter(a => a !== -1).length} of {assessment.questions.length} answered
      </p>

      {/* Questions */}
      <div style={styles.questions}>
        {assessment.questions.map((q, qi) => (
          <div key={qi} style={styles.questionCard}>
            <p style={styles.questionNum}>Question {qi + 1}</p>
            <p style={styles.questionText}>{q.question}</p>
            <div style={styles.options}>
              {q.options.map((opt, oi) => (
                <button
                  key={oi}
                  onClick={() => {
                    const newAnswers = [...answers];
                    newAnswers[qi] = oi;
                    setAnswers(newAnswers);
                  }}
                  style={{
                    ...styles.option,
                    backgroundColor: answers[qi] === oi ? '#0D9488' : 'white',
                    color: answers[qi] === oi ? 'white' : '#1E293B',
                    borderColor: answers[qi] === oi ? '#0D9488' : '#E2E8F0',
                  }}
                >
                  <span style={styles.optionLetter}>
                    {['A', 'B', 'C', 'D'][oi]}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <div style={styles.submitArea}>
        <p style={{color:'#64748B', fontSize:'14px'}}>
          {answers.filter(a => a !== -1).length < assessment.questions.length
            ? `⚠️ ${assessment.questions.length - answers.filter(a => a !== -1).length} questions unanswered`
            : '✅ All questions answered!'}
        </p>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{...styles.submitBtn, opacity: submitting ? 0.7 : 1}}
        >
          {submitting ? 'Submitting...' : '✅ Submit Assessment'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#F8FAFC', paddingBottom: '40px' },
  center: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' },
  header: { backgroundColor: 'white', padding: '20px 40px', boxShadow: '0 2px 4px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { margin: 0, fontSize: '22px', color: '#0D1B2A', fontWeight: 'bold' },
  subtitle: { margin: '4px 0 0', color: '#64748B', fontSize: '14px' },
  timer: { fontSize: '24px', fontWeight: 'bold', border: '2px solid', borderRadius: '12px', padding: '8px 20px' },
  progressBar: { height: '6px', backgroundColor: '#E2E8F0', margin: '0 40px', borderRadius: '3px' },
  progressFill: { height: '100%', backgroundColor: '#0D9488', borderRadius: '3px', transition: 'width 0.3s' },
  progressText: { textAlign: 'right', margin: '6px 40px 20px', fontSize: '12px', color: '#64748B' },
  questions: { maxWidth: '800px', margin: '0 auto', padding: '0 20px' },
  questionCard: { backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  questionNum: { margin: '0 0 8px', fontSize: '12px', color: '#0D9488', fontWeight: '600', textTransform: 'uppercase' },
  questionText: { margin: '0 0 16px', fontSize: '16px', color: '#1E293B', fontWeight: '500', lineHeight: 1.5 },
  options: { display: 'flex', flexDirection: 'column', gap: '8px' },
  option: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', border: '2px solid', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', textAlign: 'left', transition: 'all 0.2s' },
  optionLetter: { width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 },
  submitArea: { maxWidth: '800px', margin: '20px auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  submitBtn: { padding: '14px 32px', backgroundColor: '#0D9488', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  btn: { padding: '12px 24px', backgroundColor: '#0D9488', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  resultBox: { display: 'flex', gap: '40px', margin: '20px 0' },
  resultStat: { textAlign: 'center' },
  statNum: { fontSize: '40px', fontWeight: 'bold', color: '#0D1B2A', margin: 0 },
  statLabel: { fontSize: '14px', color: '#64748B', margin: '4px 0 0' },
};

export default Assessment;