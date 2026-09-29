"use client";

import React, { useState, useEffect, useRef } from "react";

export default function IncidentChat({ incidentId }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [authorName, setAuthorName] = useState("SRE Engineer");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    if (!incidentId) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/incidents/${incidentId}/messages`);
      if (!res.ok) {
        throw new Error(`Failed to load messages (${res.status})`);
      }
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load team discussion");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [incidentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || isSending || !incidentId) return;

    const messagePayload = {
      user_name: authorName.trim() || "Operator",
      message: inputText.trim(),
    };

    try {
      setIsSending(true);
      const res = await fetch(`/api/incidents/${incidentId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messagePayload),
      });

      if (!res.ok) {
        throw new Error(`Failed to send message (${res.status})`);
      }

      const created = await res.json();
      setMessages((prev) => [...prev, created]);
      setInputText("");
    } catch (err) {
      alert(`Message error: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="inc-section-card inc-chat-section">
      <div className="inc-section-title">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="sec-icon"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        Team Investigation Room & Live Chat
      </div>

      <div className="inc-chat-messages" id="inc-chat-messages">
        <div className="inc-chat-hint">
          Live investigation log in Supabase. Team discussion is analyzed by Groq AI and correlated with Hindsight memories.
        </div>

        {isLoading && messages.length === 0 ? (
          <div style={{ padding: "12px", color: "var(--text-tertiary)", fontSize: "13px" }}>
            Loading discussion messages...
          </div>
        ) : error ? (
          <div style={{ padding: "12px", color: "var(--critical-text)", fontSize: "13px" }}>
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div style={{ padding: "12px", color: "var(--text-tertiary)", fontSize: "13px" }}>
            No investigation messages yet. Post hypotheses, logs, or diagnostic updates below.
          </div>
        ) : (
          messages.map((msg) => {
            const timeStr = msg.created_at
              ? new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";
            return (
              <div key={msg.id || Math.random()} className="inc-chat-msg">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <strong style={{ fontSize: "12px", color: "var(--accent)" }}>
                    {msg.user_name || "Team Member"}
                  </strong>
                  <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                    {timeStr}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-primary)" }}>
                  {msg.message}
                </p>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="inc-chat-input-row">
        <input
          type="text"
          className="inc-chat-input"
          style={{ width: "130px", flexShrink: 0 }}
          placeholder="Your Name"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
        />
        <input
          type="text"
          id="inc-chat-input"
          className="inc-chat-input"
          placeholder="Type an investigation update or finding..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isSending}
        />
        <button
          type="submit"
          className="send-btn compact"
          id="btn-send-inc-chat"
          disabled={isSending || !inputText.trim()}
          title="Send Message"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="send-icon"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  );
}
