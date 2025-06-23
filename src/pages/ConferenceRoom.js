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
  const [summaryMessage, setSummaryMessage] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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
      const hardcodedJWT = "eyJraWQiOiJ2cGFhcy1tYWdpYy1jb29raWUtNGQ5ODA1NWRjYjdhNGU3ZTgxOGUyMmFhMWI4NDc4MWQvZDM3ZmMzLVNBTVBMRV9BUFAiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJqaXRzaSIsImlzcyI6ImNoYXQiLCJpYXQiOjE3NTA2ODUzNTUsImV4cCI6MTc1MDY5MjU1NSwibmJmIjoxNzUwNjg1MzUwLCJzdWIiOiJ2cGFhcy1tYWdpYy1jb29raWUtNGQ5ODA1NWRjYjdhNGU3ZTgxOGUyMmFhMWI4NDc4MWQiLCJjb250ZXh0Ijp7ImZlYXR1cmVzIjp7ImxpdmVzdHJlYW1pbmciOnRydWUsIm91dGJvdW5kLWNhbGwiOnRydWUsInNpcC1vdXRib3VuZC1jYWxsIjpmYWxzZSwidHJhbnNjcmlwdGlvbiI6dHJ1ZSwicmVjb3JkaW5nIjp0cnVlLCJmbGlwIjpmYWxzZX0sInVzZXIiOnsiaGlkZGVuLWZyb20tcmVjb3JkZXIiOmZhbHNlLCJtb2RlcmF0b3IiOnRydWUsIm5hbWUiOiJtanVuYWlkMjI4MjAwMSIsImlkIjoiZ29vZ2xlLW9hdXRoMnwxMTAwMTA3OTgwNzY5MDc1MDMxMDYiLCJhdmF0YXIiOiIiLCJlbWFpbCI6Im1qdW5haWQyMjgyMDAxQGdtYWlsLmNvbSJ9fSwicm9vbSI6IioifQ.LmmtTElme5tuSRKfekLE1g2zF5vMwV1zoBv5xacWos7Ii6p71JSYYDOMgaI4_yoKQ0dscaC8-AMU6jSgDZalsp7n3BYsoR24kMNbX4MbONVXUSpX1dzdu4n6feSHBRVr5SYNIT8CByASqGx5ROhKRaXexzKWCvpAkEF5tcobRQYhsliHbQ92yOHujsWF8u6UR13Mu1Xc6F5aEJNai7FO5HcGY8RWst4rD_Qjn0T15Tt9IwsFJOV295uefHzVdM_2CAiev8WtfZz-qimmVMSxEykuTbeDElr9mgI9C-h2EedFm_753FGrdwxKKG2tOtxsIJ-DOfitDBUg3IdvSTxswA";
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

  // Audio recording logic
  useEffect(() => {
    if (!isCallActive || meetingEnded) return;
    let mediaRecorder;
    let audioChunks = [];
    let stream;
    async function startRecording() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new window.MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        mediaRecorder.start();
      } catch (err) {
        console.error('Audio recording error:', err);
      }
    }
    startRecording();
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [isCallActive, meetingEnded, roomId]);

  const handleEndMeeting = async () => {
    setMeetingEnded(true);
    // Stop audio recording
    let uploadPromise = Promise.resolve();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      uploadPromise = new Promise((resolve) => {
        mediaRecorderRef.current.onstop = async () => {
          if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('audio_file', audioBlob, `${roomId}.webm`);
            try {
              await fetch(`https://cc19-221-132-116-194.ngrok-free.app/api/transcriptions/${roomId}/upload`, {
                method: 'POST',
                body: formData
              });
            } catch (err) {
              console.error('Failed to upload audio:', err);
            }
          }
          resolve();
        };
        mediaRecorderRef.current.stop();
      });
    }
    // Aggressively hide the Jitsi iframe
    if (jitsiRef.current) {
      jitsiRef.current.style.display = 'none';
      jitsiRef.current.style.visibility = 'hidden';
      jitsiRef.current.style.opacity = '0';
      jitsiRef.current.style.zIndex = '-1';
      const iframes = jitsiRef.current.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        iframe.style.display = 'none';
        iframe.style.visibility = 'hidden';
        iframe.style.opacity = '0';
        iframe.style.zIndex = '-1';
      });
    }
    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
    }
    // Wait for upload to finish before ending meeting
    await uploadPromise;
    try {
      await fetch(`https://cc19-221-132-116-194.ngrok-free.app/api/meetings/${roomId}/end`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to end meeting:', error);
    }
  };

  const pollForSummary = async () => {
    setSummaryLoading(true);
    setSummaryError('');
    setSummaryMessage('');
    let attempts = 0;
    const maxAttempts = 90; // 90 x 2s = 180s (3 minutes)
    let found = false;
    const checkSummary = async () => {
      attempts++;
      try {
        const res = await fetch(`https://cc19-221-132-116-194.ngrok-free.app/api/insights/${roomId}/view`);
        if (res.ok) {
          const data = await res.json();
          if (data.summary) {
            setSummary(data);
            setSummaryLoading(false);
            setSummaryGenerated(true);
            found = true;
            return true;
          } else if (data.message && !data.summary) {
            // If backend says summary is being generated, keep polling
            setSummaryMessage(data.message);
            setSummaryLoading(true);
            setSummaryGenerated(false);
            found = false;
            return false;
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
        setSummaryError('This meeting does not have any summary.');
        clearInterval(interval);
      }
    }, 2000);
  };

  const handleGenerateSummary = () => {
    // Only allow if not already loading or generated
    if (!summaryLoading && !summaryGenerated) {
      pollForSummary();
    }
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
            {!summaryGenerated && !summaryLoading && !summaryMessage && !summaryError && (
              <>
                <p>Click the button below to generate your meeting summary.</p>
                <button onClick={handleGenerateSummary} className="generate-summary-btn" disabled={summaryLoading || summaryGenerated}>
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
            {summaryMessage && !summaryGenerated && !summaryLoading && !summaryError && (
              <div className="no-summary-message">
                <p>{summaryMessage}</p>
              </div>
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