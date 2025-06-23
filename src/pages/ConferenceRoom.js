import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMeeting } from '../context/MeetingContext';
import './ConferenceRoom.css';

const JITSI_DOMAIN = '8x8.vc';
const JAAS_APP_ID = 'vpaas-magic-cookie-4d98055dcb7a4e7e818e22aa1b84781d';

export default function ConferenceRoom() {
  const { user } = useMeeting();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const jitsiRef = useRef();
  const apiRef = useRef();
  const [isCallActive, setIsCallActive] = useState(false);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryGenerated, setSummaryGenerated] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const audioWSRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  // Remove Jitsi iframe only when meeting has ended
  const removeJitsiIframe = () => {
    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
    }
    if (jitsiRef.current && meetingEnded) {
      // Remove all iframes inside the parent node
      const iframes = jitsiRef.current.querySelectorAll('iframe');
      iframes.forEach(iframe => iframe.remove());
      // Hide the parent node as a fallback
      jitsiRef.current.style.display = 'none';
      jitsiRef.current.innerHTML = '';
    }
  };

  useEffect(() => {
    if (!user || !roomId) {
      navigate('/');
      return;
    }
    if (meetingEnded) {
      // When meeting has ended, ensure Jitsi is completely hidden
      if (jitsiRef.current) {
        jitsiRef.current.style.display = 'none';
        jitsiRef.current.style.visibility = 'hidden';
        jitsiRef.current.style.opacity = '0';
        jitsiRef.current.style.zIndex = '-1';
      }
      return;
    }
    let script;
    async function createJitsiMeetingWithJWT() {
      // Use a hardcoded JWT for testing
      const hardcodedJWT = "eyJraWQiOiJ2cGFhcy1tYWdpYy1jb29raWUtNGQ5ODA1NWRjYjdhNGU3ZTgxOGUyMmFhMWI4NDc4MWQvZDM3ZmMzLVNBTVBMRV9BUFAiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJqaXRzaSIsImlzcyI6ImNoYXQiLCJpYXQiOjE3NTA2NjkwNDcsImV4cCI6MTc1MDY3NjI0NywibmJmIjoxNzUwNjY5MDQyLCJzdWIiOiJ2cGFhcy1tYWdpYy1jb29raWUtNGQ5ODA1NWRjYjdhNGU3ZTgxOGUyMmFhMWI4NDc4MWQiLCJjb250ZXh0Ijp7ImZlYXR1cmVzIjp7ImxpdmVzdHJlYW1pbmciOnRydWUsIm91dGJvdW5kLWNhbGwiOnRydWUsInNpcC1vdXRib3VuZC1jYWxsIjpmYWxzZSwidHJhbnNjcmlwdGlvbiI6dHJ1ZSwicmVjb3JkaW5nIjp0cnVlLCJmbGlwIjpmYWxzZX0sInVzZXIiOnsiaGlkZGVuLWZyb20tcmVjb3JkZXIiOmZhbHNlLCJtb2RlcmF0b3IiOnRydWUsIm5hbWUiOiJtanVuYWlkMjI4MjAwMSIsImlkIjoiZ29vZ2xlLW9hdXRoMnwxMTAwMTA3OTgwNzY5MDc1MDMxMDYiLCJhdmF0YXIiOiIiLCJlbWFpbCI6Im1qdW5haWQyMjgyMDAxQGdtYWlsLmNvbSJ9fSwicm9vbSI6IioifQ.QaFv83eOrECO8svlvyXVLs_vDazewBcdc4QUO-VqvAY4svSnCA3JYfNAiKnkEN3maelQDf7hkF_S--P1oS4WYrtSxGVDC5FHD0sr4MPyP40DXO0RIpO37v5M-BJsLrOmunKY6fT4VAkaKFLazvPJ1uBHaBZn6UbedxQNS_2sLl-IAikk0-Q_7r43AVVL-Jio924W_-lw7HRe-kMvOmCjSrPcKgqPvc0xQpcWmU4YgnKfscvC9AfYlis8YgN82TEdxn4GlgYmv0r1HvIIuyXf3JoFIZU9YzSTWBRYYY3o_cvPjjmoWFbB_VQBlvUEtKCU15yj2FYf-D2H5_Nd4MIJ0w";
      const room = `${JAAS_APP_ID}/${roomId}`;
      if (window.JitsiMeetExternalAPI && jitsiRef.current && !meetingEnded) {
        if (apiRef.current) {
          apiRef.current.dispose();
        }
        apiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName: room,
          parentNode: jitsiRef.current,
          jwt: hardcodedJWT,
          userInfo: { displayName: user },
          configOverwrite: { 
            startWithAudioMuted: false, 
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'chat', 'recording',
              'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
              'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone', 'security'
            ],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_POWERED_BY: false,
            SHOW_PROMOTIONAL_LINKS: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_WATERMARK: false,
            SHOW_LOGO: false,
            SHOW_DEEP_LINKING_IMAGE: false
          }
        });
        apiRef.current.addListener('readyToClose', () => {
          if (!meetingEnded) handleEndMeeting();
        });
        apiRef.current.addListener('participantJoined', () => {
          setIsCallActive(true);
        });
        apiRef.current.addListener('participantLeft', () => {
          apiRef.current.getNumberOfParticipants().then((count) => {
            if (count <= 1) {
              setIsCallActive(false);
            }
          });
        });
        apiRef.current.addListener('videoConferenceJoined', () => {
          setIsCallActive(true);
        });
        apiRef.current.addListener('videoConferenceLeft', () => {
          if (!meetingEnded) handleEndMeeting();
        });
      }
    }
    if (!window.JitsiMeetExternalAPI && !meetingEnded) {
      script = document.createElement('script');
      script.src = `https://8x8.vc/${JAAS_APP_ID}/external_api.js`;
      script.async = true;
      script.onload = createJitsiMeetingWithJWT;
      document.body.appendChild(script);
    } else {
      createJitsiMeetingWithJWT();
    }
    return () => {
      // Only remove Jitsi iframe if meeting has ended
      if (meetingEnded) removeJitsiIframe();
      if (script) document.body.removeChild(script);
    };
  }, [user, roomId, navigate, meetingEnded]);

  // Additional effect to ensure summary overlay is always visible when meeting ends
  useEffect(() => {
    if (meetingEnded) {
      // Force hide any remaining Jitsi content
      const jitsiElements = document.querySelectorAll('[data-testid="jitsi-meeting"], iframe[src*="jitsi"]');
      jitsiElements.forEach(element => {
        element.style.display = 'none';
        element.style.visibility = 'hidden';
        element.style.opacity = '0';
        element.style.zIndex = '-1';
      });
    }
  }, [meetingEnded]);

  // Start audio streaming when meeting starts
  useEffect(() => {
    if (!isCallActive || meetingEnded) return;
    let stopped = false;
    let ws;
    let mediaRecorder;
    let stream;

    async function startAudioStreaming() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        ws = new window.WebSocket(`wss://cb3b-221-132-116-194.ngrok-free.app/ws/audio/${roomId}`);
        audioWSRef.current = ws;
        ws.onopen = () => {
          mediaRecorder = new window.MediaRecorder(stream, { mimeType: 'audio/webm' });
          mediaRecorderRef.current = mediaRecorder;
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0 && ws.readyState === 1) {
              event.data.arrayBuffer().then(buf => ws.send(buf));
            }
          };
          mediaRecorder.start(1000); // send every 1s
        };
        ws.onclose = () => {
          if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
          if (stream) stream.getTracks().forEach(track => track.stop());
        };
      } catch (err) {
        console.error('Audio streaming error:', err);
      }
    }
    startAudioStreaming();
    return () => {
      stopped = true;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (audioWSRef.current && audioWSRef.current.readyState === 1) {
        audioWSRef.current.close();
      }
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [isCallActive, meetingEnded, roomId]);

  const handleEndMeeting = async () => {
    setMeetingEnded(true);
    
    // Stop audio streaming
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioWSRef.current && audioWSRef.current.readyState === 1) {
      audioWSRef.current.close();
    }

    // Aggressively hide the Jitsi iframe
    if (jitsiRef.current) {
      // Hide the entire Jitsi container
      jitsiRef.current.style.display = 'none';
      jitsiRef.current.style.visibility = 'hidden';
      jitsiRef.current.style.opacity = '0';
      jitsiRef.current.style.zIndex = '-1';

      // Also hide any iframes inside
      const iframes = jitsiRef.current.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        iframe.style.display = 'none';
        iframe.style.visibility = 'hidden';
        iframe.style.opacity = '0';
        iframe.style.zIndex = '-1';
      });
    }

    // Dispose of the API
    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
    }

    try {
      await fetch(`https://cb3b-221-132-116-194.ngrok-free.app/api/meetings/${roomId}/end`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to end meeting:', error);
    }
  };

  const pollForSummary = async () => {
    setSummaryLoading(true);
    setSummaryError('');
    let attempts = 0;
    const maxAttempts = 90; // 90 x 2s = 180s (3 minutes)
    let found = false;
    const checkSummary = async () => {
      attempts++;
      try {
        const res = await fetch(`https://cb3b-221-132-116-194.ngrok-free.app/api/insights/${roomId}/view`);
        if (res.ok) {
          const data = await res.json();
          if (data.summary) {
            setSummary(data);
            setSummaryLoading(false);
            setSummaryGenerated(true);
            found = true;
            return true;
          } else if (data.message) {
            // If backend says summary is being generated, keep polling
          }
        }
      } catch (error) {
        // Ignore errors, keep polling
      }
      return false;
    };
    // First, check immediately (for retry case)
    if (await checkSummary()) return;
    const interval = setInterval(async () => {
      if (await checkSummary()) {
        clearInterval(interval);
        return;
      }
      if (attempts >= maxAttempts) {
        setSummaryLoading(false);
        setSummaryError('Summary generation timed out. Please try again.');
        clearInterval(interval);
      }
    }, 2000);
  };

  const handleGenerateSummary = () => {
    pollForSummary();
  };

  const handleViewSummary = () => {
    navigate(`/summary/${roomId}`);
  };

  const handleLeaveRoom = () => {
    if (meetingEnded) removeJitsiIframe();
    navigate('/');
  };

  if (!user || !roomId) return null;

  return (
    <div className="conference-container">
      <div className="conference-header">
        <div className="header-content">
          <div className="room-info">
            <h2>📹 {roomId}</h2>
            <p className="room-subtitle">Share this code to invite others</p>
          </div>
          <div className="user-info">
            <span className="user-badge">👤 {user}</span>
          </div>
        </div>
        <div className="header-controls">
          {isCallActive && !meetingEnded && (
            <button onClick={handleEndMeeting} className="end-meeting-btn">
              🛑 End Meeting
            </button>
          )}
          <button onClick={handleLeaveRoom} className="leave-room-btn">
            🚪 Leave Room
          </button>
        </div>
      </div>
      <div className="video-container">
        {!meetingEnded && <div ref={jitsiRef} className="jitsi-frame" />}
      </div>
      {meetingEnded && (
        <div className="summary-overlay">
          <div className="summary-card">
            <h3>🎉 Meeting Ended!</h3>
            {!summaryGenerated && !summaryLoading && (
              <>
                <p>Click the button below to generate your meeting summary.</p>
                <button onClick={handleGenerateSummary} className="generate-summary-btn">
                  🤖 Generate Summary
                </button>
              </>
            )}
            {summaryLoading && (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Generating your meeting summary...</p>
                <p className="loading-subtext">This may take a minute as we process the audio and generate insights.</p>
              </div>
            )}
            {summaryError && (
              <div className="error-container">
                <p className="error-message">{summaryError}</p>
                <button onClick={handleGenerateSummary} className="retry-btn">
                  🔄 Try Again
                </button>
              </div>
            )}
            {summaryGenerated && summary && (
              <>
                <div className="summary-content">
                  <h4>Summary</h4>
                  <p>{summary.summary}</p>
                  <h4>Action Items</h4>
                  <p>{summary.action_items}</p>
                  <h4>Key Decisions</h4>
                  <p>{summary.decisions}</p>
                </div>
                <button onClick={handleViewSummary} className="view-summary-btn">
                  📋 View Full Summary
                </button>
              </>
            )}
            <button onClick={() => navigate('/')} className="home-btn">
              🏠 Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 