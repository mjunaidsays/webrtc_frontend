import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMeeting } from '../context/MeetingContext';
import './ConferenceRoom.css';
import { endpoints } from '../api';
import { WS_BASE_URL } from '../config';

const JITSI_DOMAIN = '8x8.vc';
const JAAS_APP_ID = 'vpaas-magic-cookie-4d98055dcb7a4e7e818e22aa1b84781d';

export default function ConferenceRoom() {
  const { user, meeting, setMeeting } = useMeeting();
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
  const [audioUploaded, setAudioUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

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
      const hardcodedJWT = "eyJraWQiOiJ2cGFhcy1tYWdpYy1jb29raWUtNGQ5ODA1NWRjYjdhNGU3ZTgxOGUyMmFhMWI4NDc4MWQvZDM3ZmMzLVNBTVBMRV9BUFAiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJqaXRzaSIsImlzcyI6ImNoYXQiLCJpYXQiOjE3NTEwMTY3MDEsImV4cCI6MTc1MTAyMzkwMSwibmJmIjoxNzUxMDE2Njk2LCJzdWIiOiJ2cGFhcy1tYWdpYy1jb29raWUtNGQ5ODA1NWRjYjdhNGU3ZTgxOGUyMmFhMWI4NDc4MWQiLCJjb250ZXh0Ijp7ImZlYXR1cmVzIjp7ImxpdmVzdHJlYW1pbmciOnRydWUsIm91dGJvdW5kLWNhbGwiOnRydWUsInNpcC1vdXRib3VuZC1jYWxsIjpmYWxzZSwidHJhbnNjcmlwdGlvbiI6dHJ1ZSwicmVjb3JkaW5nIjp0cnVlLCJmbGlwIjpmYWxzZX0sInVzZXIiOnsiaGlkZGVuLWZyb20tcmVjb3JkZXIiOmZhbHNlLCJtb2RlcmF0b3IiOnRydWUsIm5hbWUiOiJtanVuYWlkMjI4MjAwMSIsImlkIjoiZ29vZ2xlLW9hdXRoMnwxMTAwMTA3OTgwNzY5MDc1MDMxMDYiLCJhdmF0YXIiOiIiLCJlbWFpbCI6Im1qdW5haWQyMjgyMDAxQGdtYWlsLmNvbSJ9fSwicm9vbSI6IioifQ.Lm4_XUHFK1e8jzeuz8GiYzcjUrk-BXbq6PYl6175HpFbiPRfZ9mDRbaqV3YtXcbjztRR00B26mBf28KTeqm-JuCiTJSQAmcYGWCXKTpT2ujuxbNokx7EdXqc1SHwW6Z34i559_PZSDejbo9d2QfyprdQm6-49rb0PjzWJYfXkhYuWIV0de-EOY0VCWvksbkg0ASBOCLTWFMug9POc65BgHuBm4NEX3p4xweffDcl1iWgHInK1_njwHeIVEJaXDj3sVScTw-LMA2cLGpNpXCy1x-ArLhKx0_bHP9fOe7KXndPSOCT6rt-n34hVQiRwT_HREh5WAIBsLksVCmx0Ri30A";
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
          // Explicitly set the display name to the user's chosen name
          if (apiRef.current && user) {
            apiRef.current.executeCommand('displayName', user);
          }
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

  // End meeting handler for all users
  const handleEndMeeting = async () => {
    setMeetingEnded(true);
    await uploadAudioIfNeeded();
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

  // Generate summary handler with leftEarly logic
  const handleGenerateSummary = async () => {
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

  const uploadAudioIfNeeded = async () => {
    if (!audioUploaded && !isUploading && audioChunksRef.current.length > 0) {
      setIsUploading(true);
      setUploadError('');
      try {
        // Stop the recorder if still running
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          await new Promise(resolve => {
            mediaRecorderRef.current.onstop = resolve;
            mediaRecorderRef.current.stop();
          });
        }
        // Combine audio chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio_file', audioBlob, `${user || 'user'}.webm`);
        formData.append('user_id', user || 'user');
        // Upload to backend
        const res = await fetch(endpoints.uploadAudio(roomId), {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error('Failed to upload audio');
        setAudioUploaded(true);
      } catch (err) {
        setUploadError('Failed to upload audio. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Update Back to Home button handler to only navigate home when user clicks it
  const handleBackToHome = async () => {
    if (isUploading) return;
    setIsUploading(true);
    setUploadError('');
    try {
      await uploadAudioIfNeeded();
      navigate('/');
    } catch (err) {
      setUploadError('Failed to upload audio. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Add beforeunload warning if uploading
  useEffect(() => {
    const beforeunloadHandler = (event) => {
      if (isUploading) {
        event.preventDefault();
        event.returnValue = 'Audio is still uploading. Are you sure you want to leave?';
        return event.returnValue;
      }
    };
    window.addEventListener('beforeunload', beforeunloadHandler);
    return () => {
      window.removeEventListener('beforeunload', beforeunloadHandler);
    };
  }, [isUploading]);

  // Fetch meeting object on mount if not present
  useEffect(() => {
    async function fetchMeeting() {
      if (!meeting && roomId) {
        const res = await fetch(`/api/meetings/${roomId}`);
        if (res.ok) {
          const m = await res.json();
          setMeeting(m);
        }
      }
    }
    fetchMeeting();
  }, [meeting, roomId, setMeeting]);

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
        </div>
      </div>
      <div className="video-container">
        {!meetingEnded && <div ref={jitsiRef} className="jitsi-frame" />}
      </div>
      {/* Always show summary overlay after meeting end */}
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
            <button
              onClick={handleBackToHome}
              className="home-btn"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <span className="loading-spinner" style={{marginRight: 8}}></span>
                  Uploading audio...
                </>
              ) : (
                <>
                  🏠 Back to Home
                </>
              )}
            </button>
            {uploadError && <div className="error-message">{uploadError}</div>}
          </div>
        </div>
      )}
    </div>
  );
} 