'use client';

import { useState } from 'react';
import RequireAuth from '@/components/require-auth';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <RequireAuth>
      <div className="relative flex min-h-screen bg-[#f4f6fb]">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenu={() => setMenuOpen(true)} />
          <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}