import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await authAPI.login(formData);
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) { setError(err.response?.data?.detail || 'Invalid credentials'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; }

        .auth-page {
          display: flex;
          height: 100vh;
          width: 100vw;
          font-family: 'Nunito', sans-serif;
          overflow: hidden;
          position: relative;
        }

        /* ── WHITE SIDE (left ~55%) ── */
        .white-side {
          position: relative;
          width: 60%;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          /* The diagonal cut — right edge is slanted */
          clip-path: polygon(0 0, 100% 0, 85% 100%, 0 100%);
          padding: 60px 80px 60px 100px;
          animation: revealWhite 0.7s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes revealWhite {
          from { clip-path: polygon(0 0, 0 0, 0 100%, 0 100%); }
          to   { clip-path: polygon(0 0, 100% 0, 85% 100%, 0 100%); }
        }

        .form-inner {
          width: 100%;
          max-width: 340px;
          animation: fadeUp 0.6s 0.15s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .brand-name {
          font-size: 20px;
          font-weight: 800;
          color: #2563eb;
          margin-bottom: 40px;
          letter-spacing: -0.3px;
        }
        .brand-name span { color: #0D9488; }

        .form-title {
          font-size: 24px;
          font-weight: 800;
          color: #1a1a2e;
          margin-bottom: 8px;
          text-align: center;
        }
        .form-sub {
          font-size: 13px;
          color: #6b7280;
          text-align: center;
          line-height: 1.55;
          margin-bottom: 30px;
        }

        .error-box {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 13px;
          margin-bottom: 16px;
          display: flex; gap: 8px; align-items: center;
        }

        .field { margin-bottom: 16px; }
        .field label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
        }
        .field-wrap { position: relative; }
        .field input {
          width: 100%;
          padding: 11px 14px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          font-family: 'Nunito', sans-serif;
          color: #111827;
          background: white;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .field input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .field input::placeholder { color: #9ca3af; font-size: 13px; }
        .field input.pr { padding-right: 42px; }

        .eye-btn {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #9ca3af; font-size: 15px; padding: 0;
        }
        .eye-btn:hover { color: #2563eb; }

        .field-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 8px;
        }
        .remember {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; color: #6b7280; cursor: pointer;
        }
        .remember input[type=checkbox] {
          accent-color: #2563eb; width: 14px; height: 14px;
        }
        .forgot-btn {
          background: none; border: none; cursor: pointer;
          font-size: 13px; color: #2563eb; font-weight: 600;
          font-family: 'Nunito', sans-serif; padding: 0;
        }
        .forgot-btn:hover { text-decoration: underline; }

        .login-btn {
          width: 100%;
          padding: 13px;
          background: #192e5d;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 15px;
          font-weight: 700;
          font-family: 'Nunito', sans-serif;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          margin-top: 20px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .login-btn:hover:not(:disabled) { background: #0f1f4d; transform: translateY(-1px); }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .divider {
          display: flex; align-items: center; gap: 10px;
          color: #9ca3af; font-size: 12px; margin: 20px 0;
          text-align: center;
        }
        .divider::before, .divider::after {
          content: ''; flex: 1; height: 1px; background: #e5e7eb;
        }

        .social-row {
          display: flex; justify-content: center; gap: 16px;
        }
        .social-btn {
          width: 44px; height: 44px;
          border: 1px solid #e5e7eb;
          border-radius: 50%;
          background: white;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 18px;
          transition: border-color 0.2s, box-shadow 0.2s;
          text-decoration: none;
        }
        .social-btn:hover {
          border-color: #0c1a3a;
          box-shadow: 0 2px 8px rgba(20, 37, 74, 0.15);
        }

        /* ── BLUE SIDE (right ~45%) ── */
        .blue-side {
          position: absolute;
          top: 0; right: 0; bottom: 0;
          width: 50%;
          background: #061f55;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
          animation: revealBlue 0.7s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes revealBlue {
          from { opacity: 0; transform: translateX(60px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .blue-content {
          text-align: center;
          padding: 60px 60px 60px 100px;
          animation: fadeUp 0.6s 0.25s ease both;
        }

        .blue-title {
          font-size: 26px;
          font-weight: 800;
          color: white;
          margin-bottom: 14px;
          line-height: 1.25;
        }
        .blue-sub {
          font-size: 14px;
          color: rgba(255,255,255,0.75);
          line-height: 1.65;
          margin-bottom: 36px;
          max-width: 280px;
        }
        .signup-btn {
          display: inline-block;
          padding: 12px 40px;
          border: 2px solid white;
          border-radius: 6px;
          background: transparent;
          color: white;
          font-size: 14px;
          font-weight: 700;
          font-family: 'Nunito', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .signup-btn:hover {
          background: white;
          color: #2563eb;
        }

        @media (max-width: 700px) {
          .blue-side { display: none; }
          .white-side {
            width: 100%;
            clip-path: none;
            padding: 40px 24px;
          }
        }
      `}</style>

      <div className="auth-page">
        {/* WHITE FORM — LEFT */}
        <div className="white-side">
          <div className="form-inner">
            <div className="brand-name">RECRUIT<span>-IQ</span></div>

            <h2 className="form-title">Log in to Your Account</h2>
            <p className="form-sub">
              Log in to your account so you can continue building<br />and editing your onboarding flows.
            </p>

            {error && <div className="error-box"><span>⚠️</span>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Email</label>
                <input
                  type="email" name="email"
                  placeholder="Enter your email address"
                  value={formData.email} onChange={handleChange}
                  required autoFocus
                />
              </div>

              <div className="field">
                <label>Password</label>
                <div className="field-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password} onChange={handleChange}
                    required className="pr"
                  />
                  <button type="button" className="eye-btn"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Logging in...' : 'LOG IN'}
              </button>
            </form>

            

            
          </div>
        </div>

        {/* BLUE PANEL — RIGHT */}
        <div className="blue-side">
          <div className="blue-content">
            <h2 className="blue-title">Don't Have an<br />Account Yet?</h2>
            <p className="blue-sub">
              Let's get you all set up so you can start creating<br />
              your first onboarding experience.
            </p>
            <button className="signup-btn" onClick={() => navigate('/register')}>
              SIGN UP
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;