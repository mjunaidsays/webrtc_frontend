import React from 'react';

export default function Controls({ apiRef, onToggleChat, showChat }) {
  // These functions assume JitsiMeetExternalAPI is loaded and used in ConferenceRoom
  const handleMute = () => {
    if (apiRef && apiRef.current) {
      apiRef.current.executeCommand('toggleAudio');
    }
  };
  const handleVideo = () => {
    if (apiRef && apiRef.current) {
      apiRef.current.executeCommand('toggleVideo');
    }
  };
  const handleLeave = () => {
    if (apiRef && apiRef.current) {
      apiRef.current.executeCommand('hangup');
    }
    window.location.href = '/';
  };
  return (
    <div className="controls">
      <button onClick={handleMute}>Mute/Unmute</button>
      <button onClick={handleVideo}>Video On/Off</button>
      <button onClick={onToggleChat}>{showChat ? 'Hide' : 'Show'} Chat</button>
      <button onClick={handleLeave}>Leave</button>
    </div>
  );
} 