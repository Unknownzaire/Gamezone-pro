
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockUsers } from "@/lib/mock-data";
import { SupportTicket, User } from "@/lib/types";
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, MessageSquare, CheckSquare, Mail, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();

  const loadData = useCallback(() => {
    try {
      const storedUsers = localStorage.getItem('allUsers');
      setUsers(storedUsers ? JSON.parse(storedUsers) : mockUsers);
      
      const storedTickets = localStorage.getItem('supportTickets');
      const allTickets: SupportTicket[] = storedTickets 
        ? JSON.parse(storedTickets).map((t: any) => ({...t, createdAt: new Date(t.createdAt)})) 
        : [];
      
      setTickets(allTickets.sort((a,b) => a.status === 'open' ? -1 : 1));

    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    }
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('storage', loadData);
    };
  }, [loadData]);

  const handleRefresh = () => {
    loadData();
    toast({ title: 'Support tickets reloaded' });
  };
  
  const handleToggleStatus = (ticketId: string) => {
    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return { ...t, status: t.status === 'open' ? 'closed' : 'open' };
      }
      return t;
    });
    localStorage.setItem('supportTickets', JSON.stringify(updatedTickets));
    setTickets(updatedTickets);
    toast({ title: 'Ticket status updated' });
  };

  const getUserForTicket = (userId: string) => users.find(u => u.id === userId);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="hidden md:block">
              <Button variant="outline" size="icon" className="h-7 w-7">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
              </Button>
          </Link>
          <div>
            <h1 className="font-headline text-3xl font-bold">Support Tickets</h1>
            <p className="text-muted-foreground">Manage and respond to user queries.</p>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh tickets</span>
        </Button>
      </div>

       <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.filter(t => t.status === 'open').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Tickets</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.filter(t => t.status === 'closed').length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => {
                const user = getUserForTicket(ticket.userId);
                return (
                  <TableRow key={ticket.id} className={ticket.status === 'closed' ? 'bg-muted/50' : ''}>
                    <TableCell>
                      {user ? (
                         <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl} alt={user.username} />
                            <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="font-medium">
                            <p>{user.username}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      ) : 'Unknown User'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{ticket.message}</TableCell>
                    <TableCell>{format(ticket.createdAt, 'PPp')}</TableCell>
                    <TableCell>
                      <Badge variant={ticket.status === 'open' ? 'destructive' : 'secondary'}>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <Dialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DialogTrigger asChild>
                                <DropdownMenuItem>View Message</DropdownMenuItem>
                            </DialogTrigger>
                             <DropdownMenuItem onClick={() => handleToggleStatus(ticket.id)}>
                                {ticket.status === 'open' ? 'Mark as Closed' : 'Re-open Ticket'}
                            </DropdownMenuItem>
                            {user && (
                                <DropdownMenuItem asChild>
                                <a href={`mailto:${user.email}`}>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Reply via Email
                                </a>
                                </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                         <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Support Message</DialogTitle>
                                {user && (
                                <DialogDescription>
                                    From: {user.username} ({user.email}) on {format(ticket.createdAt, 'PPp')}
                                </DialogDescription>
                                )}
                            </DialogHeader>
                            <div className="my-4 rounded-md border bg-muted p-4 text-sm">
                                {ticket.message}
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                <Button variant="outline">Close</Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                       </Dialog>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {tickets.length === 0 && (
            <p className="text-center text-muted-foreground py-16">
              No support tickets yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
