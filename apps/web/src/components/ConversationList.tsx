'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ConversationSummary } from '@/app/(inbox)/conversations/page';

function formatTime(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ConversationList({ conversations }: { conversations: ConversationSummary[] }) {
  const pathname = usePathname();

  if (conversations.length === 0) {
    return <p className="p-4 text-sm text-gray-400">No conversations</p>;
  }

  return (
    <ul className="overflow-y-auto flex-1 divide-y">
      {conversations.map((c) => {
        const active = pathname === `/conversations/${c.id}`;
        const displayName = c.contact.name ?? c.contact.phone;
        const preview = c.lastMessage
          ? (c.lastMessage.direction === 'OUTBOUND' ? 'You: ' : '') + c.lastMessage.body
          : '';

        return (
          <li key={c.id}>
            <Link
              href={`/conversations/${c.id}`}
              className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                active ? 'bg-green-50 border-l-2 border-green-600' : ''
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 font-semibold text-sm flex items-center justify-center shrink-0">
                {displayName[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="font-medium text-sm truncate">{displayName}</span>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">
                    {formatTime(c.lastMessageAt)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">{preview}</p>
              </div>
              {c.unreadCount > 0 && (
                <span className="bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                  {c.unreadCount}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
