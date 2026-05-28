import { cookies } from 'next/headers';
import { serverGet } from '@/lib/api';
import ConversationList from '@/components/ConversationList';
import MessageThread from '@/components/MessageThread';
import type { ConversationSummary } from '../page';

export const dynamic = 'force-dynamic';

interface Message {
  id: string;
  conversationId: string;
  direction: string;
  body: string;
  status: string;
  createdAt: string;
}

interface ConversationDetail {
  id: string;
  status: string;
  contact: { id: string; phone: string; name: string | null };
  messages: Message[];
}

interface Props {
  params: { id: string };
  searchParams: { status?: string };
}

export default async function ConversationDetailPage({ params, searchParams }: Props) {
  const status = searchParams.status ?? 'OPEN';
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value ?? '';
  const cookieHeader = token ? `access_token=${token}` : '';

  const [listResult, detail] = await Promise.all([
    serverGet<{ data: ConversationSummary[] }>(
      `/conversations?status=${status}&pageSize=50`,
      cookieHeader,
    ).catch(() => ({ data: [] })),
    serverGet<ConversationDetail>(`/conversations/${params.id}`, cookieHeader).catch(() => null),
  ]);

  return (
    <div className="h-full flex">
      <aside className="w-80 border-r bg-white flex flex-col">
        <div className="px-4 py-3 border-b flex gap-2">
          <StatusTab label="Open" value="OPEN" current={status} />
          <StatusTab label="Closed" value="CLOSED" current={status} />
        </div>
        <ConversationList conversations={listResult.data} />
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        {detail ? (
          <MessageThread conversation={detail} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Conversation not found
          </div>
        )}
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
