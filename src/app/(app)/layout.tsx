
"use client";

import React, { useEffect, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import { useUser } from '@/hooks/use-user.tsx';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LifeBuoy, Send, MessageCircle, Paperclip } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, addSupportTicket } = useUser();
  const router = useRouter();
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportImage, setSupportImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user && user.isBlocked) {
      router.push('/blocked');
    }
  }, [user, router]);

  if (user && user.isBlocked) {
    // Render a loading state or nothing while redirecting
    return (
      <div className="flex min-h-screen flex-col bg-background items-center justify-center">
        <Skeleton className="h-20 w-full" />
        <div className="flex-1 container mx-auto max-w-lg px-4 pt-16 pb-20">
           <Skeleton className="h-full w-full" />
        </div>
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSupportImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendSupportMessage = () => {
    if (!supportMessage.trim()) {
      toast({
        variant: 'destructive',
        title: 'Empty Message',
        description: 'Please write a message before sending.',
      });
      return;
    }

    const sendMessage = (imageUrl?: string) => {
      addSupportTicket(supportMessage, imageUrl);
      toast({
        title: 'Message Sent',
        description: 'Our support team will get back to you shortly.',
      });
      setSupportMessage('');
      setSupportImage(null);
      setPreviewImage(null);
      setIsSupportOpen(false);
    };
    
    if (supportImage) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const imageUrl = event.target?.result as string;
            sendMessage(imageUrl);
        };
        reader.readAsDataURL(supportImage);
    } else {
        sendMessage();
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex-1 overflow-y-auto pb-20 pt-16">
        <div className="container mx-auto max-w-lg px-4">
          {children}
        </div>
      </main>
      <BottomNav />
      <Dialog open={isSupportOpen} onOpenChange={setIsSupportOpen}>
        <DialogTrigger asChild>
            <Button
            size="icon"
            className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
            >
            <MessageCircle className="h-6 w-6" />
            <span className="sr-only">Help & Support</span>
            </Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Contact Support</DialogTitle>
            <DialogDescription>
                Have a question or problem? Send us a message and we'll get back to you.
            </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Type your message here..."
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              rows={5}
            />
            {previewImage && (
              <Dialog>
                <DialogTrigger asChild>
                  <div className="relative h-32 w-32 rounded-md overflow-hidden cursor-pointer">
                    <Image src={previewImage} alt="Image preview" layout="fill" objectFit="cover" />
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-3xl p-2">
                    <div className="relative aspect-video">
                        <Image src={previewImage} alt="Image preview" layout="fill" objectFit="contain" />
                    </div>
                </DialogContent>
              </Dialog>
            )}
            <Input id="support-image" type="file" accept="image/*" onChange={handleFileChange} className="text-xs" />
            <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSendSupportMessage}>
                <Send className="mr-2 h-4 w-4" />
                Send Message
            </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
      <AppContent>{children}</AppContent>
  );
}
