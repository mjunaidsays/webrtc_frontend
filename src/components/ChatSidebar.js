import React, { useEffect, useRef, useState } from 'react';
import { useMeeting } from '../context/MeetingContext';
import './ChatSidebar.css';
import { endpoints } from '../api';

export default function ChatSidebar() {
  const { user, room } = useMeeting();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const ws = useRef(null);
  const bottomRef = useRef();

  useEffect(() => {
    if (!room) return;
    ws.current = new window.WebSocket(endpoints.wsChat(room));
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat') {
        setMessages(msgs => [...msgs, { user: data.user, message: data.message }]);
      }
    };
    return () => ws.current && ws.current.close();
  }, [room]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    ws.current.send(JSON.stringify({ user, message: input }));
    setMessages(msgs => [...msgs, { user, message: input }]);
    setInput('');
  };

  return (
    <div className="chat-sidebar">
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.user === user ? 'my-message' : 'other-message'}>
            <b>{msg.user}:</b> {msg.message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="chat-form">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." />
        <button type="submit">Send</button>
      </form>
    </div>
  );
} 