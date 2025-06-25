import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMeeting } from '../context/MeetingContext';
import './Summary.css';

const API_URL = 'https://4c03-221-132-116-194.ngrok-free.app/api';
const WS_URL = 'wss://4c03-221-132-116-194.ngrok-free.app/ws';
const MAX_WAIT_SECONDS = 30;

export default function Summary() {
  const { meetingId } = useParams();
  let { user } = useMeeting();
  const navigate = useNavigate();
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [waited, setWaited] = useState(0);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const summaryReceivedRef = useRef(false);

  // Fallback: try to get user from localStorage if not in context
  if (!user) {
    user = localStorage.getItem('user') || '';
  }

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    // Redirect to home if user tries to go back from summary page
    const handlePopState = () => {
      navigate('/', { replace: true });
    };
    window.addEventListener('popstate', handlePopState);
    let isMounted = true;

    const fetchInsight = async () => {
      try {
        const response = await fetch(`${API_URL}/insights/${meetingId}/view`, {
          headers: {
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        });
        if (response.ok) {
          const text = await response.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch (jsonErr) {
            console.error('[POLL] JSON parse error:', jsonErr, '\nResponse text:', text);
            setError('Error parsing server response.');
            setLoading(false);
            return;
          }
          if (isMounted && !summaryReceivedRef.current) {
            setInsight(data);
            if (data.summary || data.message) {
              setLoading(false);
              setError('');
              summaryReceivedRef.current = true;
              if (intervalRef.current) clearInterval(intervalRef.current);
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              console.log('[POLL] Set summary:', data);
            }
          }
        } else {
          if (isMounted && !summaryReceivedRef.current) {
            setInsight(null);
            setError('');
          }
        }
      } catch (err) {
        if (isMounted && !summaryReceivedRef.current) {
          setInsight(null);
          setError('');
        }
      }
    };

    fetchInsight();
    intervalRef.current = setInterval(() => {
      setWaited(w => w + 2);
      fetchInsight();
    }, 2000);
    timeoutRef.current = setTimeout(() => {
      if (!summaryReceivedRef.current) {
        setLoading(false);
        setError('Summary not available yet. Please wait a moment and refresh.');
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, MAX_WAIT_SECONDS * 1000);

    return () => {
      isMounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [meetingId, user, navigate]);

  useEffect(() => {
    if (!meetingId) return;
    const ws = new window.WebSocket(`${WS_URL}/summary/${meetingId}`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'summary') {
          setInsight(data);
          setLoading(false);
          setError('');
          summaryReceivedRef.current = true;
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          console.log('[WS] Set summary:', data);
        }
      } catch (e) { console.error('[Summary WS] Error parsing message:', e); }
    };
    ws.onerror = (e) => { console.error('[Summary WS] Error:', e); };
    ws.onclose = () => { console.log('[Summary WS] Closed'); };
    return () => ws.close();
  }, [meetingId]);

  if (loading) {
    return (
      <div className="summary-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Generating your meeting summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="summary-container">
        <div className="error-message">
          <h2>Oops!</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="summary-container">
        <div className="no-summary">
          <h2>No Summary Available</h2>
          <p>The meeting summary hasn't been generated yet.</p>
        </div>
      </div>
    );
  }

  if (insight.message && !insight.summary) {
    return (
      <div className="summary-container">
        <div className="no-summary">
          <h2>Summary Not Available</h2>
          <p>{insight.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="summary-container">
      <div className="summary-header">
        <h1>Meeting Summary</h1>
        <p className="meeting-id">Room: {meetingId}</p>
      </div>

      <div className="summary-content">
        <div className="summary-section">
          <h2>📋 Summary</h2>
          <div className="content-card">
            <p>{insight.summary}</p>
          </div>
        </div>

        <div className="summary-section">
          <h2>✅ Action Items</h2>
          <div className="content-card">
            <p>{insight.action_items}</p>
          </div>
        </div>

        <div className="summary-section">
          <h2>🎯 Key Decisions</h2>
          <div className="content-card">
            <p>{insight.decisions}</p>
          </div>
        </div>
      </div>

      <div className="summary-actions">
        <button 
          onClick={() => navigate('/')} 
          className="home-btn"
        >
          Back to Home
        </button>
        <button 
          onClick={() => window.print()} 
          className="print-btn"
        >
          Print Summary
        </button>
      </div>
    </div>
  );
} 