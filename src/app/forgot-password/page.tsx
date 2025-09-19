
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
import { useState } from "react";
import { useUser } from "@/hooks/use-user";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { allUsers } = useUser();
  const [emailInput, setEmailInput] = useState('');
  const [mobileInput, setMobileInput] = useState('');


  const handleSendEmailResetLink = (e: React.FormEvent) => {
    e.preventDefault();
    const userExists = allUsers.some(user => user.email === emailInput);
    if(userExists) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        toast({
        title: 'OTP Sent',
        description: `If an account exists, an OTP has been sent. (OTP: ${otp})`,
        });
    } else {
        toast({
        title: 'Request Received',
        description: `If an account exists for this email, an OTP has been sent.`,
        });
    }
  };

  const handleSendMobileResetLink = (e: React.FormEvent) => {
    e.preventDefault();
    const userExists = allUsers.some(user => user.mobile === mobileInput);
    if(userExists){
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        toast({
        title: 'OTP Sent',
        description: `If an account exists, an OTP has been sent via SMS. (OTP: ${otp})`,
        });
    } else {
        toast({
        title: 'Request Received',
        description: `If an account exists for this mobile number, an OTP has been sent.`,
        });
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
                    <Input id="email" type="email" placeholder="you@example.com" required value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full">Send OTP</Button>
                </form>
              </TabsContent>
              <TabsContent value="mobile" className="mt-4">
                 <form onSubmit={handleSendMobileResetLink} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <Input 
                      id="mobile" 
                      type="tel" 
                      placeholder="Your mobile number" 
                      required 
                      value={mobileInput} 
                      onChange={(e) => {
                          const numericValue = e.target.value.replace(/[^0-9]/g, '');
                          if (numericValue.length <= 12) {
                            setMobileInput(numericValue);
                          }
                      }} 
                    />
                  </div>
                  <Button type="submit" className="w-full">Send OTP</Button>
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
