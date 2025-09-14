'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSendResetLink = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Reset Link Sent',
      description: 'If an account exists with that email, a password reset link has been sent.',
    });
    router.push('/login');
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
            <CardDescription>Enter your email address and we'll send you a link to reset your password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendResetLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" required />
              </div>
              <Button type="submit" className="w-full">Send Reset Link</Button>
            </form>
            <div className="mt-4 text-center text-sm">
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
