"use client";

import { Wallet, Bell } from "lucide-react";
import Logo from "./Logo";
import Link from "next/link";
import { useUser } from "@/hooks/use-user.tsx";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const notifications = [
    { id: 1, title: 'Tournament Starting!', description: 'Midnight Mayhem is about to start in 15 minutes.', time: '5m ago' },
    { id: 2, title: 'Prize Credited', description: 'You won ₹1,500 from Victory Valley.', time: '2h ago' },
    { id: 3, title: 'Withdrawal Processed', description: 'Your withdrawal of ₹500 was successful.', time: '1d ago' },
    { id: 4, title: 'Team Invite!', description: 'Player42 has invited you to join "The Winners".', time: '2d ago' },
];


export default function AppHeader() {
  const { user } = useUser();

  return (
    <header className="fixed top-0 left-0 right-0 z-10 border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 max-w-lg items-center justify-between px-4">
        <Logo />
        <div className="flex items-center gap-2">
          <Link href="/wallet" className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10">
            <Wallet className="h-5 w-5" />
            {user ? (
              <span>₹{user.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            ) : (
              <Skeleton className="h-5 w-12" />
            )}
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {notifications.length > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0 text-xs">{notifications.length}</Badge>}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                      <DropdownMenuItem key={notification.id} className="flex-col items-start gap-1 p-3">
                          <div className="flex justify-between w-full">
                              <p className="font-semibold text-sm">{notification.title}</p>
                              <p className="text-xs text-muted-foreground">{notification.time}</p>
                          </div>
                          <p className="text-sm text-muted-foreground w-full whitespace-normal">{notification.description}</p>
                      </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
                )}
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </header>
  );
}
