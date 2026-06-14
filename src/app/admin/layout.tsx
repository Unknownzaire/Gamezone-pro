'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Root layout for the admin section.
 * Enforces that all sub-routes (except /admin/login) require a valid session.
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Allow access to the login page without auth
    if (pathname === '/admin/login') {
      setIsAuthorized(true);
      return;
    }

    // Check if the admin is authenticated for this session
    const auth = sessionStorage.getItem('isAdminAuthenticated');
    
    if (auth !== 'true') {
      // Force redirect to login if not authorized
      router.replace('/admin/login');
      setIsAuthorized(false);
    } else {
      // Session is valid
      setIsAuthorized(true);
    }
  }, [pathname, router]);

  // While determining authorization status, show a minimal loading state
  if (isAuthorized === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-48 mx-auto" />
          <p className="text-muted-foreground animate-pulse text-sm">Verifying Admin Session...</p>
        </div>
      </div>
    );
  }

  // Prevent rendering children if not authorized (while redirect is in progress)
  if (!isAuthorized && pathname !== '/admin/login') {
    return null;
  }

  return <>{children}</>;
}
