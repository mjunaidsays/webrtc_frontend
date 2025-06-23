import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMeeting } from '../context/MeetingContext';
import './Summary.css';

const API_URL = 'https://c4ea-221-132-116-194.ngrok-free.app/api';
const MAX_WAIT_SECONDS = 30;

export default function Summary() {
  const { meetingId } = useParams();
  const { user } = useMeeting();
  const navigate = useNavigate();
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [waited, setWaited] = useState(0);

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
    let interval;
    let timeout;
    let isMounted = true;

    const fetchInsight = async () => {
      try {
        const response = await fetch(`${API_URL}/insights/${meetingId}/view`);
        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            setInsight(data);
            if (data.summary || data.message) {
              setLoading(false);
              setError('');
              clearInterval(interval);
              clearTimeout(timeout);
            }
          }
        } else {
          if (isMounted) {
            setInsight(null);
            setLoading(true);
            setError('');
          }
        }
      } catch (err) {
        if (isMounted) {
          setInsight(null);
          setLoading(true);
          setError('');
        }
      }
    };

    fetchInsight();
    interval = setInterval(() => {
      setWaited(w => w + 2);
      fetchInsight();
    }, 2000);
    timeout = setTimeout(() => {
      setLoading(false);
      setError('Summary not available yet. Please wait a moment and refresh.');
      clearInterval(interval);
    }, MAX_WAIT_SECONDS * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      clearTimeout(timeout);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [meetingId, user, navigate]);

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