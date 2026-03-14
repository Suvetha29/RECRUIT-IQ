import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import NotificationBell from './common/NotificationBell';

function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form
  const [profile, setProfile] = useState({ full_name: '', email: '', phone: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError]     = useState('');

  // Password form
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [showCurrent, setShowCurrent]   = useState(false);
  const [showNew, setShowNew]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [passLoading, setPassLoading]   = useState(false);
  const [passSuccess, setPassSuccess]   = useState('');
  const [passError, setPassError]       = useState('');

  const isHR = user?.role === 'hr';

  const navItems = isHR ? [
    { icon: '⊞', label: 'Dashboard',   path: '/dashboard' },
    { icon: '💼', label: 'All Jobs',    path: '/jobs' },
    { icon: '➕', label: 'Post Job',    path: '/create-job' },
    { icon: '🗂️', label: 'Pipeline',   path: '/hr/kanban' },
  ] : [
    { icon: '⊞', label: 'Dashboard',   path: '/dashboard' },
    { icon: '🔍', label: 'Browse Jobs', path: '/jobs' },
    { icon: '📋', label: 'Applications',path: '/my-applications' },
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token    = localStorage.getItem('token');
    if (!userData || !token) { navigate('/login'); return; }
    const u = JSON.parse(userData);
    setUser(u);
    setProfile({ full_name: u.full_name || '', email: u.email || '', phone: u.phone || '' });
  }, [navigate]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileError(''); setProfileSuccess(''); setProfileLoading(true);
    try {
      const res = await api.patch('/api/auth/profile', profile);
      const updated = { ...user, ...res.data };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err) {
      setProfileError(err.response?.data?.detail || 'Failed to update profile.');
    } finally { setProfileLoading(false); }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPassError(''); setPassSuccess('');
    if (passwords.new_password !== passwords.confirm_password) {
      setPassError('New passwords do not match.'); return;
    }
    if (passwords.new_password.length < 6) {
      setPassError('Password must be at least 6 characters.'); return;
    }
    setPassLoading(true);
    try {
      await api.patch('/api/auth/change-password', {
        current_password: passwords.current_password,
        new_password:     passwords.new_password,
      });
      setPassSuccess('Password changed successfully!');
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setPassSuccess(''), 3000);
    } catch (err) {
      setPassError(err.response?.data?.detail || 'Failed to change password.');
    } finally { setPassLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
        html, body, #root { height: 100%; }

        .set-root {
          display: flex; min-height: 100vh;
          font-family: 'Nunito', sans-serif;
          background: #f0f4f8;
        }

        /* ── SIDEBAR ── */
        .sidebar {
          width: 220px; flex-shrink: 0;
          background: #1a1d2e;
          display: flex; flex-direction: column;
          min-height: 100vh; position: sticky; top: 0;
          box-shadow: 2px 0 12px rgba(0,0,0,0.15);
        }
        .sb-brand {
          display: flex; align-items: center; gap: 10px;
          padding: 22px 18px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .sb-brand-icon {
          width: 36px; height: 36px; background: #2563eb;
          border-radius: 9px; display: flex; align-items: center;
          justify-content: center; font-size: 18px;
        }
        .sb-brand-name { font-size: 15px; font-weight: 800; color: white; }
        .sb-brand-name span { color: #60a5fa; }
        .sb-profile {
          display: flex; flex-direction: column; align-items: center;
          padding: 22px 18px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .sb-avatar {
          width: 62px; height: 62px; border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #0D9488);
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; font-weight: 800; color: white;
          margin-bottom: 10px;
          border: 3px solid rgba(255,255,255,0.12);
          box-shadow: 0 4px 12px rgba(37,99,235,0.4);
        }
        .sb-uname { font-size: 13.5px; font-weight: 700; color: white; }
        .sb-urole { font-size: 11px; color: #60a5fa; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 3px; }
        .sb-nav { flex: 1; padding: 14px 0; }
        .sb-section-label {
          font-size: 9.5px; font-weight: 700; color: rgba(255,255,255,0.28);
          text-transform: uppercase; letter-spacing: 1.2px; padding: 10px 18px 5px;
        }
        .sb-item {
          display: flex; align-items: center; gap: 11px;
          padding: 10px 18px; cursor: pointer;
          font-size: 13px; font-weight: 600;
          color: rgba(255,255,255,0.55);
          border-left: 3px solid transparent;
          transition: all 0.18s;
        }
        .sb-item:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.9); }
        .sb-item.active { background: rgba(37,99,235,0.2); color: white; border-left-color: #2563eb; }
        .sb-item .si { font-size: 15px; width: 20px; text-align: center; }
        .sb-logout { padding: 14px 18px; border-top: 1px solid rgba(255,255,255,0.06); }
        .sb-logout-btn {
          width: 100%; padding: 10px;
          background: rgba(220,38,38,0.12);
          border: 1px solid rgba(220,38,38,0.25);
          border-radius: 8px; color: #fca5a5;
          font-size: 13px; font-weight: 700;
          font-family: 'Nunito', sans-serif;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .sb-logout-btn:hover { background: rgba(220,38,38,0.28); color: white; }

        /* ── MAIN ── */
        .main-area { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
        .topbar {
          background: white; padding: 0 30px;
          display: flex; align-items: center; justify-content: space-between;
          height: 62px; flex-shrink: 0;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          position: sticky; top: 0; z-index: 50;
        }
        .topbar-left h2 { font-size: 17px; font-weight: 800; color: #1a1d2e; }
        .topbar-left p  { font-size: 11.5px; color: #9ca3af; margin-top: 1px; }
        .topbar-right   { display: flex; align-items: center; gap: 14px; }

        .page { padding: 28px 32px; width: 100%; }
        .settings-card { max-width: 100%; }

        /* ── SETTINGS CARD ── */
        .settings-card {
          background: white; border-radius: 16px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          overflow: hidden;
        }

        /* ── PROFILE HEADER ── */
        .profile-banner {
          background: linear-gradient(135deg, #1a1d2e 0%, #2563eb 60%, #0D9488 100%);
          padding: 32px 32px 60px;
          position: relative;
        }
        .profile-banner-title { font-size: 20px; font-weight: 800; color: white; }
        .profile-banner-sub   { font-size: 13px; color: rgba(255,255,255,0.7); margin-top: 4px; }

        .profile-avatar-wrap {
          position: absolute; bottom: -36px; left: 32px;
        }
        .profile-big-avatar {
          width: 72px; height: 72px; border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #0D9488);
          display: flex; align-items: center; justify-content: center;
          font-size: 30px; font-weight: 800; color: white;
          border: 4px solid white;
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }

        /* ── TABS ── */
        .tabs-row {
          display: flex; gap: 0;
          padding: 0 32px;
          margin-top: 48px;
          border-bottom: 1px solid #f3f4f6;
        }
        .tab-btn {
          padding: 12px 20px; border: none; background: none;
          font-size: 13.5px; font-weight: 700; color: #9ca3af;
          cursor: pointer; font-family: 'Nunito', sans-serif;
          border-bottom: 2px solid transparent; margin-bottom: -1px;
          transition: all 0.18s; display: flex; align-items: center; gap: 7px;
        }
        .tab-btn:hover { color: #1a1d2e; }
        .tab-btn.active { color: #2563eb; border-bottom-color: #2563eb; }

        /* ── FORM ── */
        .form-body { padding: 28px 32px 32px; max-width: 780px; }

        .form-section-title {
          font-size: 14px; font-weight: 800; color: #1a1d2e;
          margin-bottom: 20px; padding-bottom: 10px;
          border-bottom: 1px solid #f3f4f6;
          display: flex; align-items: center; gap: 8px;
        }

        .form-row { display: flex; gap: 16px; margin-bottom: 18px; }
        .form-row.single { flex-direction: column; }

        .field { flex: 1; }
        .field label {
          display: block; font-size: 11.5px; font-weight: 700;
          color: #374151; margin-bottom: 6px; letter-spacing: 0.3px;
          text-transform: uppercase;
        }
        .field-wrap { position: relative; }
        .field input {
          width: 100%; padding: 11px 14px;
          border: 1.5px solid #e5e7eb; border-radius: 10px;
          font-size: 14px; font-family: 'Nunito', sans-serif;
          color: #1a1d2e; background: #fafbfc; outline: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
        }
        .field input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
          background: white;
        }
        .field input::placeholder { color: #9ca3af; }
        .field input.pr { padding-right: 44px; }
        .field input:disabled {
          background: #f3f4f6; color: #9ca3af; cursor: not-allowed;
        }

        .eye-btn {
          position: absolute; right: 13px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #9ca3af; font-size: 16px; padding: 0;
        }
        .eye-btn:hover { color: #2563eb; }

        .field-hint { font-size: 11px; color: #9ca3af; margin-top: 5px; }

        /* password strength */
        .strength-bar { display: flex; gap: 4px; margin-top: 8px; }
        .strength-seg {
          flex: 1; height: 4px; border-radius: 2px; background: #e5e7eb;
          transition: background 0.2s;
        }

        /* alerts */
        .alert {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px; border-radius: 10px;
          font-size: 13px; font-weight: 600; margin-bottom: 20px;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn { from { opacity:0; transform: translateY(-6px); } to { opacity:1; transform: translateY(0); } }
        .alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
        .alert-error   { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }

        /* save button */
        .save-row { display: flex; justify-content: flex-end; margin-top: 24px; gap: 10px; }
        .btn-cancel {
          padding: 11px 24px; background: white;
          border: 1.5px solid #e5e7eb; border-radius: 10px;
          font-size: 13.5px; font-weight: 700; color: #6b7280;
          cursor: pointer; font-family: 'Nunito', sans-serif;
          transition: all 0.15s;
        }
        .btn-cancel:hover { border-color: #9ca3af; color: #374151; }
        .btn-save {
          padding: 11px 28px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white; border: none; border-radius: 10px;
          font-size: 13.5px; font-weight: 700;
          font-family: 'Nunito', sans-serif;
          cursor: pointer; transition: opacity 0.15s, transform 0.15s;
          display: flex; align-items: center; gap: 8px;
        }
        .btn-save:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

        /* info box */
        .info-box {
          background: #eff6ff; border: 1px solid #bfdbfe;
          border-radius: 10px; padding: 14px 16px;
          font-size: 13px; color: #1e40af;
          margin-bottom: 20px; display: flex; gap: 10px; align-items: flex-start;
          line-height: 1.5;
        }

        @media (max-width: 700px) {
          .sidebar { display: none; }
          .page { padding: 16px; }
          .form-row { flex-direction: column; gap: 0; }
          .profile-banner { padding: 24px 20px 54px; }
          .form-body { padding: 20px; }
          .tabs-row { padding: 0 20px; }
          .profile-avatar-wrap { left: 20px; }
        }
      `}</style>

      <div className="set-root">

        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sb-brand">
            <div className="sb-brand-icon">🎯</div>
            <div className="sb-brand-name">RECRUIT<span>-IQ</span></div>
          </div>
          <div className="sb-profile">
            <div className="sb-avatar">{user.full_name.charAt(0).toUpperCase()}</div>
            <div className="sb-uname">{user.full_name}</div>
            <div className="sb-urole">{isHR ? 'HR / Recruiter' : 'Candidate'}</div>
          </div>
          <nav className="sb-nav">
            <div className="sb-section-label">Main</div>
            {navItems.map(item => (
              <div key={item.path} className="sb-item" onClick={() => navigate(item.path)}>
                <span className="si">{item.icon}</span>{item.label}
              </div>
            ))}
            <div className="sb-section-label" style={{marginTop:'10px'}}>Settings</div>
            {isHR && (<>
              <div className="sb-item" onClick={() => navigate('/hr/kanban', { state: { tab: 'interviews' } })}>
                <span className="si">📅</span> Calendar
              </div>
              <div className="sb-item" onClick={() => navigate('/hr/kanban', { state: { tab: 'funnel' } })}>
                <span className="si">📊</span> Chart / Report
              </div>
            </>)}
            <div className="sb-item active">
              <span className="si">⚙️</span> Settings
            </div>
            <div className="sb-item" onClick={() => navigate('/jobs')}>
              <span className="si">☰</span> Table
            </div>
          </nav>
          <div className="sb-logout">
            <button className="sb-logout-btn" onClick={handleLogout}>
              <span>⏻</span> Log Out
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main-area">
          <div className="topbar">
            <div className="topbar-left">
              <h2>Settings</h2>
              <p>Manage your profile and account security</p>
            </div>
            <div className="topbar-right">
              <NotificationBell />
            </div>
          </div>

          <div className="page">
            <div className="settings-card">

              {/* Banner */}
              <div className="profile-banner">
                <div className="profile-banner-title">Account Settings</div>
                <div className="profile-banner-sub">Update your personal info and security preferences</div>
                <div className="profile-avatar-wrap">
                  <div className="profile-big-avatar">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="tabs-row">
                <button
                  className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('profile'); setProfileError(''); setProfileSuccess(''); }}
                >
                  👤 Edit Profile
                </button>
                <button
                  className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('password'); setPassError(''); setPassSuccess(''); }}
                >
                  🔒 Change Password
                </button>
              </div>

              {/* ── PROFILE TAB ── */}
              {activeTab === 'profile' && (
                <div className="form-body">
                  <div className="form-section-title">👤 Personal Information</div>

                  {profileSuccess && <div className="alert alert-success">✅ {profileSuccess}</div>}
                  {profileError   && <div className="alert alert-error">⚠️ {profileError}</div>}

                  <div className="info-box">
                    ℹ️ Your email address is used for login and cannot be changed here. Contact support if you need to update it.
                  </div>

                  <form onSubmit={handleProfileSave}>
                    <div className="form-row">
                      <div className="field">
                        <label>Full Name</label>
                        <input
                          type="text"
                          placeholder="Your full name"
                          value={profile.full_name}
                          onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="field">
                        <label>Phone Number</label>
                        <input
                          type="tel"
                          placeholder="+91 9876543210"
                          value={profile.phone}
                          onChange={e => setProfile({ ...profile, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-row single">
                      <div className="field">
                        <label>Email Address</label>
                        <input
                          type="email"
                          value={profile.email}
                          disabled
                        />
                        <div className="field-hint">📧 Email cannot be changed</div>
                      </div>
                    </div>

                    <div className="form-row single">
                      <div className="field">
                        <label>Role</label>
                        <input
                          type="text"
                          value={isHR ? 'HR / Recruiter' : 'Candidate'}
                          disabled
                        />
                        <div className="field-hint">🔒 Role is fixed and cannot be changed</div>
                      </div>
                    </div>

                    <div className="save-row">
                      <button type="button" className="btn-cancel" onClick={() => {
                        setProfile({ full_name: user.full_name, email: user.email, phone: user.phone || '' });
                        setProfileError(''); setProfileSuccess('');
                      }}>
                        Reset
                      </button>
                      <button type="submit" className="btn-save" disabled={profileLoading}>
                        {profileLoading ? '⏳ Saving...' : '💾 Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ── PASSWORD TAB ── */}
              {activeTab === 'password' && (
                <div className="form-body">
                  <div className="form-section-title">🔒 Change Password</div>

                  {passSuccess && <div className="alert alert-success">✅ {passSuccess}</div>}
                  {passError   && <div className="alert alert-error">⚠️ {passError}</div>}

                  <div className="info-box">
                    🛡️ Use a strong password with at least 8 characters, including numbers and symbols.
                  </div>

                  <form onSubmit={handlePasswordSave}>
                    <div className="form-row single">
                      <div className="field">
                        <label>Current Password</label>
                        <div className="field-wrap">
                          <input
                            type={showCurrent ? 'text' : 'password'}
                            placeholder="Enter your current password"
                            value={passwords.current_password}
                            onChange={e => setPasswords({ ...passwords, current_password: e.target.value })}
                            required className="pr"
                          />
                          <button type="button" className="eye-btn" onClick={() => setShowCurrent(!showCurrent)}>
                            {showCurrent ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="field">
                        <label>New Password</label>
                        <div className="field-wrap">
                          <input
                            type={showNew ? 'text' : 'password'}
                            placeholder="Enter new password"
                            value={passwords.new_password}
                            onChange={e => setPasswords({ ...passwords, new_password: e.target.value })}
                            required className="pr"
                          />
                          <button type="button" className="eye-btn" onClick={() => setShowNew(!showNew)}>
                            {showNew ? '🙈' : '👁️'}
                          </button>
                        </div>
                        {/* Strength bar */}
                        <div className="strength-bar">
                          {[1,2,3,4].map(i => {
                            const len = passwords.new_password.length;
                            const hasNum = /\d/.test(passwords.new_password);
                            const hasSym = /[!@#$%^&*]/.test(passwords.new_password);
                            const score = Math.min(
                              (len >= 6 ? 1 : 0) + (len >= 8 ? 1 : 0) + (hasNum ? 1 : 0) + (hasSym ? 1 : 0), 4
                            );
                            const colors = ['#fee2e2','#fef3c7','#bbf7d0','#86efac'];
                            return (
                              <div key={i} className="strength-seg"
                                style={{background: i <= score ? colors[score-1] || '#e5e7eb' : '#e5e7eb'}} />
                            );
                          })}
                        </div>
                        <div className="field-hint">
                          {passwords.new_password.length === 0 ? 'Min 8 chars, include numbers & symbols' :
                           passwords.new_password.length < 6 ? '⚠️ Too short' :
                           passwords.new_password.length < 8 ? '🟡 Fair' :
                           /[!@#$%^&*]/.test(passwords.new_password) ? '🟢 Strong' : '🔵 Good'}
                        </div>
                      </div>

                      <div className="field">
                        <label>Confirm New Password</label>
                        <div className="field-wrap">
                          <input
                            type={showConfirm ? 'text' : 'password'}
                            placeholder="Confirm new password"
                            value={passwords.confirm_password}
                            onChange={e => setPasswords({ ...passwords, confirm_password: e.target.value })}
                            required className="pr"
                          />
                          <button type="button" className="eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
                            {showConfirm ? '🙈' : '👁️'}
                          </button>
                        </div>
                        {passwords.confirm_password && (
                          <div className="field-hint" style={{color: passwords.new_password === passwords.confirm_password ? '#16a34a' : '#dc2626'}}>
                            {passwords.new_password === passwords.confirm_password ? '✅ Passwords match' : '❌ Passwords do not match'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="save-row">
                      <button type="button" className="btn-cancel" onClick={() => {
                        setPasswords({ current_password:'', new_password:'', confirm_password:'' });
                        setPassError(''); setPassSuccess('');
                      }}>
                        Clear
                      </button>
                      <button type="submit" className="btn-save" disabled={passLoading}>
                        {passLoading ? '⏳ Changing...' : '🔒 Change Password'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Settings;