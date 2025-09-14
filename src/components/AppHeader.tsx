
"use client";

import { Wallet } from "lucide-react";
import Logo from "./Logo";
import Link from "next/link";
import { useUser } from "@/hooks/use-user.tsx";
import { Skeleton } from "./ui/skeleton";

export default function AppHeader() {
  const { user } = useUser();

  return (
    <header className="fixed top-0 left-0 right-0 z-10 border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 max-w-lg items-center justify-between px-4">
        <Logo />
        <Link href="/wallet" className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10">
          <Wallet className="h-5 w-5" />
          {user ? (
            <span>₹{user.walletBalance.toLocaleString('en-IN')}</span>
          ) : (
            <Skeleton className="h-5 w-12" />
          )}
        </Link>
      </div>
    </header>
  );
}
