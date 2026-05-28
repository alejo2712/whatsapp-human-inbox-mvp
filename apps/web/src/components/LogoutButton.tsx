'use client';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';

export default function LogoutButton() {
  const router = useRouter();
  async function handleLogout() {
    await logout();
    router.push('/login');
  }
  return (
    <button
      onClick={handleLogout}
      className="bg-green-800 hover:bg-green-900 px-3 py-1 rounded text-sm transition-colors"
    >
      Sign out
    </button>
  );
}
