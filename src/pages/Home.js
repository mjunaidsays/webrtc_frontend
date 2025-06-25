import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeeting } from '../context/MeetingContext';
import './Home.css';
import logo from '../logo.svg';

const API_URL = 'https://48c4-221-132-116-194.ngrok-free.app/api';

export default function Home() {
  const { setUser, setRoom, setMeeting } = useMeeting();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [createdRoom, setCreatedRoom] = useState(null); // store meeting object
  const [showCreatedModal, setShowCreatedModal] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !roomCode) return setError('Enter your name and room code.');
    setUser(name);
    setRoom(roomCode);
    try {
      const res = await fetch(`${API_URL}/meetings/${roomCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name: name })
      });
      if (!res.ok) throw new Error('Room not found or full.');
      const meeting = await res.json();
      setMeeting(meeting);
      navigate(`/room/${roomCode}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setCreatedRoom(null);
    setShowCreatedModal(false);
    if (!name || !title) return setError('Enter your name and meeting title.');
    setUser(name);
    try {
      const res = await fetch(`${API_URL}/meetings/create?title=${encodeURIComponent(title)}&owner_name=${encodeURIComponent(name)}`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to create room.');
      const meeting = await res.json();
      setRoom(meeting.id);
      setMeeting(meeting);
      setCreatedRoom(meeting);
      setShowCreatedModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleJoinCreatedRoom = () => {
    if (createdRoom) {
      navigate(`/room/${createdRoom.id}`);
    }
  };

  return (
    <div className="home-outer-container">
      <div className="home-main-grid">
        <div className="home-branding">
          <img src={logo} alt="Web Conferencing Logo" className="home-logo" />
          <h1 className="home-title">
            <span className="home-title-icon">🎥</span> Web <span className="home-title-highlight">Conferencing</span>
          </h1>
          <p className="home-subtitle">
            Connect, collaborate, and get <br />AI-powered meeting summaries
          </p>
        </div>
        <div className="home-content-card">
          <form onSubmit={handleJoin} className="home-form">
            <input 
              placeholder="Your Name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              autoFocus
            />
            <input 
              placeholder="Room Code" 
              value={roomCode} 
              onChange={e => setRoomCode(e.target.value.toUpperCase())} 
              maxLength={6} 
            />
            <button type="submit" className="home-btn join-btn">🚀 Join Room</button>
          </form>

          <div className="divider">or</div>

          <form onSubmit={handleCreate} className="home-form">
            <input 
              placeholder="Your Name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
            <input 
              placeholder="Meeting Title" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
            />
            <button type="submit" className="home-btn create-btn">✨ Create Room</button>
          </form>

          {error && <div className="error">{error}</div>}
        </div>
      </div>
      {showCreatedModal && createdRoom && (
        <div className="created-room-modal">
          <div className="created-room-card">
            <h2>🎉 Room Created!</h2>
            <p>Room Code:</p>
            <div className="created-room-code">{createdRoom.id}</div>
            <div className="created-room-link">
              <span>Share this link:</span>
              <a href={`${window.location.origin}/room/${createdRoom.id}`}>{`${window.location.origin}/room/${createdRoom.id}`}</a>
            </div>
            <button className="home-btn join-btn" onClick={handleJoinCreatedRoom}>
              Join Meeting
            </button>
            <button className="home-btn create-btn" onClick={() => setShowCreatedModal(false)}>
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 