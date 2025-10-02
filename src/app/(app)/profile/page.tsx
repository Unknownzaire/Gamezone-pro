
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
                <svg {...iconProps} viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M27.5 5.5s-0.25-1.75-1-2.5C25.5 2 24.5 2 24 2c-4-0.5-8-0.5-8-0.5s-4 0-8 0.5c-0.5 0-1.5 0-2.5 1C4.75 3.75 4.5 5.5 4.5 5.5S4.25 7.25 4.25 9v2s0 1.75 0.25 3.5c0.25 1.75 1 2.5 1 2.5s1 0.75 2.5 0.75c4 0.5 8 0.5 8 0.5s4 0 8-0.5c0.5 0 1.5 0 2.5-1s1-2.5 1-2.5c0.25-1.75 0.25-3.5 0.25-3.5v-2s0-1.75-0.25-3.5Z" fill="#FF0000"/>
                    <path d="M12.5 12.5v-7l6 3.5-6 3.5Z" fill="#fff"/>
                </svg>
            );
            break;
        case 'instagram':
             socialIcon = (
                <svg {...iconProps} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <radialGradient id="ig-gradient" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(18.5 4.5) rotate(120.983) scale(22.258 21.321)">
                        <stop stop-color="#FFC107"/>
                        <stop offset=".5" stop-color="#F44336"/>
                        <stop offset="1" stop-color="#9C27B0"/>
                        </radialGradient>
                    </defs>
                    <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" fill="url(#ig-gradient)"/>
                    <path d="M3 16V8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5Zm2 0a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H8a3 3 0 0 0-3 3v8Z" fill="url(#ig-gradient)"/>
                    <path d="M17.5 7.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="url(#ig-gradient)"/>
                </svg>
             );
            break;
        case 'discord':
            socialIcon = (
                <svg {...iconProps} fill="#5865F2" viewBox="0 0 28 21">
                    <path d="M23.021 1.684a.34.34 0 0 1 .37.342V16.34a.34.34 0 0 1-.37.342H5.05a.34.34 0 0 1-.37-.342V2.026c0-.188.164-.342.37-.342h17.971Zm-10.15 6.425a1.481 1.481 0 0 0-1.488 1.472c0 .813.666 1.471 1.488 1.471a1.481 1.481 0 0 0 1.489-1.471c0-.813-.666-1.472-1.489-1.472Zm4.572 0a1.481 1.481 0 0 0-1.488 1.472c0 .813.666 1.471 1.488 1.471a1.481 1.481 0 0 0 1.488-1.471c0-.813-.665-1.472-1.488-1.472Z"/><path d="M26.477.001H1.523C.682.001 0 .674 0 1.503v15.303c0 .828.682 1.502 1.523 1.502h18.633l-1.483-1.393 1.442 1.258 4.673 4.131V1.503C28 .674 27.318.001 26.477.001Zm-3.456 16.681H5.05V2.026h17.97v14.656Z"/>
                </svg>
            );
            break;
        case 'telegram':
             socialIcon = (
                <svg {...iconProps} fill="#2AABEE" viewBox="0 0 24 24">
                    <path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12Z"/>
                    <path d="m9.417 15.181-.397 5.584c.568 0 .814-.244 1.109-.537l2.663-2.545 5.518 4.041c1.012.564 1.725.267 1.998-.931L23.456 3.99c.345-1.625-.8-2.28-2.027-1.77l-19.5 7.498c-1.584.59-1.584 1.449-.283 1.816l4.984 1.569 11.392-6.924c.546-.333 1.033-.15 0.589.193L9.417 15.18Z" fill="#fff"/>
                </svg>
             );
            break;
        case 'whatsapp':
            socialIcon = (
                <svg {...iconProps} fill="#25D366" viewBox="0 0 24 24">
                    <path d="M12 24C5.372 24 0 18.628 0 12S5.372 0 12 0s12 5.372 12 12-5.372 12-12 12Zm0-2a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" fill-rule="evenodd" clip-rule="evenodd"/>
                    <path d="M17.228 14.475c-.21-.104-.756-.372-1.077-.492-.32-.12-.583-.168-.845.168-.263.336-.504.672-.665.816-.16.144-.342.168-.583.06-.24-.108-1.02-.372-1.944-1.2-.72-.648-1.2-1.44-1.34-1.68-.14-.24-.01-.372.09-.492.09-.108.21-.264.31-.396.1-.132.14-.228.21-.372.07-.144.03-.264-.03-.372-.06-.108-.551-1.32-.756-1.824-.2-.504-.41-.432-.55-.432-.14 0-.3 0-.46.012-.16 0-.42.06-.64.312-.22.252-.86.84-.86 2.064s.88 2.388 1 2.556c.12.168.683 1.139 2.063 1.955.336.205.6.325.816.42.504.228.84.192.984.12.168-.072.504-.204.6-.396.1-.192.1-.36.07-.396-.03-.036-.18-.084-.39-.192Z" fill="#fff"/>
                </svg>
            );
            break;
        default:
            socialIcon = <LinkIcon className="h-6 w-6 text-muted-foreground" />;
    }
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-center group">
            <div className="rounded-full p-3 transition-colors">
              {socialIcon}
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{name}</span>
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

    

    




    

    

    

    