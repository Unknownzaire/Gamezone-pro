
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { useFirebase } from '@/firebase';
import { sendPasswordResetEmail } from "firebase/auth";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const { auth } = useFirebase();
  const [emailInput, setEmailInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendEmailResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) {
      toast({
        variant: 'destructive',
        title: 'Email Required',
        description: 'Please enter your email address.',
      });
      return;
    }
    
    if (!auth) {
        toast({
            variant: 'destructive',
            title: 'Authentication service not ready',
            description: 'Please wait a moment and try again.',
        });
        return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, emailInput);
      // For security reasons, don't reveal if the user was found or not.
      toast({
        title: 'Password Reset Email Sent',
        description: 'If an account exists for this email, a password reset link has been sent. Please check your inbox.',
      });
    } catch (error: any) {
      // We show a generic message even on error to prevent user enumeration
      console.error("Password reset error:", error);
       toast({
        title: 'Password Reset Email Sent',
        description: 'If an account exists for this email, a password reset link has been sent. Please check your inbox.',
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
            <Logo />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Forgot Password</CardTitle>
            <CardDescription>Enter your email to receive a password reset link.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendEmailResetLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" required value={emailInput} onChange={(e) => setEmailInput(e.target.value)} disabled={isLoading || !auth} />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || !auth}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
             <div className="mt-6 text-center text-sm">
                <Link href="/login" className="flex items-center justify-center gap-2 text-muted-foreground hover:text-primary">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
