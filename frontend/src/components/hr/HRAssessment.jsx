import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const HRAssessment = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [timeLimit, setTimeLimit] = useState(20);
  const [passingScore, setPassingScore] = useState(60);
  const [questions, setQuestions] = useState([
    { question: '', options: ['', '', '', ''], correct_answer: 0 }
  ]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const addQuestion = () => {
    setQuestions([...questions, { question: '', options: ['', '', '', ''], correct_answer: 0 }]);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, value) => {
    const updated = [...questions];
    updated[index].question = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const updateCorrectAnswer = (qIndex, value) => {
    const updated = [...questions];
    updated[qIndex].correct_answer = parseInt(value);
    setQuestions(updated);
  };

  const handleSave = async () => {
    // Validate
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question.trim()) {
        setError(`Question ${i + 1} is empty!`);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!questions[i].options[j].trim()) {
          setError(`Question ${i + 1} Option ${j + 1} is empty!`);
          return;
        }
      }
    }

    setSaving(true);
    setError('');
    try {
      await api.post('/api/assessments/create', {
        job_id: parseInt(jobId),
        questions: questions,
        time_limit: timeLimit,
        passing_score: passingScore
      });
      setSuccess(true);
      setTimeout(() => navigate(`/hr/applications/${jobId}`), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save assessment.');
    } finally {
      setSaving(false);
    }
  };

  if (success) return (
    <div style={styles.center}>
      <div style={{fontSize:'60px'}}>✅</div>
      <h2 style={{color:'#0D9488'}}>Assessment Saved!</h2>
      <p style={{color:'#64748B'}}>Redirecting back to applicants...</p>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <button style={styles.backBtn} onClick={() => navigate(`/hr/applications/${jobId}`)}>
            ← Back to Applicants
          </button>
          <h1 style={styles.title}>📝 Create Skill Assessment</h1>
          <p style={styles.subtitle}>
            {questions.length} question{questions.length !== 1 ? 's' : ''} · 
            Pass score: {passingScore}% · 
            Time limit: {timeLimit} mins
          </p>
        </div>
        <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
          {saving ? '⏳ Saving...' : '✅ Save Assessment'}
        </button>
      </div>

      <div style={styles.content}>
        {error && <div style={styles.errorBox}>{error}</div>}

        {/* Settings */}
        <div style={styles.settingsCard}>
          <h3 style={styles.settingsTitle}>⚙️ Assessment Settings</h3>
          <div style={styles.settingsGrid}>
            <div style={styles.settingField}>
              <label style={styles.label}>⏱ Time Limit (minutes)</label>
              <input
                type="number"
                min="5"
                max="120"
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                style={styles.input}
              />
            </div>
            <div style={styles.settingField}>
              <label style={styles.label}>🎯 Passing Score (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={passingScore}
                onChange={(e) => setPassingScore(parseInt(e.target.value))}
                style={styles.input}
              />
            </div>
          </div>
        </div>

        {/* Questions */}
        {questions.map((q, qi) => (
          <div key={qi} style={styles.questionCard}>
            <div style={styles.questionHeader}>
              <span style={styles.questionNum}>Question {qi + 1}</span>
              <button
                onClick={() => removeQuestion(qi)}
                disabled={questions.length === 1}
                style={styles.removeBtn}
              >
                🗑️ Remove
              </button>
            </div>

            {/* Question Text */}
            <textarea
              rows={2}
              placeholder={`Enter question ${qi + 1} here...`}
              value={q.question}
              onChange={(e) => updateQuestion(qi, e.target.value)}
              style={styles.textarea}
            />

            {/* Options */}
            <div style={styles.optionsGrid}>
              {q.options.map((opt, oi) => (
                <div key={oi} style={styles.optionRow}>
                  <div style={{
                    ...styles.optionLabel,
                    backgroundColor: q.correct_answer === oi ? '#0D9488' : '#E2E8F0',
                    color: q.correct_answer === oi ? 'white' : '#64748B',
                  }}>
                    {['A', 'B', 'C', 'D'][oi]}
                  </div>
                  <input
                    type="text"
                    placeholder={`Option ${['A', 'B', 'C', 'D'][oi]}`}
                    value={opt}
                    onChange={(e) => updateOption(qi, oi, e.target.value)}
                    style={styles.optionInput}
                  />
                </div>
              ))}
            </div>

            {/* Correct Answer */}
            <div style={styles.correctRow}>
              <label style={styles.label}>✅ Correct Answer:</label>
              <select
                value={q.correct_answer}
                onChange={(e) => updateCorrectAnswer(qi, e.target.value)}
                style={styles.select}
              >
                <option value={0}>Option A</option>
                <option value={1}>Option B</option>
                <option value={2}>Option C</option>
                <option value={3}>Option D</option>
              </select>
            </div>
          </div>
        ))}

        {/* Add Question */}
        <button onClick={addQuestion} style={styles.addBtn}>
          ➕ Add Question
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#F8FAFC', paddingBottom: '40px' },
  center: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' },
  header: { backgroundColor: 'white', padding: '20px 40px', boxShadow: '0 2px 4px rgba(0,0,0,0.08)', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '14px', padding: '0 0 8px 0', display: 'block' },
  title: { margin: '0', fontSize: '24px', color: '#0D1B2A', fontWeight: 'bold' },
  subtitle: { margin: '4px 0 0', color: '#64748B', fontSize: '14px' },
  saveBtn: { padding: '12px 24px', backgroundColor: '#0D9488', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: '600' },
  content: { maxWidth: '800px', margin: '0 auto', padding: '0 20px' },
  errorBox: { backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '12px', borderRadius: '8px', marginBottom: '20px' },
  settingsCard: { backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  settingsTitle: { margin: '0 0 16px', fontSize: '16px', color: '#0D1B2A' },
  settingsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  settingField: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#374151' },
  input: { padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', outline: 'none' },
  questionCard: { backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  questionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  questionNum: { fontSize: '13px', fontWeight: '700', color: '#0D9488', textTransform: 'uppercase' },
  removeBtn: { background: 'none', border: '1px solid #FECACA', color: '#DC2626', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  textarea: { width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: '16px' },
  optionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' },
  optionRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  optionLabel: { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px', flexShrink: 0 },
  optionInput: { flex: 1, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', outline: 'none' },
  correctRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  select: { padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', backgroundColor: 'white', cursor: 'pointer' },
  addBtn: { width: '100%', padding: '14px', backgroundColor: 'white', border: '2px dashed #0D9488', color: '#0D9488', borderRadius: '12px', cursor: 'pointer', fontSize: '15px', fontWeight: '600', marginTop: '8px' },
};

export default HRAssessment;