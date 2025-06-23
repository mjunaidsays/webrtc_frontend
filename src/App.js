import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MeetingProvider } from './context/MeetingContext';
import Home from './pages/Home';
import ConferenceRoom from './pages/ConferenceRoom';
import Summary from './pages/Summary';
import './App.css';

function App() {
  return (
    <MeetingProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:roomId" element={<ConferenceRoom />} />
          <Route path="/summary/:meetingId" element={<Summary />} />
        </Routes>
      </Router>
    </MeetingProvider>
  );
}

export default App;
