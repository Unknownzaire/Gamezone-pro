
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
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { doc, getDoc } from "firebase/firestore";


export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const referralCodeFromUrl = searchParams.get('ref');
  const joinTeamName = searchParams.get('team');
  const action = searchParams.get('action');

  const initialTab = referralCodeFromUrl || (action === 'join' && joinTeamName) ? 'signup' : 'login';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const { login, signup, user, allUsers, joinTeam, gameList } = useUser();
  const { auth, firestore } = useFirebase();
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [signupForm, setSignupForm] = useState({
      username: '',
      primaryGame: 'BGMI',
      inGameUsername: '',
      inGameId: '',
      mobile: '',
      email: '',
      password: '',
      referralCode: referralCodeFromUrl || '',
  });

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
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
          primaryGame: value
      });
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn || !auth) {
        if (!auth) toast({ variant: 'destructive', title: 'Error', description: 'Authentication service not available.' });
        return;
    }
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
      const loggedIn = await login(loginForm.email);
      if (loggedIn === true) {
        // Successful login is handled by the redirect useEffect
      } else if (loggedIn === 'blocked') {
        await signOut(auth);
        toast({
          variant: 'destructive',
          title: 'Account Blocked',
          description: 'Your account has been blocked. Please contact support.',
        });
      } else {
        // User document might be missing
        await signOut(auth);
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'User record not found in our database.',
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
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSigningUp || !auth) {
        if (!auth) toast({ variant: 'destructive', title: 'Error', description: 'Authentication service not available.' });
        return;
    }

    setIsSigningUp(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signupForm.email, signupForm.password);
      
      const newUserDetails = {
          uid: userCredential.user.uid,
          username: signupForm.username,
          email: signupForm.email,
          mobile: signupForm.mobile,
          primaryGame: signupForm.primaryGame,
          inGameUsername: signupForm.inGameUsername,
          inGameId: signupForm.inGameId,
      };
      
      const result = await signup(newUserDetails, signupForm.password, true, false, signupForm.referralCode);

      if (result === 'success') {
        toast({
          title: 'Account Created',
          description: 'Your account has been successfully created.',
        });
      } else {
        await signOut(auth);
        toast({
          variant: 'destructive',
          title: 'Signup Error',
          description: 'Could not create your profile. Please try again.',
        });
      }
    } catch (error: any) {
      let description = 'An error occurred during sign up.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'This email address is already in use.';
      } else if (error.code === 'auth/weak-password') {
        description = 'The password is too weak.';
      }
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: description,
      });
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Services not ready.' });
        return;
    }

    // Prevent multiple simultaneous requests
    if (isLoggingIn || isSigningUp) return;

    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      console.log("Google Sign-In Success:", googleUser.uid);

      let existingUserDoc = null;
      try {
        const docRef = doc(firestore, 'users', googleUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          existingUserDoc = docSnap.data() as User;
        }
      } catch (firestoreError: any) {
        console.warn("Could not check Firestore profile during Google Sign-In:", firestoreError);
      }

      if (existingUserDoc) {
        if (existingUserDoc.isBlocked) {
          await signOut(auth);
          toast({ variant: 'destructive', title: 'Account Blocked' });
          return;
        }
        toast({ title: 'Welcome back!', description: `Logged in as ${existingUserDoc.username}` });
      } else {
        const newUserDetails = {
            uid: googleUser.uid,
            username: googleUser.displayName || `user${Math.floor(Math.random()*10000)}`,
            email: googleUser.email!,
            avatarUrl: googleUser.photoURL || "",
        };

        const appliedRefCode = signupForm.referralCode || referralCodeFromUrl || "";

        const signupResult = await signup(
          newUserDetails, 
          "", 
          true, 
          false, 
          appliedRefCode
        );

        if (signupResult === 'success') {
          toast({ title: 'Welcome!', description: 'Your account has been created via Google.' });
        }
      }
    } catch (error: any) {
      console.error("Google Sign-In Error Details:", error);
      // Don't show toast if user cancelled or another request was made
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
          toast({ variant: 'destructive', title: 'Google Sign-In Failed', description: error.message });
      }
    } finally {
      setIsLoggingIn(false);
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
                    <Input id="login-email" name="email" type="email" placeholder="you@example.com" required value={loginForm.email} onChange={handleLoginChange} disabled={isLoggingIn} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <Link 
                        href="/forgot-password" 
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input id="login-password" name="password" type={showLoginPassword ? "text" : "password"} required value={loginForm.password} onChange={handleLoginChange} disabled={isLoggingIn} />
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
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoggingIn || isSigningUp}>
                    {isLoggingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isLoggingIn ? 'Logging in...' : 'Login'}
                  </Button>
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
                    <Button variant="outline" className="w-full" type="button" onClick={handleGoogleSignIn} disabled={isLoggingIn || isSigningUp}>
                        {isLoggingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 64.5C308.6 106.5 280.2 96 248 96c-84.3 0-152.3 67.9-152.3 152s68 152 152.3 152c92.1 0 135.2-63.5 140.8-95.3H248v-65.3h239.2c.4 12.3.6 24.6.6 37.1z"></path></svg>
                        )}
                        {isLoggingIn ? 'Connecting...' : 'Sign in with Google'}
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
                                {gameList.map(game => (
                                    <SelectItem key={game} value={game}>{game}</SelectItem>
                                ))}
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
                    <Button type="submit" className="w-full" ref={signupButtonRef} disabled={isSigningUp || isLoggingIn}>
                      {isSigningUp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {isSigningUp ? 'Creating Account...' : 'Sign Up'}
                    </Button>
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
                    <Button variant="outline" className="w-full" type="button" onClick={handleGoogleSignIn} disabled={isSigningUp || isLoggingIn}>
                        {isLoggingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 64.5C308.6 106.5 280.2 96 248 96c-84.3 0-152.3 67.9-152.3 152s68 152 152.3 152c92.1 0 135.2-63.5 140.8-95.3H248v-65.3h239.2c.4 12.3.6 24.6.6 37.1z"></path></svg>
                        )}
                        {isLoggingIn ? 'Connecting...' : 'Sign in with Google'}
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
