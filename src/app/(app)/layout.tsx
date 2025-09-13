"use client";

import React from 'react';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex-1 overflow-y-auto pb-20 pt-16">
        <div className="container mx-auto max-w-lg px-4">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
