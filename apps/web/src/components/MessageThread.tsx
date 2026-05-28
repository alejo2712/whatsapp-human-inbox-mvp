'use client';
import { useEffect, useRef, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

interface Message {
  id: string;
  conversationId: string;
  direction: string;
  body: string;
  status: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  status: string;
  contact: { id: string; phone: string; name: string | null };
  messages: Message[];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageThread({ conversation }: { conversation: Conversation }) {
  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // SSE subscription for real-time updates
  useEffect(() => {
    const es = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'}/sse/events`,
      { withCredentials: true },
    );
    es.onmessage = (e: MessageEvent) => {
      try {
        const event = JSON.parse(e.data as string) as {
          type: string;
          conversationId: string;
          message: Message;
        };
        if (event.type === 'new_message' && event.conversationId === conversation.id) {
          setMessages((prev) => {
            if (prev.find((m) => m.id === event.message.id)) return prev;
            return [...prev, event.message];
          });
        }
      } catch {}
    };
    return () => es.close();
  }, [conversation.id]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const msg = await api.post<Message>(`/conversations/${conversation.id}/messages`, { body });
      setMessages((prev) => [...prev, msg]);
      setInput('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  }

  const displayName = conversation.contact.name ?? conversation.contact.phone;

  return (
    <>
      {/* Header */}
      <div className="border-b px-4 py-3 bg-white flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 font-semibold text-sm flex items-center justify-center">
          {displayName[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <p className="font-medium text-sm">{displayName}</p>
          <p className="text-xs text-gray-400">{conversation.contact.phone}</p>
        </div>
        <div className="ml-auto">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              conversation.status === 'OPEN'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {conversation.status}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-3 py-2 rounded-xl text-sm ${
                msg.direction === 'OUTBOUND'
                  ? 'bg-green-600 text-white rounded-br-sm'
                  : 'bg-white text-gray-900 shadow-sm rounded-bl-sm'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.body}</p>
              <p
                className={`text-xs mt-1 text-right ${
                  msg.direction === 'OUTBOUND' ? 'text-green-200' : 'text-gray-400'
                }`}
              >
                {formatTime(msg.createdAt)}
                {msg.direction === 'OUTBOUND' && (
                  <span className="ml-1">{statusIcon(msg.status)}</span>
                )}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply input */}
      <form
        onSubmit={handleSend}
        className="border-t bg-white px-4 py-3 flex gap-2 items-end shrink-0"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e as unknown as FormEvent);
            }
          }}
          rows={1}
          placeholder="Type a message…"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors shrink-0"
        >
          Send
        </button>
      </form>
    </>
  );
}

function statusIcon(status: string) {
  if (status === 'READ') return '✓✓';
  if (status === 'DELIVERED') return '✓✓';
  if (status === 'SENT') return '✓';
  if (status === 'FAILED') return '✗';
  return '';
}
