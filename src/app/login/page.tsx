

'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import Link from "next/link";
import { useState, ChangeEvent, useRef, useEffect, KeyboardEvent } from "react";
import { useUser } from "@/hooks/use-user.tsx";
import { User } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const referralCodeFromUrl = searchParams.get('ref');
  const initialTab = referralCodeFromUrl ? 'signup' : 'login';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const { login, signup, user } = useUser();
  
  const [loginForm, setLoginForm] = useState({
    email: 'player1@example.com',
    password: 'password'
  });

  const [signupForm, setSignupForm] = useState({
      username: '',
      bgmiUsername: '',
      bgmiId: '',
      mobile: '',
      email: '',
      password: '',
      referralCode: referralCodeFromUrl || '',
  });

  const usernameRef = useRef<HTMLInputElement>(null);
  const bgmiUsernameRef = useRef<HTMLInputElement>(null);
  const bgmiIdRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const referralCodeRef = useRef<HTMLInputElement>(null);
  const signupButtonRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    if (user) {
      router.push('/home');
    }
  }, [user, router]);


  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, nextFieldRef?: React.RefObject<HTMLInputElement>, isLastField = false) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isLastField) {
        signupButtonRef.current?.click();
      } else if (nextFieldRef?.current) {
        nextFieldRef.current.focus();
      }
    }
  };

  const handleLoginChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLoginForm({
        ...loginForm,
        [e.target.name]: e.target.value
    });
  };

  const handleSignupChange = (e: ChangeEvent<HTMLInputElement>) => {
      setSignupForm({
          ...signupForm,
          [e.target.name]: e.target.value
      });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const loggedIn = login(loginForm.email, loginForm.password);
    if(loggedIn === true) {
        toast({
            title: 'Login Successful',
            description: 'Welcome back!',
        });
        router.push('/home');
    } else if (loggedIn === 'blocked') {
        toast({
            variant: 'destructive',
            title: 'Account Blocked',
            description: 'Your account has been blocked. Please contact support.',
        });
    }
    else {
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: 'Invalid email or password. Please try again.',
        });
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();

    const newUser: Omit<User, 'id' | 'walletBalance' | 'avatarUrl' | 'isBlocked' | 'createdAt'| 'password'> = {
        username: signupForm.username,
        email: signupForm.email,
        mobile: signupForm.mobile,
        bgmiUsername: signupForm.bgmiUsername,
        bgmiId: signupForm.bgmiId,
        referralCode: signupForm.referralCode,
    };
    
    signup(newUser, signupForm.password, signupForm.referralCode);
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
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" name="email" type="email" placeholder="you@example.com" required value={loginForm.email} onChange={handleLoginChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" name="password" type="password" required value={loginForm.password} onChange={handleLoginChange} />
                    <div className="flex items-center justify-end pt-1">
                       <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-primary underline">
                          Forgot Password?
                        </Link>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Login</Button>
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
                        <Input id="signup-username" name="username" placeholder="PlayerOne" required onChange={handleSignupChange} value={signupForm.username} ref={usernameRef} onKeyDown={(e) => handleKeyDown(e, bgmiUsernameRef)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signup-bgmiUsername">BGMI Username</Label>
                        <Input id="signup-bgmiUsername" name="bgmiUsername" placeholder="Your in-game name" onChange={handleSignupChange} value={signupForm.bgmiUsername} ref={bgmiUsernameRef} onKeyDown={(e) => handleKeyDown(e, bgmiIdRef)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signup-bgmiId">BGMI User ID</Label>
                        <Input id="signup-bgmiId" name="bgmiId" placeholder="Your numeric game ID" onChange={handleSignupChange} value={signupForm.bgmiId} ref={bgmiIdRef} onKeyDown={(e) => handleKeyDown(e, mobileRef)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signup-mobile">Mobile Number</Label>
                        <Input id="signup-mobile" name="mobile" type="tel" placeholder="Your mobile number" required onChange={handleSignupChange} value={signupForm.mobile} ref={mobileRef} onKeyDown={(e) => handleKeyDown(e, emailRef)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input id="signup-email" name="email" type="email" placeholder="you@example.com" required onChange={handleSignupChange} value={signupForm.email} ref={emailRef} onKeyDown={(e) => handleKeyDown(e, passwordRef)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input id="signup-password" name="password" type="password" required onChange={handleSignupChange} value={signupForm.password} ref={passwordRef} onKeyDown={(e) => handleKeyDown(e, referralCodeRef)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signup-referralCode">Referral Code (Optional)</Label>
                        <Input id="signup-referralCode" name="referralCode" placeholder="Enter referral code" onChange={handleSignupChange} value={signupForm.referralCode} ref={referralCodeRef} onKeyDown={(e) => handleKeyDown(e, undefined, true)} />
                    </div>
                    <Button type="submit" className="w-full" ref={signupButtonRef}>Sign Up</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
