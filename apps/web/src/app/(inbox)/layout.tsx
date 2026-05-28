import { redirect } from 'next/navigation';
import { getMe } from '@/lib/auth';
import LogoutButton from '@/components/LogoutButton';

export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  const user = await getMe();
  if (!user) redirect('/login');

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-green-700 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <span className="font-semibold text-lg">WhatsApp Inbox</span>
        <div className="flex items-center gap-3 text-sm">
          <span>{user.name}</span>
          <LogoutButton />
        </div>
      </header>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
