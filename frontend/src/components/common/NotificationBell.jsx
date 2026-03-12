import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {}
  };

  const markRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (err) {}
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const formatTime = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div ref={ref} style={styles.wrapper}>
      {/* Bell Button */}
      <button style={styles.bell} onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}>
        🔔
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={styles.dropdown}>
          <div style={styles.dropHeader}>
            <span style={styles.dropTitle}>🔔 Notifications</span>
            {unreadCount > 0 && (
              <button style={styles.markAllBtn} onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={styles.empty}>
              <p>🎉 No notifications yet!</p>
            </div>
          ) : (
            <div style={styles.list}>
              {notifications.map(n => (
                <div
                  key={n.id}
                  style={{
                    ...styles.item,
                    backgroundColor: n.is_read ? 'white' : '#EFF6FF'
                  }}
                  
                onClick={() => {
                markRead(n.id);
                setOpen(false);
                // Navigate based on notification type
                if (n.title.includes('Assessment')) {
                    navigate('/my-applications');
                } else if (n.title.includes('Interview')) {
                    navigate('/my-applications');
                } else if (n.title.includes('Shortlisted')) {
                    navigate('/my-applications');
                } else if (n.title.includes('Passed') || n.title.includes('Failed')) {
                    navigate('/dashboard');
                }
                }}

                >
                  <div style={styles.itemContent}>
                    <p style={styles.itemTitle}>{n.title}</p>
                    <p style={styles.itemMessage}>{n.message}</p>
                    <p style={styles.itemTime}>{formatTime(n.created_at)}</p>
                  </div>
                  {!n.is_read && <div style={styles.dot} />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  wrapper: { position: 'relative' },
  bell: { background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', position: 'relative', padding: '4px 8px' },
  badge: { position: 'absolute', top: '-2px', right: '-2px', backgroundColor: '#EF4444', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dropdown: { position: 'absolute', right: 0, top: '40px', width: '360px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', zIndex: 1000, overflow: 'hidden' },
  dropHeader: { padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  dropTitle: { fontWeight: '700', fontSize: '16px', color: '#0D1B2A' },
  markAllBtn: { background: 'none', border: 'none', color: '#0D9488', fontSize: '13px', cursor: 'pointer', fontWeight: '600' },
  empty: { padding: '40px', textAlign: 'center', color: '#64748B' },
  list: { maxHeight: '400px', overflowY: 'auto' },
  item: { padding: '14px 20px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemContent: { flex: 1 },
  itemTitle: { margin: '0 0 4px', fontSize: '14px', fontWeight: '600', color: '#0D1B2A' },
  itemMessage: { margin: '0 0 4px', fontSize: '13px', color: '#64748B', lineHeight: 1.4 },
  itemTime: { margin: 0, fontSize: '11px', color: '#94A3B8' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0D9488', flexShrink: 0, marginTop: '4px' },
};

export default NotificationBell;