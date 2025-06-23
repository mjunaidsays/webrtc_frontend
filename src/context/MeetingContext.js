import React, { createContext, useContext, useState } from 'react';

const MeetingContext = createContext();

export function MeetingProvider({ children }) {
  const [user, setUser] = useState("");
  const [room, setRoom] = useState("");
  const [meeting, setMeeting] = useState(null);

  return (
    <MeetingContext.Provider value={{ user, setUser, room, setRoom, meeting, setMeeting }}>
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeeting() {
  return useContext(MeetingContext);
} 