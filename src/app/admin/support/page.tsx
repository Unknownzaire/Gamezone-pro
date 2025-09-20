
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockUsers } from "@/lib/mock-data";
import { SupportTicket, User, SupportTicketMessage } from "@/lib/types";
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, MessageSquare, CheckSquare, Mail, MoreHorizontal, Send, Paperclip } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const { toast } = useToast();

  const loadData = useCallback(() => {
    try {
      const storedUsers = localStorage.getItem('allUsers');
      setUsers(storedUsers ? JSON.parse(storedUsers) : mockUsers);
      
      const storedTickets = localStorage.getItem('supportTickets');
      const allTickets: SupportTicket[] = storedTickets 
        ? JSON.parse(storedTickets).map((t: any) => ({
            ...t, 
            createdAt: new Date(t.createdAt), 
            messages: t.messages ? t.messages.map((m:any) => ({...m, createdAt: new Date(m.createdAt)})) : []
          })) 
        : [];
      
      setTickets(allTickets.sort((a,b) => {
        if (a.status === 'open' && b.status !== 'open') return -1;
        if (a.status !== 'open' && b.status === 'open') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }));

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
    loadData();
    toast({ title: 'Ticket status updated' });
  };

  const handleSendReply = () => {
    if (!activeTicket || !replyMessage.trim()) return;

    const newMessage: SupportTicketMessage = {
      sender: 'admin',
      text: replyMessage,
      createdAt: new Date(),
    };

    const updatedTickets = tickets.map(t => {
      if (t.id === activeTicket.id) {
        return { 
          ...t, 
          messages: [...t.messages, newMessage],
          status: 'closed' as const
        };
      }
      return t;
    });
    localStorage.setItem('supportTickets', JSON.stringify(updatedTickets));
    loadData();
    
    toast({ title: 'Reply Sent', description: 'The user has been notified.' });
    setReplyMessage('');
    // Keep dialog open to see new message
    const updatedActiveTicket = updatedTickets.find(t => t.id === activeTicket.id);
    setActiveTicket(updatedActiveTicket || null);
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
                <TableHead>Subject</TableHead>
                <TableHead>Last Update</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => {
                const user = getUserForTicket(ticket.userId);
                const lastMessage = ticket.messages[ticket.messages.length - 1];
                return (
                 <Dialog key={ticket.id} onOpenChange={(isOpen) => {
                   if (isOpen) setActiveTicket(ticket);
                   else {
                    setActiveTicket(null);
                    setReplyMessage('');
                   }
                 }}>
                    <TableRow className={ticket.status === 'closed' ? 'bg-muted/50' : ''}>
                      <DialogTrigger asChild>
                        <TableCell className="cursor-pointer">
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
                      </DialogTrigger>
                       <DialogTrigger asChild>
                        <TableCell className="max-w-xs truncate cursor-pointer font-medium">{ticket.subject}</TableCell>
                       </DialogTrigger>
                       <DialogTrigger asChild>
                        <TableCell className="cursor-pointer">{lastMessage ? format(lastMessage.createdAt, 'PPp') : format(ticket.createdAt, 'PPp')}</TableCell>
                       </DialogTrigger>
                       <DialogTrigger asChild>
                        <TableCell className="cursor-pointer">
                          <Badge variant={ticket.status === 'open' ? 'destructive' : 'secondary'}>
                            {ticket.status}
                          </Badge>
                        </TableCell>
                       </DialogTrigger>
                      <TableCell className="text-right">
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
                                <DropdownMenuItem>View/Reply</DropdownMenuItem>
                            </DialogTrigger>
                            <DropdownMenuItem onClick={() => handleToggleStatus(ticket.id)}>
                                {ticket.status === 'open' ? 'Mark as Closed' : 'Re-open Ticket'}
                            </DropdownMenuItem>
                            {user && (
                                <DropdownMenuItem asChild>
                                <a href={`mailto:${user.email}?subject=Re: Support Ticket ${ticket.id}`}>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Reply via Email
                                </a>
                                </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                     <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Support Ticket: {ticket.subject}</DialogTitle>
                             <DialogDescription>
                                From: {user?.username} ({user?.email})
                            </DialogDescription>
                        </DialogHeader>
                         <div className="flex flex-col h-[60vh]">
                            <ScrollArea className="flex-1 p-4 border rounded-md">
                                <div className="space-y-4">
                                {ticket.messages.map((message, index) => (
                                    <div key={index} className={`flex items-end gap-2 ${message.sender === 'admin' ? 'justify-end' : ''}`}>
                                    {message.sender === 'user' && user && (
                                        <Avatar className="h-8 w-8 self-start">
                                            <AvatarImage src={user.avatarUrl} alt={user.username} />
                                            <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={`max-w-xs rounded-lg p-3 text-sm ${message.sender === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                       {message.imageUrl && (
                                          <div className="relative h-32 w-48 mb-2 rounded-md overflow-hidden">
                                            <Image src={message.imageUrl} alt="Attached image" layout="fill" objectFit="cover" />
                                          </div>
                                        )}
                                        <p>{message.text}</p>
                                        <p className="text-xs opacity-70 mt-1">{format(message.createdAt, 'p')}</p>
                                    </div>
                                     {message.sender === 'admin' && (
                                        <Avatar className="h-8 w-8 self-start">
                                            <AvatarFallback>A</AvatarFallback>
                                        </Avatar>
                                    )}
                                    </div>
                                ))}
                                </div>
                            </ScrollArea>
                            <div className="p-4 border-t flex items-center gap-2">
                                <Textarea
                                id="reply-message"
                                placeholder="Type your reply..."
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                rows={2}
                                />
                                <Button onClick={handleSendReply} size="icon" disabled={!replyMessage.trim()}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                 </Dialog>
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
