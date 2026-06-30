
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { SupportTicket } from "@/lib/types";
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
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, where, orderBy, Timestamp } from 'firebase/firestore';

export default function MyTicketsPage() {
  const { user, addMessageToTicket } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const ticketsQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, 'support'), where('userId', '==', user.id), orderBy('createdAt', 'desc')) : null,
    [firestore, user]
  );
  const { data: tickets = [] } = useCollection<SupportTicket>(ticketsQuery);

  const [reply, setReply] = useState('');
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setReplyImage(file);
      const reader = new FileReader();
      reader.onload = (event) => setPreviewImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };
  
  const handleReply = async (ticketId: string) => {
    if(!reply.trim() && !replyImage) return;
    addMessageToTicket(ticketId, reply, previewImage || undefined);
    setReply('');
    setReplyImage(null);
    setPreviewImage(null);
    toast({ title: "Reply Sent" });
  }

  if (!user) return <div className="p-8 text-center">Loading tickets...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/profile"><Button variant="outline" size="icon" className="h-7 w-7"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="font-headline text-3xl font-bold">My Support Tickets</h1>
      </div>
      
      <Card>
        <CardContent className="p-4">
           {tickets.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {tickets.map(ticket => (
                <AccordionItem value={ticket.id} key={ticket.id}>
                  <AccordionTrigger>
                    <div className='flex justify-between items-center w-full pr-4'>
                        <div className="text-left"><p className="font-semibold">{ticket.subject}</p><p className="text-xs text-muted-foreground">{format(new Date(ticket.createdAt), 'PP')}</p></div>
                        <Badge variant={ticket.status === 'open' ? 'destructive' : 'secondary'}>{ticket.status}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col h-96">
                      <ScrollArea className="flex-1 p-4 space-y-4">
                        {ticket.messages.map((message, index) => (
                          <div key={index} className={`flex items-end gap-2 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                            <div className={`max-w-xs rounded-lg p-3 text-sm ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                              {message.imageUrl && <Image src={message.imageUrl} alt="img" width={200} height={150} className="mb-2 rounded" />}
                              <p>{message.text}</p>
                              <p className="text-[10px] opacity-70 mt-1">{format(new Date(message.createdAt), 'p')}</p>
                            </div>
                          </div>
                        ))}
                      </ScrollArea>
                      <div className="p-4 border-t space-y-2">
                          {previewImage && <Image src={previewImage} alt="preview" width={80} height={80} className="rounded" />}
                          <div className="flex items-center gap-2">
                            <Textarea placeholder="Reply..." value={reply} onChange={(e) => setReply(e.target.value)} rows={1} />
                            <Button variant="ghost" size="icon" asChild><label><Paperclip className="h-5 w-5" /><input type="file" className="hidden" onChange={handleFileChange} /></label></Button>
                            <Button onClick={() => handleReply(ticket.id)} size="icon" disabled={!reply.trim() && !replyImage}><Send className="h-4 w-4" /></Button>
                          </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
           ) : <p className="text-center py-16 text-muted-foreground">No tickets found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
