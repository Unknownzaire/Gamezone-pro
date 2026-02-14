

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
import { Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";
import { useFirebase } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const referralCodeFromUrl = searchParams.get('ref');
  const joinTeamName = searchParams.get('team');
  const action = searchParams.get('action');

  const initialTab = referralCodeFromUrl || (action === 'join' && joinTeamName) ? 'signup' : 'login';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const { login, signup, user, allUsers, joinTeam } = useUser();
  const { auth } = useFirebase();
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [signupForm, setSignupForm] = useState({
      username: '',
      primaryGame: 'BGMI' as 'BGMI' | 'FREE FIRE' | 'COD' | 'OTHER',
      inGameUsername: '',
      inGameId: '',
      mobile: '',
      email: '',
      password: '',
      referralCode: referralCodeFromUrl || '',
  });

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  
  const usernameRef = useRef<HTMLInputElement>(null);
  const inGameUsernameRef = useRef<HTMLInputElement>(null);
  const inGameIdRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const referralCodeRef = useRef<HTMLInputElement>(null);
  const signupButtonRef = useRef<HTMLButtonElement>(null);
  

  useEffect(() => {
    if (user) {
      if (action === 'join' && joinTeamName) {
        joinTeam(joinTeamName);
        router.push('/profile');
      } else {
        router.push('/home');
      }
    }
  }, [user, router, action, joinTeamName, joinTeam]);
  
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
       if (name === 'inGameId') {
        processedValue = value.replace(/[^0-9]/g, '');
      }
      
      setSignupForm({
          ...signupForm,
          [name]: processedValue
      });
  };
  
  const handleSignupSelectChange = (value: string) => {
      setSignupForm({
          ...signupForm,
          primaryGame: value as any
      });
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
        toast({ variant: 'destructive', title: 'Error', description: 'Authentication service not available.' });
        return;
    }
    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
      const loggedIn = login(loginForm.email, loginForm.password);
      if (loggedIn === true) {
        // Successful login is handled by useEffect
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
      let description = 'An error occurred during login. Please try again later.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
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
    
    if (!auth) {
        toast({ variant: 'destructive', title: 'Error', description: 'Authentication service not available.' });
        return;
    }

    // Uniqueness checks
    if (signupForm.username && allUsers.some(u => u.username.toLowerCase() === signupForm.username.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Username Taken', description: 'This username is already in use.' });
        return;
    }
    if (signupForm.email && allUsers.some(u => u.email.toLowerCase() === signupForm.email.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Email Taken', description: 'This email address is already in use.' });
        return;
    }
     if (signupForm.inGameUsername && allUsers.some(u => u.inGameUsername?.toLowerCase() === signupForm.inGameUsername?.toLowerCase())) {
        toast({ variant: 'destructive', title: 'In-Game Username Taken', description: 'This in-game username is already in use.' });
        return;
    }
     if (signupForm.inGameId && allUsers.some(u => u.inGameId === signupForm.inGameId)) {
        toast({ variant: 'destructive', title: 'In-Game User ID Taken', description: 'This in-game User ID is already in use.' });
        return;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signupForm.email, signupForm.password);
      
      const newUserDetails: Omit<User, 'id' | 'walletBalance' | 'avatarUrl' | 'isBlocked' | 'createdAt' | 'password' | 'referralBalance' | 'youtubeUrl' | 'instagramUrl' | 'discordUrl' | 'emailVerified' | 'mobileVerified'> = {
          username: signupForm.username,
          email: signupForm.email,
          mobile: signupForm.mobile,
          primaryGame: signupForm.primaryGame,
          inGameUsername: signupForm.inGameUsername,
          inGameId: signupForm.inGameId,
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
            primaryGame: 'BGMI',
            inGameUsername: '',
            inGameId: '',
            mobile: '',
            email: '',
            password: '',
            referralCode: '',
        });
      }
    } catch (error: any) {
      let description = 'An error occurred during sign up.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'This email address is already in use by another account.';
      } else if (error.code === 'auth/weak-password') {
        description = 'The password is too weak. It must be at least 6 characters long.';
      } else if (error.code === 'auth/invalid-email') {
        description = 'The email address is invalid.';
      }
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: description,
      });
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) {
        toast({ variant: 'destructive', title: 'Error', description: 'Authentication service not available.' });
        return;
    }
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      const existingUser = allUsers.find(u => u.email === googleUser.email);

      if (existingUser) {
        if (login(existingUser.email, existingUser.password!)) {
          // Successful login handled by useEffect
        } else {
           toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: 'Could not log in with your Google account.',
          });
        }
      } else {
        // New user: auto-signup and login
        const randomPassword = Math.random().toString(36).slice(-8);
        const newUserDetails: Omit<User, 'id' | 'walletBalance' | 'avatarUrl' | 'isBlocked' | 'createdAt' | 'password' | 'referralBalance' | 'youtubeUrl' | 'instagramUrl' | 'discordUrl' | 'emailVerified' | 'mobileVerified'> = {
            username: googleUser.displayName || `user${Math.floor(Math.random()*10000)}`,
            email: googleUser.email!,
            googleId: googleUser.uid,
            otp: '',
        };

        const signupResult = signup(newUserDetails, randomPassword, true, false);

        if (signupResult === 'success') {
          const loginResult = login(googleUser.email!, randomPassword);
          if (loginResult === true) {
             toast({
              title: 'Welcome!',
              description: 'Your account has been created.',
            });
            // Successful login handled by useEffect
          }
        } else {
            toast({
                variant: 'destructive',
                title: 'Sign Up Failed',
                description: 'Could not create your account. Please try again.',
            });
        }
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
                        <Input id="signup-username" name="username" placeholder="PlayerOne" required onChange={handleSignupChange} value={signupForm.username} ref={usernameRef} onKeyDown={(e) => handleKeyDown(e, inGameUsernameRef)} />
                    </div>
                     <Alert variant="destructive" className="bg-primary/10 border-primary/50 text-primary-foreground p-3">
                      <AlertTriangle className="h-4 w-4 !text-primary" />
                      <AlertDescription className="text-primary text-xs ml-6">
                        PLEASE FILL CORRECT IN-GAME DETAILS. IT CANNOT BE CHANGED LATER.
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                        <Label htmlFor="signup-primaryGame">Primary Game</Label>
                        <Select name="primaryGame" onValueChange={handleSignupSelectChange} value={signupForm.primaryGame}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select your primary game" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BGMI">BGMI</SelectItem>
                                <SelectItem value="FREE FIRE">FREE FIRE</SelectItem>
                                <SelectItem value="COD">COD</SelectItem>
                                <SelectItem value="OTHER">OTHER</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="signup-inGameUsername">{signupForm.primaryGame} Username</Label>
                            <Input id="signup-inGameUsername" name="inGameUsername" placeholder="In-game name" onChange={handleSignupChange} value={signupForm.inGameUsername} ref={inGameUsernameRef} onKeyDown={(e) => handleKeyDown(e, inGameIdRef)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signup-inGameId">{signupForm.primaryGame} User ID</Label>
                            <Input id="signup-inGameId" name="inGameId" placeholder="Your numeric game ID" onChange={handleSignupChange} value={signupForm.inGameId} ref={inGameIdRef} onKeyDown={(e) => handleKeyDown(e, mobileRef)} />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="signup-mobile">Mobile Number</Label>
                        <Input id="signup-mobile" name="mobile" type="tel" placeholder="Your 10-digit mobile number" required onChange={handleSignupChange} value={signupForm.mobile} ref={mobileRef} onKeyDown={(e) => handleKeyDown(e, emailRef)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input id="signup-email" name="email" type="email" placeholder="example@gmail.com" required onChange={handleSignupChange} value={signupForm.email} ref={emailRef} onKeyDown={(e) => handleKeyDown(e, passwordRef)} />
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
