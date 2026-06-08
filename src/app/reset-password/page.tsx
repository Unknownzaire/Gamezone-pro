
'use client';

import { useState, useEffect, Suspense, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";
import Link from "next/link";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { useFirebase } from '@/firebase';
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";

function ResetPasswordComponent({ searchParams }: { searchParams: Promise<{ oobCode?: string }> }) {
  const { oobCode: codeFromParams } = use(searchParams);
  const { auth } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [oobCode, setOobCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isValidCode, setIsValidCode] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (!codeFromParams) {
      toast({
        variant: 'destructive',
        title: 'Invalid Link',
        description: 'The password reset link is missing necessary information.',
      });
      router.push('/login');
      return;
    }
    setOobCode(codeFromParams);

    if (auth) {
      verifyPasswordResetCode(auth, codeFromParams)
        .then(() => {
          setIsValidCode(true);
        })
        .catch((error) => {
          console.error("Invalid oobCode:", error);
          toast({
            variant: 'destructive',
            title: 'Invalid or Expired Link',
            description: 'This password reset link is either invalid or has expired. Please request a new one.',
          });
          router.push('/forgot-password');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [codeFromParams, auth, router, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode || !auth) return;

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords Do Not Match',
        description: 'Please ensure both passwords are the same.',
      });
      return;
    }

    if (newPassword.length < 6) {
        toast({
            variant: 'destructive',
            title: 'Password Too Weak',
            description: 'Your password must be at least 6 characters long.',
        });
        return;
    }

    setIsResetting(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      toast({
        title: 'Password Reset Successful',
        description: 'You can now log in with your new password.',
      });
      router.push('/login');
    } catch (error: any) {
      console.error("Password reset confirmation error:", error);
      toast({
        variant: 'destructive',
        title: 'Error Resetting Password',
        description: 'An error occurred. The link may have expired. Please try again.',
      });
      setIsResetting(false);
    }
  };

  if (isLoading || !isValidCode) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Verify Reset Link</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Verifying your link...</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle className="font-headline">Reset Your Password</CardTitle>
            <CardDescription>Enter a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                        <Input
                            id="new-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your new password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={isResetting}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff /> : <Eye />}
                        </Button>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                        id="confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm your new password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isResetting}
                    />
                </div>
                <Button type="submit" className="w-full" disabled={isResetting}>
                    {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isResetting ? 'Resetting...' : 'Set New Password'}
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
  );
}

export default function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ oobCode?: string }> }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="flex justify-center">
                    <Logo />
                </div>
                <Suspense fallback={<div>Loading...</div>}>
                    <ResetPasswordComponent searchParams={searchParams} />
                </Suspense>
            </div>
        </div>
    );
}
