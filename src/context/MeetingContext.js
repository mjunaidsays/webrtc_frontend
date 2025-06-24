import React, { createContext, useContext, useState } from 'react';

const MeetingContext = createContext();

export function MeetingProvider({ children }) {
  const [user, setUserState] = useState(() => localStorage.getItem('user') || "");
  const [room, setRoom] = useState("");
  const [meeting, setMeeting] = useState(null);

  // Persist user to localStorage
  const setUser = (u) => {
    setUserState(u);
    localStorage.setItem('user', u);
  };

  return (
    <MeetingContext.Provider value={{ user, setUser, room, setRoom, meeting, setMeeting }}>
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeeting() {
  return useContext(MeetingContext);
} 