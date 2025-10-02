
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
                <svg {...iconProps} fill="#FF0000" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zM9.98 15V9l6 3-6 3z"/></svg>
            );
            break;
        case 'instagram':
             socialIcon = (
                <svg {...iconProps} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <radialGradient id="insta-gradient" cx="0.3" cy="1.2" r="1.2">
                        <stop offset="0" stopColor="#F58529"/>
                        <stop offset="0.4" stopColor="#DD2A7B"/>
                        <stop offset="0.9" stopColor="#8134AF"/>
                        </radialGradient>
                    </defs>
                    <path fill="url(#insta-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.07-1.645-.07-4.85s.012-3.584.07-4.85c.149-3.225 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.85-.069zm0 1.441c-3.116 0-3.485.011-4.69.068-2.88.131-4.018 1.244-4.148 4.148-.057 1.206-.068 1.575-.068 4.69s.011 3.485.068 4.69c.13 2.88 1.244 4.018 4.148 4.148 1.206.057 1.575.068 4.69.068s3.485-.011 4.69-.068c2.88-.131 4.018-1.244 4.148-4.148.057-1.206.068-1.575.068-4.69s-.011-3.485-.068-4.69c-.13-2.88-1.244-4.018-4.148-4.148-1.206-.057-1.575-.068-4.69-.068zm0 3.838c-2.937 0-5.312 2.375-5.312 5.312s2.375 5.312 5.312 5.312 5.312-2.375 5.312-5.312-2.375-5.312-5.312-5.312zm0 8.625c-1.815 0-3.312-1.497-3.312-3.312s1.497-3.312 3.312-3.312 3.312 1.497 3.312 3.312-1.497 3.312-3.312 3.312zm4.688-9.438c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25z"/>
                </svg>
             );
            break;
        case 'discord':
            socialIcon = (
                <svg {...iconProps} fill="#5865F2" viewBox="0 0 28 21"><path d="M23.0212 1.60547C21.3125 0.817969 19.5055 0.260937 17.625 0C17.4586 0.414062 17.3195 0.855469 17.2086 1.32422C14.7398 1.04531 12.2711 1.04531 9.80234 1.32422C9.69141 0.855469 9.55234 0.414062 9.38594 0C7.50547 0.260937 5.69844 0.817969 4.01719 1.60547C0.589844 6.33281 -0.321094 10.9312 0.0515625 15.4406C1.66719 16.9688 3.51562 18.1672 5.5625 19.0781C5.99219 18.5211 6.36484 17.9367 6.68047 17.325C6.11484 17.0727 5.57656 16.7922 5.06562 16.4844C5.23203 16.3453 5.37109 16.2062 5.5375 16.0398C9.48984 18.232 14.5383 18.232 18.4906 16.0398C18.657 16.2062 18.7961 16.3453 18.9625 16.4844C18.4516 16.7922 17.9133 17.0727 17.3477 17.325C17.6633 17.9367 18.0359 18.5211 18.4656 19.0781C20.5125 18.1672 22.3609 16.9688 23.9766 15.4406C24.418 10.4578 23.3609 5.85938 23.0212 1.60547ZM7.92344 13.6219C6.88281 13.6219 6.01562 12.6938 6.01562 11.5625C6.01562 10.4312 6.85547 9.50312 7.92344 9.50312C8.99141 9.50312 9.85859 10.4312 9.83047 11.5625C9.83047 12.6938 8.99141 13.6219 7.92344 13.6219ZM16.1062 13.6219C15.0656 13.6219 14.1984 12.6938 14.1984 11.5625C14.1984 10.4312 15.0383 9.50312 16.1062 9.50312C17.1742 9.50312 18.0414 10.4312 18.0133 11.5625C18.0133 12.6938 17.1742 13.6219 16.1062 13.6219Z" /></svg>
            );
            break;
        case 'telegram':
             socialIcon = (
                <svg {...iconProps} fill="#2AABEE" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11.944 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zM15.423 8.38l-2.003 9.133c-.15.684-.539.85-1.103.528l-2.9-2.138-1.402 1.348c-.156.155-.294.293-.561.293l.202-3.03 5.432-4.91c.234-.203-.054-.316-.364-.112L8.23 12.27l-2.846-.888c-.684-.211-.694-.68.146-1.005l10.27-3.957c.573-.205 1.054.128.872.95z"/></svg>
             );
            break;
        case 'whatsapp':
            socialIcon = (
                <svg {...iconProps} fill="#25D366" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12.04 2.02c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.48 1.34 5.01L2 22l5.05-1.49c1.47.81 3.12 1.25 4.86 1.25h.13c5.46 0 9.9-4.44 9.9-9.9s-4.44-9.9-9.9-9.9zM17.29 15.5c-.19.29-.75.9-1.29 1.44-.48.48-1.03.77-1.57.82-.48.05-.92.05-1.42-.14-1.39-.51-2.6-1.3-3.66-2.51-1.23-1.4-2.12-3.03-2.22-3.22-.1-.19-.88-1.18-.88-2.2s.53-1.57.72-1.76c.19-.19.42-.24.62-.24s.29-.05.44-.05.29-.05.44.38.62 1.52.67 1.62c.05.1.05.19 0 .29-.05.1-.1.14-.19.24-.1.1-.19.19-.29.33-.1.14-.14.19-.05.33.14.24.62 1.03 1.31 1.67.88.81 1.57 1.13 1.76 1.23.19.1.29.09.38-.05.1-.14.43-.53.58-.72.14-.19.29-.14.48-.1s1.29.62 1.52.72c.24.1.38.14.43.24.05.1.05.24-.04.53z"/></svg>
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

    