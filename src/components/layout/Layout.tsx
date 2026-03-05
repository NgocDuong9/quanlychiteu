import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useTransactionStore } from '../../stores/useTransactionStore';
import BottomNav from './BottomNav';

export default function Layout() {
  const location = useLocation();
  const fetchDataFromSheet = useTransactionStore((state) => state.fetchDataFromSheet);

  useEffect(() => {
    // Trigger sync on tab switch, but skip settings page
    if (location.pathname === '/settings') return;
    fetchDataFromSheet();
  }, [location.pathname, fetchDataFromSheet]);

  useEffect(() => {
    // Also sync when the user returns to the app (PWA focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('App became visible, syncing data...');
        fetchDataFromSheet();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchDataFromSheet]);

  return (
    <div className="flex flex-col bg-black" style={{ height: '100dvh' }}>
      {/* Main content area - overflow hidden to prevent body bounce */}
      <main className="flex-1 flex flex-col min-h-0 pt-[env(safe-area-inset-top)] overflow-hidden">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
