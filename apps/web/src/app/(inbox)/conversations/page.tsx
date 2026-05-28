import { api } from '@/lib/api';
import ConversationList from '@/components/ConversationList';

interface Props {
  searchParams: { status?: string };
}

export const dynamic = 'force-dynamic';

export default async function ConversationsPage({ searchParams }: Props) {
  const status = searchParams.status ?? 'OPEN';
  const result = await api.get<{ data: ConversationSummary[]; total: number }>(
    `/conversations?status=${status}&pageSize=50`,
  ).catch(() => ({ data: [], total: 0 }));

  return (
    <div className="h-full flex">
      <aside className="w-80 border-r bg-white flex flex-col">
        <div className="px-4 py-3 border-b flex gap-2">
          <StatusTab label="Open" value="OPEN" current={status} />
          <StatusTab label="Closed" value="CLOSED" current={status} />
        </div>
        <ConversationList conversations={result.data} />
      </aside>
      <main className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Select a conversation
      </main>
    </div>
  );
}

function StatusTab({ label, value, current }: { label: string; value: string; current: string }) {
  const active = current === value;
  return (
    <a
      href={`/conversations?status=${value}`}
      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
        active ? 'bg-green-100 text-green-800' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {label}
    </a>
  );
}

export interface ConversationSummary {
  id: string;
  status: string;
  lastMessageAt: string | null;
  contact: { id: string; phone: string; name: string | null };
  lastMessage: { body: string; direction: string } | null;
  unreadCount: number;
}
