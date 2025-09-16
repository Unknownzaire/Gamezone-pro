
"use client";

import React, { useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import { useUser } from '@/hooks/use-user.tsx';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

function AppContent({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user && user.isBlocked) {
      router.push('/blocked');
    }
  }, [user, router]);

  if (user && user.isBlocked) {
    // Render a loading state or nothing while redirecting
    return (
      <div className="flex min-h-screen flex-col bg-background items-center justify-center">
        <Skeleton className="h-20 w-full" />
        <div className="flex-1 container mx-auto max-w-lg px-4 pt-16 pb-20">
           <Skeleton className="h-full w-full" />
        </div>
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

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


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
      <AppContent>{children}</AppContent>
  );
}
