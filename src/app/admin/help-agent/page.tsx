
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Bot, Loader2, Send, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { askHelpAgent } from '@/ai/flows/help-agent';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

interface Message {
  sender: 'user' | 'agent';
  text: string;
}

export default function AdminHelpAgentPage() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  const handleAsk = async () => {
    if (!query.trim()) {
      return;
    }

    const userMessage: Message = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setQuery('');

    try {
      const result = await askHelpAgent({ query });
      const agentMessage: Message = { sender: 'agent', text: result.response };
      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error('Error asking help agent:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not get a response from the help agent. Please try again.',
      });
      // Optionally remove the user's message if the agent fails
      setMessages(prev => prev.slice(0, prev.length -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/dashboard">
          <Button variant="outline" size="icon" className="h-7 w-7">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
        </Link>
        <div>
          <h1 className="font-headline text-3xl font-bold">AI Help Agent</h1>
          <p className="text-muted-foreground">Test the AI-powered support agent.</p>
        </div>
      </div>
      
      <Card className="h-[70vh] flex flex-col">
        <CardHeader>
            <CardTitle>Conversation</CardTitle>
            <CardDescription>Messages with the AI will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4">
            <ScrollArea className="flex-1 p-4 border rounded-md">
                <div className="space-y-4">
                {messages.length === 0 && (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-muted-foreground">No messages yet. Ask a question to start.</p>
                    </div>
                )}
                {messages.map((message, index) => (
                    <div
                    key={index}
                    className={`flex items-start gap-3 ${
                        message.sender === 'user' ? 'justify-end' : ''
                    }`}
                    >
                    {message.sender === 'agent' && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Bot className="h-5 w-5" />
                        </div>
                    )}
                    <div
                        className={`max-w-lg rounded-lg px-4 py-2 text-sm ${
                        message.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                    >
                        {message.text}
                    </div>
                    {message.sender === 'user' && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="h-5 w-5" />
                        </div>
                    )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Bot className="h-5 w-5" />
                    </div>
                    <div className="max-w-lg rounded-lg px-4 py-2 text-sm bg-muted flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                    </div>
                )}
                </div>
            </ScrollArea>
            <div className="relative">
                <Input
                    type="text"
                    placeholder="Type your question..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                    disabled={isLoading}
                    className="pr-12"
                />
                <Button
                    type="submit"
                    size="icon"
                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                    onClick={handleAsk}
                    disabled={isLoading || !query.trim()}
                >
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                </Button>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
