import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMeeting } from '../context/MeetingContext';
import './ConferenceRoom.css';
import { endpoints } from '../api';

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
  const [backgroundSummary, setBackgroundSummary] = useState(null);
  const [backgroundSummaryReady, setBackgroundSummaryReady] = useState(false);
  const [backgroundSummaryMessage, setBackgroundSummaryMessage] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const backgroundPollingRef = useRef(null);
  const [showSummary, setShowSummary] = useState(false);
  const [pollingTimeout, setPollingTimeout] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

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
      const hardcodedJWT = "eyJraWQiOiJ2cGFhcy1tYWdpYy1jb29raWUtNGQ5ODA1NWRjYjdhNGU3ZTgxOGUyMmFhMWI4NDc4MWQvZDM3ZmMzLVNBTVBMRV9BUFAiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJqaXRzaSIsImlzcyI6ImNoYXQiLCJpYXQiOjE3NTA5Mjg4ODksImV4cCI6MTc1MDkzNjA4OSwibmJmIjoxNzUwOTI4ODg0LCJzdWIiOiJ2cGFhcy1tYWdpYy1jb29raWUtNGQ5ODA1NWRjYjdhNGU3ZTgxOGUyMmFhMWI4NDc4MWQiLCJjb250ZXh0Ijp7ImZlYXR1cmVzIjp7ImxpdmVzdHJlYW1pbmciOnRydWUsIm91dGJvdW5kLWNhbGwiOnRydWUsInNpcC1vdXRib3VuZC1jYWxsIjpmYWxzZSwidHJhbnNjcmlwdGlvbiI6dHJ1ZSwicmVjb3JkaW5nIjp0cnVlLCJmbGlwIjpmYWxzZX0sInVzZXIiOnsiaGlkZGVuLWZyb20tcmVjb3JkZXIiOmZhbHNlLCJtb2RlcmF0b3IiOnRydWUsIm5hbWUiOiJtanVuYWlkMjI4MjAwMSIsImlkIjoiZ29vZ2xlLW9hdXRoMnwxMTAwMTA3OTgwNzY5MDc1MDMxMDYiLCJhdmF0YXIiOiIiLCJlbWFpbCI6Im1qdW5haWQyMjgyMDAxQGdtYWlsLmNvbSJ9fSwicm9vbSI6IioifQ.JRgKB9EHpgcB4-cqeAAmO_bRmZM6dUNbuhNLlYPZ4Fi9OG0RENkuOrcSslA2-SVEXtLQeg8tx4HlKYuRwvY9DxJPCF_Y1isHKbsPr8NzLV03H2RDn8zVMpP0bT0lllSmTDpJhSKktfvvtSyHeTHqyFf2dkJNtfGc3_34gMEknQ8nuuE6ga_o32l-slVNfdrDy43xs77_h6stL-5UGvX-cg7itjG8HLPK670iK6KYcWBUe3iK7xk4siFKDZ_mj8qCIt32qqNobI8CvC7XNcWrbhPQlTBePL1UzsIUOK1rklM66xbs8pkvmWnpqpRTIZYMcr-v6fSPSoa6CwLcs_DVew";
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
          const count = apiRef.current.getNumberOfParticipants();
          if (count <= 1) {
            setIsCallActive(false);
          }
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
          // Log audio chunks for debugging
          console.log('Audio chunks:', audioChunksRef.current.length, audioChunksRef.current);
          if (audioChunksRef.current.length > 0) {
            // Calculate total size
            let totalSize = 0;
            audioChunksRef.current.forEach(chunk => totalSize += chunk.size);
            console.log('Total audio size (bytes):', totalSize);
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('audio_file', audioBlob, `${roomId}.webm`);
            try {
              const uploadRes = await fetch(endpoints.uploadAudio(roomId), {
                method: 'POST',
                body: formData
              });
              const uploadText = await uploadRes.text();
              console.log('Audio upload response:', uploadRes.status, uploadText);
              if (!uploadRes.ok) {
                alert('Audio upload failed. Please check your connection and try again.');
              }
            } catch (err) {
              console.error('Failed to upload audio:', err);
              alert('Audio upload failed. Please check your connection and try again.');
            }
          } else {
            // No audio was recorded
            console.warn('No audio was recorded.');
            alert('No audio was recorded. Please check your microphone and browser permissions.');
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
      await fetch(endpoints.endMeeting(roomId), {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to end meeting:', error);
    }
  };

  // Background polling for summary after meeting ends
  useEffect(() => {
    if (!meetingEnded) return;
    let attempts = 0;
    const maxAttempts = 90;
    let found = false;

    const checkSummary = async () => {
      attempts++;
      try {
        const res = await fetch(endpoints.getSummary(roomId), {
          headers: {
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        });
        if (!res.ok) {
          console.log('[POLL] Response not OK:', res.status);
          return false;
        }
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (jsonErr) {
          console.error('[POLL] JSON parse error:', jsonErr, '\nResponse text:', text);
          setSummaryError('Error parsing server response.');
          setSummaryLoading(false);
          return false;
        }
        console.log('[POLL] API response:', data); // DEBUG LOG
        if (data.summary_available && typeof data.summary === 'string' && data.summary.trim().length > 0) {
          setBackgroundSummary(data);
          setBackgroundSummaryReady(true);
          found = true;
          return true;
        } else if (data.message && !data.summary) {
          setBackgroundSummaryMessage(data.message);
          setBackgroundSummaryReady(false);
          found = false;
          return false;
        }
      } catch (error) {
        console.error('[POLL] Error:', error); // DEBUG LOG
        return false;
      }
      return false;
    };

    // First, check immediately
    checkSummary();

    // Only start polling if we haven't found the summary yet
    if (!found) {
      backgroundPollingRef.current = setInterval(async () => {
        if (await checkSummary() || attempts >= maxAttempts) {
          clearInterval(backgroundPollingRef.current);
        }
      }, 2000);
    }

    return () => {
      if (backgroundPollingRef.current) {
        clearInterval(backgroundPollingRef.current);
      }
    };
  }, [meetingEnded, roomId]);

  // Add WebSocket for real-time summary updates
  useEffect(() => {
    if (!meetingEnded) return;
    const ws = new window.WebSocket(endpoints.wsSummary(roomId));
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[WS] Received:', data); // DEBUG LOG
        
        if (data.type === 'summary' && data.summary_available) {
          // Stop polling when we get a summary via WebSocket
          if (backgroundPollingRef.current) {
            clearInterval(backgroundPollingRef.current);
          }
          
          setBackgroundSummary(data);
          setBackgroundSummaryReady(true);
          
          // Update summary state if we're waiting for it
          if (summaryLoading) {
            setSummary(data);
            setSummaryLoading(false);
            setSummaryGenerated(true);
            console.log('[WS] Set summary (immediate):', data);
          }
        }
      } catch (e) {
        console.error('[WS] Error parsing message:', e);
      }
    };
    
    ws.onerror = (e) => console.error('[WS] Error:', e);
    ws.onclose = () => console.log('[WS] Closed');
    
    return () => ws.close();
  }, [meetingEnded, roomId, summaryLoading]);

  const handleGenerateSummary = () => {
    if (!summaryLoading && !summaryGenerated) {
      setShowSummary(true);
      setSummaryLoading(true);
      setSummaryError('');
      setSummaryMessage('');
      let attempts = 0;
      const maxAttempts = 30; // 60 seconds (2s interval)
      const poll = async () => {
        attempts++;
        try {
          const res = await fetch(endpoints.getSummary(roomId), {
            headers: {
              'Accept': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            }
          });
          if (!res.ok) {
            setSummaryError('Failed to fetch summary.');
            setSummaryLoading(false);
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            return;
          }
          const text = await res.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch (jsonErr) {
            setSummaryError('Error parsing server response.');
            setSummaryLoading(false);
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            return;
          }
          if (data.summary_available && typeof data.summary === 'string' && data.summary.trim().length > 0) {
            setSummary(data);
            setSummaryLoading(false);
            setSummaryGenerated(true);
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            return;
          }
        } catch (error) {
          setSummaryError('Error fetching summary.');
          setSummaryLoading(false);
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          return;
        }
        if (attempts >= maxAttempts) {
          setSummaryMessage('This meeting does not have any summary');
          setSummaryLoading(false);
          setSummaryGenerated(false);
          clearInterval(intervalId);
          clearTimeout(timeoutId);
        }
      };
      poll();
      const intervalId = setInterval(poll, 2000);
      setPollingInterval(intervalId);
      const timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        setPollingInterval(null);
        setPollingTimeout(null);
      }, maxAttempts * 2000 + 1000);
      setPollingTimeout(timeoutId);
    }
  };

  const handleViewSummary = () => {
    navigate(`/summary/${roomId}`);
  };

  const handleLeaveRoom = () => {
    if (meetingEnded) removeJitsiIframe();
    navigate('/');
  };

  // Add a function to refresh the summary from the backend
  const handleRefreshSummary = async () => {
    setSummaryLoading(true);
    setSummaryError('');
    setSummaryMessage('');
    try {
      const res = await fetch(endpoints.getSummary(roomId), {
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (jsonErr) {
          console.error('[POLL] JSON parse error:', jsonErr, '\nResponse text:', text);
          setSummaryError('Error parsing server response.');
          setSummaryLoading(false);
          return;
        }
        if (typeof data.summary === 'string' && data.summary.trim().length > 0) {
          setSummary(data);
          setSummaryLoading(false);
          setSummaryGenerated(true);
        } else if (data.message && !data.summary) {
          setSummaryMessage(data.message);
          setSummaryLoading(false);
          setSummaryGenerated(false);
        }
      } else {
        setSummaryError('Failed to fetch summary.');
        setSummaryLoading(false);
      }
    } catch (error) {
      setSummaryError('Error fetching summary.');
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    setShowSummary(false);
    setSummary(null);
    setSummaryGenerated(false);
    setSummaryLoading(false);
    setSummaryError('');
    setSummaryMessage('');
  }, [meetingEnded, roomId]);

  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
      if (pollingTimeout) clearTimeout(pollingTimeout);
    };
  }, [pollingInterval, pollingTimeout]);

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
            {!summaryGenerated && !summaryLoading && !showSummary && !summaryError && (
              <>
                <p>Click the button below to generate your meeting summary.</p>
                <button onClick={handleGenerateSummary} className="generate-summary-btn" disabled={summaryLoading || summaryGenerated}>
                  🤖 Generate Summary
                </button>
              </>
            )}
            {showSummary && summaryLoading && (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Generating your meeting summary...</p>
                <p className="loading-subtext">This may take a minute as we process the audio and generate insights.</p>
              </div>
            )}
            {showSummary && summaryError && !summaryGenerated && !summaryLoading && (
              <div className="error-container">
                <p className="error-message">{summaryError}</p>
                <button onClick={handleRefreshSummary} className="retry-btn">Retry</button>
              </div>
            )}
            {showSummary && summaryGenerated && summary && !summaryLoading && !summaryError && (
              <>
                <p>Your meeting summary is ready!</p>
                <button onClick={handleViewSummary} className="view-summary-btn">
                  📋 Show Summary
                </button>
              </>
            )}
            {showSummary && summaryMessage === 'This meeting does not have any summary' && !summaryGenerated && !summaryLoading && !summaryError && (
              <div className="no-summary-message">
                <h3>No Summary Available</h3>
                <p>This meeting does not have any summary.</p>
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