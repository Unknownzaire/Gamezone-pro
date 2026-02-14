
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";

export default function AppHeader() {
  const { user, allUsers, notifications, markNotificationsAsRead, updateUser, toast } = useUser();

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleOpenChange = (open: boolean) => {
    if (open && unreadCount > 0) {
      setTimeout(() => markNotificationsAsRead(), 1000); // Mark as read after a short delay
    }
  };

  const handleJoinTeam = (teamName?: string) => {
      if (!user || !teamName) return;

      if (user.teamName) {
          toast({
              variant: 'destructive',
              title: 'Already in a team',
              description: `You are already in team "${user.teamName}". Leave it before joining another.`,
          });
          return;
      }

      const teamMembersCount = allUsers.filter(u => u.teamName === teamName).length;
      if (teamMembersCount >= 4) {
        toast({
          variant: 'destructive',
          title: 'Team is Full',
          description: `The team "${teamName}" already has 4 members and cannot accept new players.`,
        });
        return;
      }

      updateUser({ teamName });
      toast({
          title: 'Joined Team!',
          description: `You are now a member of "${teamName}".`
      });
  }

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
          
          <DropdownMenu onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0 text-xs">{unreadCount}</Badge>}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <Dialog key={notification.id}>
                        <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex-col items-start gap-1 p-3 cursor-pointer">
                                <div className="flex justify-between w-full">
                                    <p className="font-semibold text-sm">{notification.title}</p>
                                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(notification.createdAt, { addSuffix: true })}</p>
                                </div>
                                <p className="text-sm text-muted-foreground w-full whitespace-normal">{notification.description}</p>
                            </DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{notification.title}</DialogTitle>
                                <DialogDescription>
                                    {format(notification.createdAt, 'PPp')}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <p>{notification.description}</p>
                            </div>
                            <DialogFooter className="gap-2 sm:justify-between">
                                <DialogClose asChild>
                                    <Button variant="outline">Close</Button>
                                </DialogClose>
                                {notification.type === 'team-invite' ? (
                                    <DialogClose asChild>
                                        <Button onClick={() => handleJoinTeam(notification.payload?.teamName)}>Join Team</Button>
                                    </DialogClose>
                                ) : notification.link ? (
                                    <DialogClose asChild>
                                        <Link href={notification.link} passHref>
                                            <Button>Take Action</Button>
                                        </Link>
                                    </DialogClose>
                                ) : null}
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
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
