
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user.tsx";
import { Copy, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ReferEarnPage() {
  const { user } = useUser();
  const { toast } = useToast();
  
  const referralCode = user ? `ARENA${user.id.substring(0, 6).toUpperCase()}` : 'LOGIN-TO-REFER';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    toast({
      title: "Copied to clipboard!",
      description: "Your referral code has been copied.",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join me on Arena Ace!',
        text: `Join me on Arena Ace and start competing in BGMI tournaments. Use my referral code: ${referralCode}`,
        url: window.location.href,
      }).catch((error) => console.log('Error sharing', error));
    } else {
        // Fallback for browsers that don't support navigator.share
        handleCopy();
        toast({
            title: "Share not supported",
            description: "Your browser does not support native sharing. The referral code has been copied to your clipboard instead.",
        });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold">Refer & Earn</h1>

      <Card className="text-center">
        <CardHeader>
          <CardTitle>Invite Your Friends</CardTitle>
          <CardDescription>
            Share your referral code with friends. When they sign up and join their first tournament, you both get a bonus!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">Your Unique Referral Code</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <p className="text-2xl font-bold font-mono tracking-widest text-primary border-2 border-dashed border-primary p-3 rounded-lg">
                {referralCode}
              </p>
              <Button variant="ghost" size="icon" onClick={handleCopy}>
                <Copy className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <Button className="w-full" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share Your Code
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
           <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">1</div>
              <p>Share your unique referral code with your friends.</p>
           </div>
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">2</div>
              <p>Your friend signs up using your code.</p>
           </div>
           <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">3</div>
              <p>When your friend joins their first paid tournament, you both receive a ₹25 bonus in your wallets!</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
