
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SupportTicket, SupportTicketMessage, User } from "@/lib/types";
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Send, Paperclip } from 'lucide-react';
import { useUser } from '@/hooks/use-user.tsx';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

export default function MyTicketsPage() {
  const { user, addMessageToTicket } = useUser();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [reply, setReply] = useState('');
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const loadData = useCallback(() => {
    if (!user) return;
    try {
      const storedTickets = localStorage.getItem('supportTickets');
      const allTickets: SupportTicket[] = storedTickets 
        ? JSON.parse(storedTickets).map((t: any) => ({
            ...t, 
            createdAt: new Date(t.createdAt), 
            messages: t.messages.map((m: any) => ({...m, createdAt: new Date(m.createdAt)}))
          })) 
        : [];
      
      const userTickets = allTickets
        .filter(t => t.userId === user.id)
        .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setTickets(userTickets);

    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    }
  }, [user]);

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('storage', loadData);
    };
  }, [loadData]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReplyImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleReply = (ticketId: string) => {
    if(!reply.trim() && !replyImage) return;

    const sendMessage = (imageUrl?: string) => {
      addMessageToTicket(ticketId, reply, imageUrl);
      setReply('');
      setReplyImage(null);
      setPreviewImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast({ title: "Reply Sent", description: "Your message has been sent to support." });
    };

    if (replyImage) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const imageUrl = event.target?.result as string;
            sendMessage(imageUrl);
        };
        reader.readAsDataURL(replyImage);
    } else {
        sendMessage();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/profile">
            <Button variant="outline" size="icon" className="h-7 w-7">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
        </Link>
        <div>
            <h1 className="font-headline text-3xl font-bold">My Support Tickets</h1>
            <p className="text-muted-foreground">History of your conversations with support.</p>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-4">
           {tickets.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {tickets.map(ticket => (
                <AccordionItem value={ticket.id} key={ticket.id}>
                  <AccordionTrigger>
                    <div className='flex justify-between items-center w-full pr-4'>
                        <div className="text-left">
                            <p className="font-semibold truncate max-w-[200px]">{ticket.subject}</p>
                            <p className="text-xs text-muted-foreground">{format(ticket.createdAt, 'PP')}</p>
                        </div>
                        <Badge variant={ticket.status === 'open' ? 'destructive' : 'secondary'}>
                            {ticket.status}
                        </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col h-96">
                      <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                          {ticket.messages.map((message, index) => (
                            <div key={index} className={`flex items-end gap-2 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                              {message.sender === 'admin' && (
                                <Avatar className="h-8 w-8 self-start">
                                  <AvatarFallback>A</AvatarFallback>
                                </Avatar>
                              )}
                              <div className={`max-w-xs rounded-lg p-3 text-sm ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                {message.imageUrl && (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <div className="relative h-32 w-48 mb-2 rounded-md overflow-hidden cursor-pointer">
                                        <Image src={message.imageUrl} alt="Attached image" layout="fill" objectFit="cover" />
                                      </div>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-3xl p-2">
                                      <div className="relative aspect-video">
                                        <Image src={message.imageUrl} alt="Attached image" layout="fill" objectFit="contain" />
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )}
                                <p>{message.text}</p>
                                <p className="text-xs opacity-70 mt-1">{format(message.createdAt, 'p')}</p>
                              </div>
                              {message.sender === 'user' && user && (
                                 <Avatar className="h-8 w-8 self-start">
                                  <AvatarImage src={user.avatarUrl} alt={user.username} />
                                  <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="p-4 border-t space-y-2">
                          {previewImage && (
                            <div className="relative h-20 w-20 rounded-md overflow-hidden">
                              <Image src={previewImage} alt="Reply preview" layout="fill" objectFit="cover" />
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Textarea 
                              placeholder="Type your reply..."
                              value={reply}
                              onChange={(e) => setReply(e.target.value)}
                              rows={1}
                              className="min-h-0"
                            />
                            <Button asChild variant="ghost" size="icon">
                              <label htmlFor={`file-upload-${ticket.id}`}>
                                <Paperclip className="h-5 w-5" />
                                <span className="sr-only">Attach image</span>
                              </label>
                            </Button>
                            <Input id={`file-upload-${ticket.id}`} type="file" className="hidden" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
                            <Button onClick={() => handleReply(ticket.id)} size="icon" disabled={!reply.trim() && !replyImage}>
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
           ) : (
            <p className="text-muted-foreground text-center py-16">
              You haven't submitted any support tickets.
            </p>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
