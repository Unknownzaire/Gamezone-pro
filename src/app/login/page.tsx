

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
import { Eye, EyeOff } from "lucide-react";
import { useFirebase } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const referralCodeFromUrl = searchParams.get('ref');
  const initialTab = referralCodeFromUrl ? 'signup' : 'login';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const { login, signup, user, allUsers } = useUser();
  const { auth } = useFirebase();
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
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

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  
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
      const { name, value } = e.target;
      
      let processedValue = value;
      if (name === 'mobile') {
        processedValue = value.replace(/[^0-9]/g, '');
        if (processedValue.length > 10) return;
      }
       if (name === 'bgmiId') {
        processedValue = value.replace(/[^0-9]/g, '');
      }
      
      setSignupForm({
          ...signupForm,
          [name]: processedValue
      });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
      const loggedIn = login(loginForm.email, loginForm.password);
      if (loggedIn === true) {
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
      } else {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'Invalid email or password. Please try again.',
        });
      }
    } catch (error: any) {
      console.error("Firebase login error:", error);
      let description = 'An error occurred during login. Please try again later.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        description = 'Invalid email or password. Please try again.';
      }
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: description,
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (allUsers.some(u => u.email.toLowerCase() === signupForm.email.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Email Exists', description: 'An account with this email already exists.' });
        return;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signupForm.email, signupForm.password);
      
      const newUserDetails: Omit<User, 'id' | 'walletBalance' | 'avatarUrl' | 'isBlocked' | 'createdAt' | 'password' | 'referralBalance' | 'youtubeUrl' | 'instagramUrl' | 'discordUrl' | 'emailVerified' | 'mobileVerified'> = {
          username: signupForm.username,
          email: signupForm.email,
          mobile: signupForm.mobile,
          bgmiUsername: signupForm.bgmiUsername,
          bgmiId: signupForm.bgmiId,
          referralCode: signupForm.referralCode,
          googleId: userCredential.user.uid,
          otp: '',
      };
      
      const result = signup(newUserDetails, signupForm.password, true, false, signupForm.referralCode);

      if (result === 'success') {
        setActiveTab('login');
        setLoginForm(prev => ({ ...prev, email: signupForm.email, password: '' }));
        setSignupForm({
            username: '',
            bgmiUsername: '',
            bgmiId: '',
            mobile: '',
            email: '',
            password: '',
            referralCode: '',
        });
      }
    } catch (error: any) {
      console.error("Firebase signup error:", error);
      let description = 'An error occurred during sign up.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'This email address is already in use by another account.';
      } else if (error.code === 'auth/weak-password') {
        description = 'The password is too weak. It must be at least 6 characters long.';
      }
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: description,
      });
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      const existingUser = allUsers.find(u => u.email === googleUser.email);

      if (existingUser) {
        if (login(existingUser.email, existingUser.password!)) {
          router.push('/home');
        } else {
           toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: 'Could not log in with your Google account.',
          });
        }
      } else {
        // New user, pre-fill the form
        setSignupForm(prev => ({
          ...prev,
          username: googleUser.displayName || '',
          email: googleUser.email || '',
        }));
        setActiveTab('signup');
        toast({
          title: 'Welcome!',
          description: 'Please complete your registration details below.',
        });
      }
    } catch (error) {
      console.error("Google Sign-In Error: ", error);
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: 'Could not sign in with Google. Please try again.',
      });
    }
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
                    <div className="relative">
                      <Input id="login-password" name="password" type={showLoginPassword ? "text" : "password"} required value={loginForm.password} onChange={handleLoginChange} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                      >
                        {showLoginPassword ? <EyeOff /> : <Eye />}
                        <span className="sr-only">
                          {showLoginPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                    <div className="flex items-center justify-end pt-1">
                       <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-primary underline">
                          Forgot Password?
                        </Link>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Login</Button>
                   <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                          Or continue with
                          </span>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" type="button" onClick={handleGoogleSignIn}>
                        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 64.5C308.6 106.5 280.2 96 248 96c-84.3 0-152.3 67.9-152.3 152s68 152 152.3 152c92.1 0 135.2-63.5 140.8-95.3H248v-65.3h239.2c.4 12.3.6 24.6.6 37.1z"></path></svg>
                        Sign in with Google
                    </Button>
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
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="signup-bgmiUsername">BGMI Username</Label>
                            <Input id="signup-bgmiUsername" name="bgmiUsername" placeholder="In-game name" onChange={handleSignupChange} value={signupForm.bgmiUsername} ref={bgmiUsernameRef} onKeyDown={(e) => handleKeyDown(e, bgmiIdRef)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signup-bgmiId">BGMI User ID</Label>
                            <Input id="signup-bgmiId" name="bgmiId" placeholder="Your numeric game ID" onChange={handleSignupChange} value={signupForm.bgmiId} ref={bgmiIdRef} onKeyDown={(e) => handleKeyDown(e, mobileRef)} />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="signup-mobile">Mobile Number</Label>
                        <Input id="signup-mobile" name="mobile" type="tel" placeholder="Your 10-digit mobile number" required onChange={handleSignupChange} value={signupForm.mobile} ref={mobileRef} onKeyDown={(e) => handleKeyDown(e, emailRef)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input id="signup-email" name="email" type="email" placeholder="you@example.com" required onChange={handleSignupChange} value={signupForm.email} ref={emailRef} onKeyDown={(e) => handleKeyDown(e, passwordRef)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                         <div className="relative">
                            <Input id="signup-password" name="password" type={showSignupPassword ? "text" : "password"} required onChange={handleSignupChange} value={signupForm.password} ref={passwordRef} onKeyDown={(e) => handleKeyDown(e, referralCodeRef)} />
                             <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                                onClick={() => setShowSignupPassword(!showSignupPassword)}
                            >
                                {showSignupPassword ? <EyeOff /> : <Eye />}
                                <span className="sr-only">
                                {showSignupPassword ? "Hide password" : "Show password"}
                                </span>
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signup-referralCode">Referral Code (Optional)</Label>
                        <Input id="signup-referralCode" name="referralCode" placeholder="Enter referral code" onChange={handleSignupChange} value={signupForm.referralCode} ref={referralCodeRef} onKeyDown={(e) => handleKeyDown(e, undefined, true)} />
                    </div>
                    <Button type="submit" className="w-full" ref={signupButtonRef}>Sign Up</Button>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                          Or continue with
                          </span>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" type="button" onClick={handleGoogleSignIn}>
                        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 64.5C308.6 106.5 280.2 96 248 96c-84.3 0-152.3 67.9-152.3 152s68 152 152.3 152c92.1 0 135.2-63.5 140.8-95.3H248v-65.3h239.2c.4 12.3.6 24.6.6 37.1z"></path></svg>
                        Sign up with Google
                    </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
