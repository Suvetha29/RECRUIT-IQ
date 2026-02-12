import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'candidate',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const response = await authAPI.register(formData);
    const data = response.data;
    
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    navigate('/dashboard');
  } catch (err) {
    setError(err.response?.data?.detail || 'Registration failed');
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={styles.container}>
      <div style={styles.formBox}>
        <h2>Register</h2>
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            type="text"
            name="full_name"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={handleChange}
            required
          />
          
          <input
            style={styles.input}
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          
          <input
            style={styles.input}
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          
          <input
            style={styles.input}
            type="tel"
            name="phone"
            placeholder="Phone (optional)"
            value={formData.phone}
            onChange={handleChange}
          />
          
          <select
            style={styles.input}
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="candidate">Candidate</option>
            <option value="hr">HR/Recruiter</option>
          </select>
          
          <button 
            style={styles.button} 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <p style={styles.link}>
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  formBox: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  error: {
    padding: '10px',
    marginBottom: '15px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
  },
  link: {
    marginTop: '15px',
    textAlign: 'center',
    fontSize: '14px',
  },
};

export default Register;