
'use client';
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { CheckCircle, Edit2, Mail, Phone, MessageSquare, Bot, Ticket, Link as LinkIcon } from 'lucide-react';
import { useUser } from '@/hooks/use-user.tsx';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import Image from 'next/image';
import type { User, SocialLink } from '@/lib/types';
import Link from 'next/link';
import type { HelpAndSupportSettings } from '@/app/admin/settings/page';


const SocialIcon = ({ name, icon, url }: { name: string; icon: SocialLink['icon']; url:string }) => {
    const iconProps = { className: "h-6 w-6" };
    let socialIcon;
    switch (icon) {
        case 'youtube':
            socialIcon = (
                <svg {...iconProps} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
            );
            break;
        case 'instagram':
             socialIcon = (
                <svg {...iconProps} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.07-1.645-.07-4.85s.012-3.584.07-4.85c.149-3.225 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.85-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.059-1.281.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.281-.059-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44 1.441-.645 1.441-1.44-.645-1.44-1.441-1.44z"/></svg>
             );
            break;
        case 'discord':
            socialIcon = (
                <svg {...iconProps} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.3698c-0.82496-0.34498-1.6999-0.61497-2.6099-0.80997-0.0800003-0.03-0.17-0.01-0.24 0.04-0.12 0.08-0.16 0.23-0.1 0.37 0.14 0.32 0.27 0.65 0.38 0.99 0.49-0.16 0.98-0.29 1.48-0.39 0.22-0.04 0.44 0.11 0.5 0.32 0.04 0.22-0.11 0.44-0.32 0.5-0.58 0.12-1.16 0.26-1.72 0.44-0.1 0.03-0.18 0.09-0.24 0.16-0.32 0.42-0.61 0.86-0.86 1.33-1.48-0.26-2.98-0.26-4.46 0-0.25-0.47-0.54-0.91-0.86-1.33-0.06-0.08-0.14-0.13-0.24-0.16-0.56-0.18-1.14-0.32-1.72-0.44-0.21-0.06-0.43-0.28-0.32-0.5 0.06-0.21 0.28-0.36 0.5-0.32 0.5 0.1 0.99 0.23 1.48 0.39 0.11-0.34 0.24-0.67 0.38-0.99 0.06-0.14 0.02-0.29-0.1-0.37-0.07-0.05-0.16-0.07-0.24-0.04-0.90996 0.195-1.7849 0.465-2.6099 0.80997-0.22 0.09-0.34 0.32-0.3 0.55 0.02 0.1 0.06 0.19 0.12 0.27 1.44 2.16 2.33 4.69 2.62 7.37-0.02 0.01-0.03 0.02-0.05 0.03-0.58 0.19-1.14 0.43-1.68 0.71-0.21 0.11-0.28 0.37-0.17 0.58 0.09 0.17 0.28 0.26 0.46 0.23 0.6-0.13 1.18-0.3 1.74-0.51 0.14-0.05 0.28-0.12 0.41-0.21 0.16 0.18 0.32 0.36 0.49 0.53 0.31 0.31 0.64 0.59 1 0.83 0.21 0.14 0.48 0.14 0.69 0 0.36-0.24 0.69-0.52 1-0.83 0.17-0.17 0.33-0.35 0.49-0.53 0.13 0.09 0.27 0.16 0.41 0.21 0.56 0.21 1.14 0.38 1.74 0.51 0.18 0.03 0.37-0.06 0.46-0.23 0.11-0.21 0.04-0.47-0.17-0.58-0.54-0.28-1.1-0.52-1.68-0.71-0.02-0.01-0.03-0.02-0.05-0.03 0.29-2.68 1.18-5.21 2.62-7.37 0.06-0.08 0.1-0.17 0.12-0.27 0.04-0.23-0.08-0.46-0.3-0.55zm-8.23 10.13c-0.74 0-1.34-0.6-1.34-1.34s0.6-1.34 1.34-1.34 1.34 0.6 1.34 1.34-0.6 1.34-1.34 1.34zm4.02 0c-0.74 0-1.34-0.6-1.34-1.34s0.6-1.34 1.34-1.34 1.34 0.6 1.34 1.34-0.6 1.34-1.34 1.34z"/></svg>
            );
            break;
        case 'telegram':
             socialIcon = (
                <svg {...iconProps} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11.944 0a12 12 0 0 0-12 12 12 12 0 0 0 12 12 12 12 0 0 0 12-12 12 12 0 0 0-12-12zm4.562 17.125-2.859-3.094-1.7-1.656-3.844 3.656-1.2-5.438 11.25-10.125-3.656 11.657z"/></svg>
             );
            break;
        case 'whatsapp':
            socialIcon = (
                <svg {...iconProps} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413.003 6.556-5.338 11.892-11.893 11.892-1.996 0-3.937-.53-5.663-1.485l-6.262 1.673zm6.75-4.469c.162.273.333.538.512.791.178.253.365.498.56.734 1.74 1.096 3.738 1.743 5.86 1.745 5.454.001 9.901-4.446 9.902-9.901.001-5.454-4.446-9.9-9.902-9.9-5.454 0-9.9 4.446-9.901 9.9.001 2.021.59 3.944 1.664 5.66l-1.3 4.745 4.843-1.291zm8.328-4.443c-.14-.07-.82-.4-1.008-.447-.188-.047-.324-.07-.46.07-.136.14-.51.647-.625.775-.115.128-.23.14-.408.07-.178-.07-.756-.28-1.44-.895-.533-.476-.895-1.062-1.042-1.238-.147-.175-.018-.268.06-.363.07-.085.16-.21.24-.308.08-.1.108-.175.16-.298.05-.123.02-.23-.02-.308-.04-.08-.46-.94-.63-1.29-.17-.35-.34-.3-.46-.3-.12-.005-.26-.005-.4-.005-.14 0-.37.02-.57.22-.2.2-.77.75-.77 1.82 0 1.06.79 2.06.9 2.23.11.17 1.52 2.33 3.69 3.25.52.23 1.02.36 1.32.46.46.15.87.13.19.08.35-.05 1.07-.43 1.22-.86.15-.43.15-.79.1-.86-.05-.07-.16-.12-.34-.21z"/></svg>
            );
            break;
        default:
            socialIcon = <LinkIcon className="h-6 w-6 text-muted-foreground" />;
    }
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-center group text-muted-foreground hover:text-foreground">
            <div className="rounded-full p-3 transition-colors">
              {socialIcon}
            </div>
            <span className="text-xs group-hover:text-foreground transition-colors">{name}</span>
        </a>
    );
};

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser, updateUser, logout } = useUser();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bgmiUsername, setBgmiUsername] = useState('');
  const [bgmiId, setBgmiId] = useState('');
  const [mobile, setMobile] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

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

   const [helpAndSupportSettings, setHelpAndSupportSettings] = useState<HelpAndSupportSettings>({
        helplineNumber: '+911234567890',
        supportEmail: 'support@gamezonepro.com',
    });
    const [socialMediaLinks, setSocialMediaLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || '');
      setEmail(currentUser.email || '');
      setBgmiUsername(currentUser.bgmiUsername || '');
      setBgmiId(currentUser.bgmiId || '');
      setMobile(currentUser.mobile || '');
    }
     const storedHelpSettings = localStorage.getItem('helpAndSupportSettings');
    if (storedHelpSettings) {
        setHelpAndSupportSettings(JSON.parse(storedHelpSettings));
    }
    const storedSocialLinks = localStorage.getItem('socialMediaLinks');
    if (storedSocialLinks) {
        setSocialMediaLinks(JSON.parse(storedSocialLinks));
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
      const updatedFields: Partial<User> = {
        username,
      };

      if (email !== currentUser.email && !emailVerified) {
        toast({ variant: 'destructive', title: "Email Not Verified", description: "Please verify your new email address before saving." });
        return;
      }
      if (email !== currentUser.email) {
        updatedFields.email = email;
      }
      
      if (mobile !== currentUser.mobile && !mobileVerified) {
        toast({ variant: 'destructive', title: "Mobile Not Verified", description: "Please verify your new mobile number before saving." });
        return;
      }
      if (mobile !== currentUser.mobile) {
        updatedFields.mobile = mobile;
      }

      updateUser(updatedFields);
      toast({ title: "Profile Updated", description: "Your profile information has been saved." });
      setIsEditing(false);
      setEmailVerified(false);
      setMobileVerified(false);
      setEmailOtpSent(false);
      setMobileOtpSent(false);
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
  
  const handleCoverImageUpdate = () => {
    if (currentUser && coverImageFile) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const coverImageUrl = event.target?.result as string;
            updateUser({ coverImageUrl });
            toast({ title: "Cover Image Updated", description: "Your profile background has been changed." });
        };
        reader.readAsDataURL(coverImageFile);
    } else {
        toast({ variant: 'destructive', title: "No file selected", description: "Please select an image file to update your cover image."});
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setAvatarFile(e.target.files[0]);
    }
  };

  const handleCoverImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setCoverImageFile(e.target.files[0]);
    }
  };

  const handleChangePassword = () => {
    if (!currentUser) return;

    if (!currentPassword || !newPassword) {
      toast({ variant: 'destructive', title: "Fields Required", description: "Please enter both your current and new password." });
      return;
    }
    if (currentUser.password !== currentPassword) {
      toast({ variant: 'destructive', title: "Incorrect Password", description: "The current password you entered is incorrect." });
      return;
    }

    updateUser({ password: newPassword });
    toast({ title: "Password Changed", description: "Your password has been successfully updated." });
    setCurrentPassword('');
    setNewPassword('');
  };

  const handleLogout = () => {
    logout();
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  };
  
  const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleSendEmailOtp = () => {
    if(!currentUser) return;
    const newOtp = generateOtp();
    setEmailOtp(newOtp);
    setEmailOtpSent(true);
    setEmailCountdown(30);
    toast({ title: "OTP Sent", description: `An OTP has been sent to ${email}. (OTP: ${newOtp})`});
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
        <h1 className="font-headline text-3xl font-bold px-4">My Profile</h1>
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
      <h1 className="font-headline text-3xl font-bold px-4">My Profile</h1>

      <div className="-mx-4">
        <Card className="overflow-hidden rounded-none border-x-0">
          <div className="relative h-32 bg-muted">
              {currentUser.coverImageUrl && (
                  <Image src={currentUser.coverImageUrl} alt="Cover image" fill style={{objectFit: 'cover'}} />
              )}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-black/50 hover:bg-black/70">
                      <Edit2 className="h-4 w-4 text-white" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Cover Image</DialogTitle>
                    <DialogDescription>Upload a new background image for your profile.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="coverImageFile">Image</Label>
                    <Input id="coverImageFile" type="file" accept="image/*" onChange={handleCoverImageFileChange} />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <DialogClose asChild><Button onClick={handleCoverImageUpdate}>Save</Button></DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
          </div>
          <CardContent className="pt-0 -mt-12">
            <div className="flex flex-col items-center space-y-2">
              <Dialog>
                <DialogTrigger asChild>
                  <div className="relative group cursor-pointer">
                    <Avatar className="h-24 w-24 border-4 border-background">
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
                 <div className="flex items-center gap-2 justify-center">
                    <p className="font-headline text-2xl font-bold">{currentUser.username}</p>
                 </div>
                <p className="text-muted-foreground">{currentUser.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      <div className="px-4 space-y-6">
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
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isEditing} />
                      {isEditing && currentUser && email !== currentUser.email && !emailVerified && (
                          <Button onClick={handleSendEmailOtp} className="w-48" disabled={emailCountdown > 0}>
                              {emailCountdown > 0 ? `Resend in ${emailCountdown}s` : emailOtpSent ? 'Resend OTP' : 'Send OTP'}
                          </Button>
                      )}
                      {emailVerified && <CheckCircle className="text-green-500" />}
                  </div>
                  {isEditing && emailOtpSent && !emailVerified && (
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
                      {isEditing && currentUser && mobile !== currentUser.mobile && !mobileVerified && (
                          <Button onClick={handleSendMobileOtp} className="w-48" disabled={mobileCountdown > 0}>
                            {mobileCountdown > 0 ? `Resend in ${mobileCountdown}s` : mobileOtpSent ? 'Resend OTP' : 'Send OTP'}
                          </Button>
                      )}
                      {mobileVerified && <CheckCircle className="text-green-500" />}
                  </div>
                  {isEditing && mobileOtpSent && !mobileVerified && (
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
                <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
               <div className="flex justify-end">
                <Link href="/forgot-password">
                  <Button variant="link" type="button" className="text-sm p-0 h-auto">Forgot Password?</Button>
                </Link>
              </div>
              <Button onClick={handleChangePassword} className="w-full">Change Password</Button>
          </CardContent>
        </Card>
        
        {socialMediaLinks.length > 0 && (
          <Card>
              <CardHeader>
                  <CardTitle className="font-headline text-xl font-semibold">Join Our Community</CardTitle>
                  <CardDescription>Follow us on social media for updates and announcements.</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="flex justify-around flex-wrap gap-4">
                      {socialMediaLinks.map(link => (
                          <SocialIcon key={link.id} name={link.name} icon={link.icon} url={link.url} />
                      ))}
                  </div>
              </CardContent>
          </Card>
        )}

        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl font-semibold">Help &amp; Support</CardTitle>
                <CardDescription>Contact us if you need any assistance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Link href="/my-tickets" className='w-full'>
                    <Button variant="outline" className="w-full">
                        <Ticket className="mr-2 h-4 w-4" />
                        My Support Tickets
                    </Button>
                </Link>
                <Link href="/help-agent" className='w-full'>
                    <Button variant="outline" className="w-full">
                        <Bot className="mr-2 h-4 w-4" />
                        Talk to Help Agent
                    </Button>
                </Link>
                <div className="flex items-center gap-4">
                    <Phone className="h-5 w-5 text-primary" />
                    <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Helpline Number</span>
                        <a href={`tel:${helpAndSupportSettings.helplineNumber}`} className="text-base font-medium hover:underline">{helpAndSupportSettings.helplineNumber}</a>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Mail className="h-5 w-5 text-primary" />
                    <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Support Email</span>
                        <a href={`mailto:${helpAndSupportSettings.supportEmail}`} className="text-base font-medium hover:underline">{helpAndSupportSettings.supportEmail}</a>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Text Message</span>
                        <a href={`sms:${helpAndSupportSettings.helplineNumber}`} className="text-base font-medium hover:underline">Send us a message</a>
                    </div>
                </div>
            </CardContent>
        </Card>
        
        <div className="pt-4">
          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
