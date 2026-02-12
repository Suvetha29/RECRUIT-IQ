import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const response = await authAPI.login(formData);
    console.log('Login Response:', response); // Debug log
    
    // Axios wraps the response in response.data
    const data = response.data;
    
    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect based on role
      navigate(data.user.role === 'hr' ? '/dashboard' : '/jobs');
    }
  } catch (err) {
    console.error('Login Error:', err); // Debug log
    setError(err.response?.data?.detail || 'Incorrect email or password');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-bold text-slate-900">Sign In</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-10 shadow-xl rounded-2xl border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-slate-700">Email</label>
              <input
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Password</label>
              <input
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 disabled:bg-indigo-400"
            >
              {loading ? 'Authenticating...' : 'Login'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            Don't have an account? <Link to="/register" className="text-indigo-600 font-bold">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;