
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SupportTicket, User } from "@/lib/types";
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, CheckSquare } from 'lucide-react';
import { useUser } from '@/hooks/use-user.tsx';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function MyTicketsPage() {
  const { user } = useUser();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  const loadData = useCallback(() => {
    if (!user) return;
    try {
      const storedTickets = localStorage.getItem('supportTickets');
      const allTickets: SupportTicket[] = storedTickets 
        ? JSON.parse(storedTickets).map((t: any) => ({...t, createdAt: new Date(t.createdAt), repliedAt: t.repliedAt ? new Date(t.repliedAt) : undefined})) 
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
                            <p className="font-semibold truncate max-w-[200px]">{ticket.message}</p>
                            <p className="text-xs text-muted-foreground">{format(ticket.createdAt, 'PP')}</p>
                        </div>
                        <Badge variant={ticket.status === 'open' ? 'destructive' : 'secondary'}>
                            {ticket.status}
                        </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 px-1">
                        <div>
                            <p className="text-sm font-semibold mb-1">Your Message:</p>
                            <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">{ticket.message}</p>
                        </div>
                         {ticket.reply ? (
                            <div>
                                <p className="text-sm font-semibold mb-1 text-primary">Admin Reply:</p>
                                <p className="text-sm text-primary-foreground p-3 bg-primary/20 rounded-md">{ticket.reply}</p>
                                {ticket.repliedAt && <p className="text-xs text-muted-foreground mt-1">Replied on {format(ticket.repliedAt, 'PPp')}</p>}
                            </div>
                         ) : (
                             <p className="text-sm text-muted-foreground text-center py-4">An admin has not replied to this ticket yet.</p>
                         )}
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