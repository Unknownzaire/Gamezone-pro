'use client';
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { mockUsers } from "@/lib/mock-data";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const currentUser = mockUsers[0];

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState('');

  const handleUpdateProfile = () => {
    toast({ title: "Profile Updated", description: "Your profile information has been saved." });
  };

  const handleChangePassword = () => {
    toast({ title: "Password Changed", description: "Your password has been successfully updated." });
  };

  const handleLogout = () => {
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/login');
  };

  const handleSendOtp = () => {
    setOtpSent(true);
    toast({ title: "OTP Sent", description: "An OTP has been sent to your email address." });
  };
  
  const handleVerifyOtp = () => {
    if (otp) { // In a real app, you'd verify the OTP value
        setOtpVerified(true);
        toast({ title: "Email Verified", description: "Your email has been successfully verified." });
    } else {
        toast({ variant: "destructive", title: "Invalid OTP", description: "Please enter the OTP." });
    }
  };


  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold">My Profile</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.username} />
              <AvatarFallback>{currentUser.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="font-headline text-2xl font-bold">{currentUser.username}</p>
              <p className="text-muted-foreground">{currentUser.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
            <h2 className="font-headline text-xl font-semibold">Edit Profile</h2>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue={currentUser.username} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Input id="email" type="email" defaultValue={currentUser.email} disabled={otpSent} />
                {!otpVerified && (
                  <Button onClick={handleSendOtp} disabled={otpSent} className="w-40">
                    {otpSent ? 'OTP Sent' : 'Send OTP'}
                  </Button>
                )}
                 {otpVerified && (
                  <div className="flex items-center gap-2 text-green-500 font-medium">
                    <CheckCircle className="h-5 w-5" />
                    <span>Verified</span>
                  </div>
                )}
              </div>
            </div>

            {otpSent && !otpVerified && (
              <div className="space-y-2 animate-in fade-in">
                <Label htmlFor="otp">Enter OTP</Label>
                <div className="flex items-center gap-2">
                  <Input id="otp" type="text" placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} />
                  <Button onClick={handleVerifyOtp} className="w-40">Verify OTP</Button>
                </div>
              </div>
            )}

            <Button onClick={handleUpdateProfile} className="w-full">Update Profile</Button>
        </CardContent>
      </Card>

       <Card>
        <CardContent className="pt-6 space-y-4">
             <h2 className="font-headline text-xl font-semibold">Change Password</h2>
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
            <Button onClick={handleChangePassword} className="w-full">Change Password</Button>
        </CardContent>
      </Card>
      
      <div className="pt-4">
        <Button variant="destructive" className="w-full" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </div>
  );
}
