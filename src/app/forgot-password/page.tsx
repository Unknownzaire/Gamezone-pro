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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSendEmailResetLink = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Reset Link Sent',
      description: 'If an account exists with that email, a password reset link has been sent.',
    });
    router.push('/login');
  };

  const handleSendMobileResetLink = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Reset Link Sent',
      description: 'If an account exists with that mobile number, a password reset link has been sent via SMS.',
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
            <CardDescription>Select a method to reset your password.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="mobile">Mobile</TabsTrigger>
              </TabsList>
              <TabsContent value="email" className="mt-4">
                 <form onSubmit={handleSendEmailResetLink} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" required />
                  </div>
                  <Button type="submit" className="w-full">Send Reset Link</Button>
                </form>
              </TabsContent>
              <TabsContent value="mobile" className="mt-4">
                 <form onSubmit={handleSendMobileResetLink} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <Input id="mobile" type="tel" placeholder="Your mobile number" required />
                  </div>
                  <Button type="submit" className="w-full">Send Reset Link</Button>
                </form>
              </TabsContent>
            </Tabs>
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
