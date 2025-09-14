
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import Link from "next/link";
import { useState, ChangeEvent } from "react";
import { UserProvider, useUser } from "@/hooks/use-user.tsx";
import { User } from "@/lib/types";

function LoginFormComponent() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('login');
  const { login, signup } = useUser();
  
  const [signupForm, setSignupForm] = useState({
      username: '',
      bgmiUsername: '',
      bgmiId: '',
      mobile: '',
      email: '',
      password: ''
  });

  const handleSignupChange = (e: ChangeEvent<HTMLInputElement>) => {
      setSignupForm({
          ...signupForm,
          [e.target.id.replace('signup-', '')]: e.target.value
      });
  };

  const handleLogin = (e: React.FormEvent, isNewUser = false) => {
    e.preventDefault();
    sessionStorage.setItem('isNewUser', String(isNewUser));
    login(isNewUser);
    toast({
      title: 'Login Successful',
      description: 'Welcome back!',
    });
    router.push('/home');
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();

    const newUser: Omit<User, 'id' | 'walletBalance' | 'avatarUrl'> = {
        username: signupForm.username,
        email: signupForm.email,
        mobile: signupForm.mobile,
        bgmiUsername: signupForm.bgmiUsername,
        bgmiId: signupForm.bgmiId,
    };

    signup(newUser);

    toast({
      title: 'Sign Up Successful',
      description: 'Your account has been created. Please log in.',
    });
    
    setSignupForm({
        username: '',
        bgmiUsername: '',
        bgmiId: '',
        mobile: '',
        email: '',
        password: ''
    });
    setActiveTab('login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
            <Logo />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Login</CardTitle>
                <CardDescription>Enter your credentials to access your account.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => handleLogin(e, false)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="you@example.com" required defaultValue="player1@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" required defaultValue="password" />
                    <div className="flex items-center justify-end pt-1">
                       <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-primary underline">
                          Forgot Password?
                        </Link>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Login</Button>
                   <Button type="button" variant="outline" onClick={(e) => handleLogin(e as any, true)} className="w-full">Login as New User (Demo)</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Sign Up</CardTitle>
                <CardDescription>Create a new account to start competing.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="signup-username">Username</Label>
                        <Input id="signup-username" placeholder="PlayerOne" required onChange={handleSignupChange} value={signupForm.username} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signup-bgmiUsername">BGMI Username</Label>
                        <Input id="signup-bgmiUsername" placeholder="Your in-game name" onChange={handleSignupChange} value={signupForm.bgmiUsername} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signup-bgmiId">BGMI User ID</Label>
                        <Input id="signup-bgmiId" placeholder="Your numeric game ID" onChange={handleSignupChange} value={signupForm.bgmiId} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signup-mobile">Mobile Number</Label>
                        <Input id="signup-mobile" type="tel" placeholder="Your mobile number" required onChange={handleSignupChange} value={signupForm.mobile} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input id="signup-email" type="email" placeholder="you@example.com" required onChange={handleSignupChange} value={signupForm.email} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input id="signup-password" type="password" required onChange={handleSignupChange} value={signupForm.password}/>
                    </div>
                    <Button type="submit" className="w-full">Sign Up</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <UserProvider>
      <LoginFormComponent />
    </UserProvider>
  );
}
