import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '', password: '', full_name: '', role: 'candidate', phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await authAPI.register(formData);
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) { setError(err.response?.data?.detail || 'Registration failed'); }
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

        /* ── BLUE SIDE — LEFT for register ── */
        .blue-side {
          position: absolute;
          top: 0; left: 0; bottom: 0;
          width: 50%;
          background: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
          animation: revealBlue 0.7s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes revealBlue {
          from { opacity: 0; transform: translateX(-60px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .blue-content {
          text-align: center;
          padding: 60px 100px 60px 60px;
          animation: fadeUp 0.6s 0.2s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .blue-title {
          font-size: 26px; font-weight: 800;
          color: white; margin-bottom: 14px; line-height: 1.25;
        }
        .blue-sub {
          font-size: 14px; color: rgba(255,255,255,0.75);
          line-height: 1.65; margin-bottom: 36px; max-width: 280px;
        }
        .login-btn-blue {
          display: inline-block;
          padding: 12px 40px;
          border: 2px solid white; border-radius: 6px;
          background: transparent; color: white;
          font-size: 14px; font-weight: 700;
          font-family: 'Nunito', sans-serif;
          cursor: pointer; transition: all 0.2s;
          letter-spacing: 1px; text-transform: uppercase;
        }
        .login-btn-blue:hover { background: white; color: #2563eb; }

        /* ── WHITE FORM — RIGHT for register, diagonal left edge ── */
        .white-side {
          position: absolute;
          top: 0; right: 0; bottom: 0;
          width: 60%;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          clip-path: polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%);
          padding: 40px 100px 40px 80px;
          animation: revealWhite 0.7s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes revealWhite {
          from { clip-path: polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%); }
          to   { clip-path: polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%); }
        }

        .form-inner {
          width: 100%; max-width: 380px;
          animation: fadeUp 0.6s 0.15s ease both;
        }

        .brand-name {
          font-size: 20px; font-weight: 800;
          color: #2563eb; margin-bottom: 32px; letter-spacing: -0.3px;
        }
        .brand-name span { color: #0D9488; }

        .form-title {
          font-size: 22px; font-weight: 800;
          color: #1a1a2e; margin-bottom: 6px; text-align: center;
        }
        .form-sub {
          font-size: 13px; color: #6b7280;
          text-align: center; line-height: 1.55; margin-bottom: 24px;
        }

        .error-box {
          background: #fef2f2; border: 1px solid #fecaca;
          color: #991b1b; padding: 10px 14px;
          border-radius: 6px; font-size: 13px; margin-bottom: 14px;
          display: flex; gap: 8px; align-items: center;
        }

        .row2 { display: flex; gap: 12px; }
        .field { margin-bottom: 14px; flex: 1; }
        .field label {
          display: block; font-size: 13px; font-weight: 600;
          color: #374151; margin-bottom: 5px;
        }
        .field-wrap { position: relative; }
        .field input, .field select {
          width: 100%; padding: 10px 14px;
          border: 1px solid #d1d5db; border-radius: 6px;
          font-size: 13.5px; font-family: 'Nunito', sans-serif;
          color: #111827; background: white; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          appearance: none;
        }
        .field input:focus, .field select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .field input::placeholder { color: #9ca3af; font-size: 13px; }
        .field input.pr { padding-right: 40px; }

        .eye-btn {
          position: absolute; right: 11px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #9ca3af; font-size: 14px; padding: 0;
        }
        .eye-btn:hover { color: #2563eb; }

        .role-label { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
        .role-row { display: flex; gap: 10px; margin-bottom: 14px; }
        .role-tab {
          flex: 1; padding: 9px 8px;
          border: 1px solid #d1d5db; border-radius: 6px;
          background: white; cursor: pointer; text-align: center;
          font-size: 13px; font-weight: 600; color: #6b7280;
          transition: all 0.2s; font-family: 'Nunito', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 5px;
        }
        .role-tab:hover { border-color: #2563eb; color: #2563eb; }
        .role-tab.active { border-color: #2563eb; background: #eff6ff; color: #2563eb; }

        .terms-row {
          display: flex; align-items: flex-start; gap: 8px;
          margin-bottom: 16px; font-size: 13px; color: #6b7280;
        }
        .terms-row input[type=checkbox] {
          accent-color: #2563eb; width: 14px; height: 14px;
          margin-top: 2px; flex-shrink: 0;
        }
        .terms-row a { color: #2563eb; text-decoration: none; font-weight: 600; }
        .terms-row a:hover { text-decoration: underline; }

        .signup-btn {
          width: 100%; padding: 12px;
          background: #2563eb; color: white;
          border: none; border-radius: 6px;
          font-size: 15px; font-weight: 700;
          font-family: 'Nunito', sans-serif;
          cursor: pointer; transition: background 0.2s, transform 0.15s;
          letter-spacing: 0.5px; text-transform: uppercase;
        }
        .signup-btn:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); }
        .signup-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .divider {
          display: flex; align-items: center; gap: 10px;
          color: #9ca3af; font-size: 12px; margin: 16px 0;
        }
        .divider::before, .divider::after {
          content: ''; flex: 1; height: 1px; background: #e5e7eb;
        }

        .social-row { display: flex; justify-content: center; gap: 14px; }
        .social-btn {
          width: 40px; height: 40px; border: 1px solid #e5e7eb;
          border-radius: 50%; background: white;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .social-btn:hover {
          border-color: #2563eb;
          box-shadow: 0 2px 8px rgba(37,99,235,0.15);
        }

        @media (max-width: 700px) {
          .blue-side { display: none; }
          .white-side {
            width: 100%; clip-path: none;
            padding: 36px 24px; position: relative;
          }
        }
      `}</style>

      <div className="auth-page">

        {/* BLUE PANEL — LEFT */}
        <div className="blue-side">
          <div className="blue-content">
            <h2 className="blue-title">Already<br />Signed up?</h2>
            <p className="blue-sub">
              Log in to your account so you can continue building<br />
              and editing your onboarding flows.
            </p>
            <button className="login-btn-blue" onClick={() => navigate('/login')}>
              LOG IN
            </button>
          </div>
        </div>

        {/* WHITE FORM — RIGHT */}
        <div className="white-side">
          <div className="form-inner">
            <div className="brand-name">RECRUIT<span>-IQ</span></div>

            <h2 className="form-title">Sign Up for an Account</h2>
            <p className="form-sub">
              Let's get you all set up so you can start creating<br />your first onboarding experience.
            </p>

            {error && <div className="error-box"><span>⚠️</span>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="row2">
                <div className="field">
                  <label>First Name</label>
                  <input type="text" name="full_name" placeholder="Your first name"
                    value={formData.full_name} onChange={handleChange} required />
                </div>
                <div className="field">
                  <label>Phone <span style={{color:'#9ca3af', fontWeight:400, fontSize:'11px'}}>(opt.)</span></label>
                  <input type="tel" name="phone" placeholder="+91 98765"
                    value={formData.phone} onChange={handleChange} />
                </div>
              </div>

              <div className="field">
                <label>Email</label>
                <input type="email" name="email" placeholder="Enter your email address"
                  value={formData.email} onChange={handleChange} required />
              </div>

              <div className="field">
                <label>Password</label>
                <div className="field-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password" placeholder="Enter a strong password"
                    value={formData.password} onChange={handleChange}
                    required className="pr"
                  />
                  <button type="button" className="eye-btn"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <p className="role-label">I am joining as</p>
              <div className="role-row">
                <button type="button"
                  className={`role-tab ${formData.role === 'candidate' ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, role: 'candidate'})}>
                  🎓 Candidate
                </button>
                <button type="button"
                  className={`role-tab ${formData.role === 'hr' ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, role: 'hr'})}>
                  💼 HR / Recruiter
                </button>
              </div>

              <label className="terms-row">
                <input type="checkbox" required />
                <span>I accept RECRUIT-IQ's <button type="button" style={{background:'none',border:'none',color:'#2563eb',fontWeight:600,cursor:'pointer',padding:0,fontSize:'inherit',fontFamily:'inherit'}}>Terms &amp; Conditions</button></span>
              </label>

              <button type="submit" className="signup-btn" disabled={loading}>
                {loading ? 'Creating account...' : 'SIGN UP'}
              </button>
            </form>

            <div className="divider">Or sign up using</div>
            <div className="social-row">
              <button className="social-btn" title="Google">
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              </button>
              <button className="social-btn" title="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </button>
              <button className="social-btn" title="Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#1DA1F2" d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

export default Register;