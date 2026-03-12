import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const InterviewRoom = () => {
  const { roomName } = useParams();
  const navigate = useNavigate();
  const jitsiRef = useRef(null);

  useEffect(() => {
    const domain = 'meet.jit.si';
    const options = {
      roomName: roomName,
      width: '100%',
      height: '100%',
      parentNode: jitsiRef.current,
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        enableWelcomePage: false,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'desktop', 'chat',
          'recording', 'raisehand', 'tileview', 'hangup'
        ],
      },
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);
    return () => api.dispose();
  }, [roomName]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🎥 Interview Room</h2>
        <button onClick={() => navigate('/my-applications')} style={styles.leaveBtn}>
          ← Leave Interview
        </button>
      </div>
      <div ref={jitsiRef} style={styles.jitsiContainer} />
    </div>
  );
};

const styles = {
  container: { height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0D1B2A' },
  header: { padding: '12px 24px', backgroundColor: '#0D1B2A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { margin: 0, color: 'white', fontSize: '18px' },
  leaveBtn: { padding: '8px 16px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  jitsiContainer: { flex: 1, width: '100%' },
};

export default InterviewRoom;