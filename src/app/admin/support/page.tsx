'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SupportTicket, User, SupportTicketMessage } from "@/lib/types";
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, MessageSquare, CheckSquare, Mail, MoreHorizontal, Send, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Image from 'next/image';

// FIREBASE IMPORTS
import { useFirebase } from '@/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  Timestamp,
  arrayUnion 
} from 'firebase/firestore';

export default function AdminSupportPage() {
  const { firestore } = useFirebase();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<SupportTicket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;

    // Listen for users
    const unsubUsers = onSnapshot(collection(firestore, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData);
    });

    // Listen for support tickets
    const q = query(collection(firestore, 'support'), orderBy('createdAt', 'desc'));
    const unsubTickets = onSnapshot(q, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
          messages: (data.messages || []).map((m: any) => ({
            ...m,
            createdAt: m.createdAt instanceof Timestamp ? m.createdAt.toDate() : (m.createdAt ? new Date(m.createdAt) : new Date())
          }))
        };
      }) as SupportTicket[];
      
      setTickets(ticketsData.sort((a,b) => {
        if (a.status === 'open' && b.status !== 'open') return -1;
        if (a.status !== 'open' && b.status === 'open') return 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      }));
    });

    return () => {
      unsubUsers();
      unsubTickets();
    };
  }, [firestore]);

  const handleRefresh = () => {
    toast({ title: 'Support tickets synced', description: 'Data is being updated in real-time.' });
  };
  
  const handleToggleStatus = async (ticket: SupportTicket) => {
    if (!firestore) return;
    try {
      const ticketRef = doc(firestore, 'support', ticket.id);
      await updateDoc(ticketRef, { 
        status: ticket.status === 'open' ? 'closed' : 'open' 
      });
      toast({ title: 'Ticket status updated' });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
    }
  };

  const handleSendReply = async () => {
    if (!activeTicketId || !replyMessage.trim() || !firestore) return;

    const newMessage = {
      sender: 'admin',
      text: replyMessage,
      createdAt: Timestamp.now(),
    };

    try {
      const ticketRef = doc(firestore, 'support', activeTicketId);
      await updateDoc(ticketRef, {
        messages: arrayUnion(newMessage),
        status: 'closed'
      });
      
      toast({ title: 'Reply Sent', description: 'The user has been notified.' });
      setReplyMessage('');
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send reply.' });
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete || !firestore) return;
    try {
      await deleteDoc(doc(firestore, 'support', ticketToDelete.id));
      toast({ title: 'Ticket Deleted', description: 'The support ticket has been permanently removed.' });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete ticket.' });
    }
    setTicketToDelete(null);
  };

  const getUserForTicket = (userId: string) => users.find(u => u.id === userId);
  const activeTicket = tickets.find(t => t.id === activeTicketId);

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
                   if (isOpen) setActiveTicketId(ticket.id);
                   else {
                    setActiveTicketId(null);
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
                            <DropdownMenuItem onClick={() => handleToggleStatus(ticket)}>
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => setTicketToDelete(ticket)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Ticket
                            </DropdownMenuItem>
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
                                {(activeTicket || ticket).messages.map((message, index) => (
                                    <div key={index} className={`flex items-end gap-2 ${message.sender === 'admin' ? 'justify-end' : ''}`}>
                                    {message.sender === 'user' && user && (
                                        <Avatar className="h-8 w-8 self-start">
                                            <AvatarImage src={user.avatarUrl} alt={user.username} />
                                            <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={`max-w-xs rounded-lg p-3 text-sm ${message.sender === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                       {message.imageUrl && (
                                          <Dialog>
                                            <DialogTrigger asChild>
                                              <div className="relative h-32 w-48 mb-2 rounded-md overflow-hidden cursor-pointer">
                                                <Image src={message.imageUrl} alt="Attached image" fill className="object-cover" />
                                              </div>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl p-2">
                                              <div className="relative aspect-video">
                                                <Image src={message.imageUrl} alt="Attached image" fill className="object-contain" />
                                              </div>
                                            </DialogContent>
                                          </Dialog>
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

      <AlertDialog open={!!ticketToDelete} onOpenChange={(open) => !open && setTicketToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the conversation history for this ticket.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTicketToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTicket} className="bg-destructive hover:bg-destructive/90">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
