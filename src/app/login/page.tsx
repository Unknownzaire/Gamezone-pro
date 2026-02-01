

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
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { Alert, AlertDescription } from "@/components/ui/alert";


declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
        confirmationResult?: ConfirmationResult;
    }
}


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
  
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');


  useEffect(() => {
    if (user) {
      router.push('/home');
    }
  }, [user, router]);
  
  const setupRecaptcha = () => {
    if (!auth) return;
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
    }
  };

  const handleSendOtp = async () => {
    if (!auth) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication service not available.' });
      return;
    }

    if (!phoneNumber || phoneNumber.length < 10) {
        toast({ variant: 'destructive', title: "Invalid Phone Number", description: "Please enter a valid 10-digit phone number." });
        return;
    }
    
    setupRecaptcha();
    const appVerifier = window.recaptchaVerifier!;
    const fullPhoneNumber = `+91${phoneNumber}`;
    setIsSendingOtp(true);

    try {
        const confirmationResult = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
        window.confirmationResult = confirmationResult;
        setOtpSent(true);
        toast({ title: "OTP Sent", description: `An OTP has been sent to ${fullPhoneNumber}.` });
    } catch (error: any) {
        console.error("Error sending OTP:", error);
        let description = "Failed to send OTP. Please try again.";
        if(error.code === 'auth/too-many-requests') {
            description = "Too many requests. Please try again later.";
        } else if (error.code === 'auth/invalid-phone-number') {
            description = "The phone number you entered is not valid.";
        } else if (error.code === 'auth/billing-not-enabled') {
          description = "Phone sign-in is not enabled for this project. Please contact support.";
          toast({
              variant: 'destructive',
              title: "Feature Not Available",
              description,
              duration: 10000,
          });
          return;
      }
        toast({
            variant: 'destructive',
            title: 'OTP Send Error',
            description: description,
        });
        // Reset reCAPTCHA
        window.recaptchaVerifier?.render().then((widgetId) => {
            if (typeof grecaptcha !== 'undefined' && grecaptcha.reset) {
                grecaptcha.reset(widgetId);
            }
        });
    } finally {
        setIsSendingOtp(false);
    }
};

 const handleVerifyOtp = async () => {
    if (!window.confirmationResult) {
      toast({ variant: 'destructive', title: "Verification Error", description: "Please request an OTP first." });
      return;
    }
    
    if (!otp || otp.length !== 6) {
        toast({ variant: 'destructive', title: "Invalid OTP", description: "Please enter the 6-digit OTP." });
        return;
    }

    setIsVerifyingOtp(true);
    try {
      const result = await window.confirmationResult.confirm(otp);
      const firebaseUser = result.user;
      
      const existingUser = allUsers.find(u => u.mobile === phoneNumber);

      if (existingUser) {
        const loginResult = login(existingUser.email, existingUser.password);
        if (loginResult === true) {
          router.push('/home');
        } else if (loginResult === 'blocked') {
            toast({ variant: 'destructive', title: 'Account Blocked', description: 'This account has been suspended.' });
        } else {
            toast({ variant: 'destructive', title: 'Login Failed', description: 'Could not log you in. Please contact support.' });
        }
      } else {
        // New user signup via phone
        const newUserDetails = {
            username: `user${phoneNumber.slice(-4)}`,
            email: `${firebaseUser.uid}@phone.gamezonepro.com`, // Placeholder email
            mobile: phoneNumber,
        };
        const signupResult = signup(newUserDetails, undefined, false, true);

        if (signupResult === 'success') {
          // Find the newly created user to log them in
          const newUser = allUsers.find(u => u.mobile === phoneNumber);
          if (newUser && login(newUser.email, newUser.password)) {
             toast({ title: 'Welcome!', description: 'Your account has been created.' });
             router.push('/home');
          }
        }
      }
    } catch (error: any) {
        console.error("OTP verification error", error);
        let description = "An unexpected error occurred during verification.";
        if (error.code === 'auth/invalid-verification-code') {
            description = "The OTP you entered is incorrect. Please try again.";
        }
        toast({ variant: 'destructive', title: "OTP Verification Failed", description });
    } finally {
        setIsVerifyingOtp(false);
    }
  };

  
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
    if (!auth) {
        toast({ variant: 'destructive', title: 'Error', description: 'Authentication service not available.' });
        return;
    }
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
    
    if (!auth) {
        toast({ variant: 'destructive', title: 'Error', description: 'Authentication service not available.' });
        return;
    }
    
    // Uniqueness checks
    if (signupForm.username && allUsers.some(u => u.username.toLowerCase() === signupForm.username.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Username Taken', description: 'This username is already in use.' });
        return;
    }
     if (signupForm.bgmiUsername && allUsers.some(u => u.bgmiUsername?.toLowerCase() === signupForm.bgmiUsername?.toLowerCase())) {
        toast({ variant: 'destructive', title: 'BGMI Username Taken', description: 'This BGMI username is already in use.' });
        return;
    }
     if (signupForm.bgmiId && allUsers.some(u => u.bgmiId === signupForm.bgmiId)) {
        toast({ variant: 'destructive', title: 'BGMI User ID Taken', description: 'This BGMI User ID is already in use.' });
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
          router.push('/home');
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
            router.push('/home');
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
      <div id="recaptcha-container"></div>
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
            <Logo />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
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
                     <Alert variant="destructive" className="bg-primary/10 border-primary/50 text-primary-foreground p-3">
                      <AlertTriangle className="h-4 w-4 !text-primary" />
                      <AlertDescription className="text-primary text-xs ml-6">
                        PLEASE FILL CORRECT BGMI USERNAME AND BGMI USER ID. IT CANNOT BE CHANGED LATER.
                      </AlertDescription>
                    </Alert>
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
          <TabsContent value="phone">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Continue with Phone</CardTitle>
                    <CardDescription>Enter your phone number to receive an OTP.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!otpSent ? (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="phone-number">Phone Number</Label>
                                <div className="flex items-center">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-background text-sm text-muted-foreground">+91</span>
                                    <Input
                                        id="phone-number"
                                        type="tel"
                                        placeholder="Your 10-digit number"
                                        value={phoneNumber}
                                        onChange={(e) => {
                                            const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                            if (numericValue.length <= 10) {
                                                setPhoneNumber(numericValue);
                                            }
                                        }}
                                        disabled={isSendingOtp}
                                        className="rounded-l-none"
                                    />
                                </div>
                            </div>
                            <Button onClick={handleSendOtp} disabled={isSendingOtp || !phoneNumber} className="w-full">
                                {isSendingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send OTP
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="otp">Enter OTP</Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    maxLength={6}
                                    placeholder="Enter the 6-digit code"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    disabled={isVerifyingOtp}
                                />
                            </div>
                             <Button onClick={handleVerifyOtp} disabled={isVerifyingOtp || !otp} className="w-full">
                                {isVerifyingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Verify OTP & Continue
                            </Button>
                            <Button variant="link" size="sm" onClick={() => setOtpSent(false)} className="text-muted-foreground">
                                Use a different number
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
           </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
