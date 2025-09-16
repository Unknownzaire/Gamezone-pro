
'use client';
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { CheckCircle, Edit2 } from 'lucide-react';
import { useUser } from '@/hooks/use-user.tsx';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser, setUser, updateUser } = useUser();

  const [username, setUsername] = useState('');
  const [bgmiUsername, setBgmiUsername] = useState('');
  const [bgmiId, setBgmiId] = useState('');
  const [mobile, setMobile] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [emailOtp, setEmailOtp] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [emailOtpInput, setEmailOtpInput] = useState('');
  const [mobileOtpInput, setMobileOtpInput] = useState('');

  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [mobileCountdown, setMobileCountdown] = useState(0);

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || '');
      setBgmiUsername(currentUser.bgmiUsername || '');
      setBgmiId(currentUser.bgmiId || '');
      setMobile(currentUser.mobile || '');
    }
  }, [currentUser]);
  
  useEffect(() => {
    let emailTimer: NodeJS.Timeout;
    if (emailCountdown > 0) {
      emailTimer = setTimeout(() => setEmailCountdown(emailCountdown - 1), 1000);
    }
    return () => clearTimeout(emailTimer);
  }, [emailCountdown]);

  useEffect(() => {
    let mobileTimer: NodeJS.Timeout;
    if (mobileCountdown > 0) {
      mobileTimer = setTimeout(() => setMobileCountdown(mobileCountdown - 1), 1000);
    }
    return () => clearTimeout(mobileTimer);
  }, [mobileCountdown]);

  const handleUpdateProfile = () => {
    if (!isEditing) {
        setIsEditing(true);
        return;
    }
    if (currentUser) {
      const updatedFields = {
        username,
        mobile
      };
      updateUser(updatedFields);
      toast({ title: "Profile Updated", description: "Your profile information has been saved." });
      setIsEditing(false);
    }
  };

  const handleAvatarUpdate = () => {
    if (currentUser && avatarFile) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const avatarUrl = event.target?.result as string;
            updateUser({ avatarUrl });
            toast({ title: "Avatar Updated", description: "Your profile picture has been changed." });
        };
        reader.readAsDataURL(avatarFile);
    } else {
        toast({ variant: 'destructive', title: "No file selected", description: "Please select an image file to update your avatar."});
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setAvatarFile(e.target.files[0]);
    }
  };

  const handleChangePassword = () => {
    toast({ title: "Password Changed", description: "Your password has been successfully updated." });
  };

  const handleLogout = () => {
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/login');
  };
  
  const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleSendEmailOtp = () => {
    if(!currentUser) return;
    const newOtp = generateOtp();
    setEmailOtp(newOtp);
    setEmailOtpSent(true);
    setEmailCountdown(30);
    toast({ title: "OTP Sent", description: `An OTP has been sent to ${currentUser.email}. (OTP: ${newOtp})`});
  };

  const handleVerifyEmailOtp = () => {
    if(emailOtpInput === emailOtp) {
      setEmailVerified(true);
      setEmailOtpSent(false);
      toast({ title: "Email Verified", description: "Your email address has been successfully verified." });
    } else {
      toast({ variant: 'destructive', title: "Invalid OTP", description: "The OTP you entered is incorrect." });
    }
  };
  
  const handleSendMobileOtp = () => {
    const newOtp = generateOtp();
    setMobileOtp(newOtp);
    setMobileOtpSent(true);
    setMobileCountdown(30);
    toast({ title: "OTP Sent", description: `An OTP has been sent to your mobile number. (OTP: ${newOtp})`});
  };

  const handleVerifyMobileOtp = () => {
     if(mobileOtpInput === mobileOtp) {
      setMobileVerified(true);
      setMobileOtpSent(false);
      toast({ title: "Mobile Verified", description: "Your mobile number has been successfully verified." });
    } else {
      toast({ variant: 'destructive', title: "Invalid OTP", description: "The OTP you entered is incorrect." });
    }
  };

  if (!currentUser) {
    return (
      <div className="space-y-6">
        <h1 className="font-headline text-3xl font-bold">My Profile</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="text-center space-y-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-5 w-48" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold">My Profile</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
             <Dialog>
              <DialogTrigger asChild>
                <div className="relative group cursor-pointer">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={currentUser.avatarUrl} alt={currentUser.username} />
                    <AvatarFallback>{currentUser.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit2 className="text-white h-8 w-8" />
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Profile Picture</DialogTitle>
                  <DialogDescription>Upload an image file to update your avatar.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="avatarFile">Image</Label>
                  <Input id="avatarFile" type="file" accept="image/*" onChange={handleAvatarFileChange} />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button onClick={handleAvatarUpdate}>Save</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} disabled={!isEditing} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bgmiUsername">BGMI Username</Label>
              <Input id="bgmiUsername" value={bgmiUsername} onChange={(e) => setBgmiUsername(e.target.value)} placeholder="Your in-game name" disabled />
            </div>
             <div className="space-y-2">
              <Label htmlFor="bgmiId">BGMI User ID</Label>
              <Input id="bgmiId" value={bgmiId} onChange={(e) => setBgmiId(e.target.value)} placeholder="Your numeric game ID" disabled />
            </div>
             <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                    <Input id="email" type="email" defaultValue={currentUser.email} disabled />
                    {!emailVerified && (
                        <Button onClick={handleSendEmailOtp} className="w-48" disabled={emailCountdown > 0}>
                            {emailCountdown > 0 ? `Resend in ${emailCountdown}s` : emailOtpSent ? 'Resend OTP' : 'Send OTP'}
                        </Button>
                    )}
                    {emailVerified && <CheckCircle className="text-green-500" />}
                </div>
                {emailOtpSent && !emailVerified && (
                    <div className="flex items-center gap-2 pt-2">
                        <Input placeholder="Enter OTP" value={emailOtpInput} onChange={(e) => setEmailOtpInput(e.target.value)} />
                        <Button onClick={handleVerifyEmailOtp} className="w-40">Verify</Button>
                    </div>
                )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
               <div className="flex items-center gap-2">
                    <Input id="mobile" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} disabled={!isEditing} />
                     {!mobileVerified && (
                        <Button onClick={handleSendMobileOtp} className="w-48" disabled={mobileCountdown > 0 || isEditing}>
                           {mobileCountdown > 0 ? `Resend in ${mobileCountdown}s` : mobileOtpSent ? 'Resend OTP' : 'Send OTP'}
                        </Button>
                    )}
                    {mobileVerified && <CheckCircle className="text-green-500" />}
                </div>
                 {mobileOtpSent && !mobileVerified && (
                    <div className="flex items-center gap-2 pt-2">
                        <Input placeholder="Enter OTP" value={mobileOtpInput} onChange={(e) => setMobileOtpInput(e.target.value)} />
                        <Button onClick={handleVerifyMobileOtp} className="w-40">Verify</Button>
                    </div>
                )}
            </div>
            <Button onClick={handleUpdateProfile} className="w-full">
              {isEditing ? 'Save Profile' : 'Edit Profile'}
            </Button>
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

    

    
