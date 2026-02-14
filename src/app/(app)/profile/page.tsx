

'use client';
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { CheckCircle, Edit2, Mail, Phone, MessageSquare, Bot, Ticket, Link as LinkIcon, AlertTriangle, Users, Plus, Trash2 } from 'lucide-react';
import { useUser } from '@/hooks/use-user.tsx';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Image from 'next/image';
import type { User, SocialLink } from '@/lib/types';
import Link from 'next/link';
import type { HelpAndSupportSettings } from '@/app/admin/settings/page';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateEmail } from 'firebase/auth';
import { useFirebase } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { compressImage } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const SocialIcon = ({ name, icon, url }: { name: string; icon: SocialLink['icon']; url:string }) => {
    const iconProps = { className: "h-6 w-6" };
    let socialIcon;
    switch (icon) {
        case 'youtube':
            socialIcon = (
                <svg {...iconProps} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M2 8a4 4 0 0 1 4 -4h12a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4v-8z" /><path d="M10 9l5 3l-5 3z" /></svg>
            );
            break;
        case 'instagram':
             socialIcon = (
                <svg {...iconProps} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 4m0 4a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4v-8z" /><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M16.5 7.5l0 .01" /></svg>
             );
            break;
        case 'discord':
            socialIcon = (
                 <svg {...iconProps} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" /><path d="M14 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" /><path d="M15.5 17c0 1 1.5 3 2 3c1.5 0 2.833 -1.667 3.5 -3c.667 -1.667 .5 -5.833 -1.5 -11.5c-1.457 -1.015 -3 -1.34 -4.5 -1.5l-1 2.5" /><path d="M8.5 17c0 1 -1.5 3 -2 3c-1.5 0 -2.833 -1.667 -3.5 -3c-.667 -1.667 -.5 -5.833 1.5 -11.5c1.457 -1.015 3 -1.34 4.5 -1.5l1 2.5" /></svg>
            );
            break;
        case 'telegram':
             socialIcon = (
                <svg {...iconProps} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4" /></svg>
             );
            break;
        case 'whatsapp':
            socialIcon = (
                <svg {...iconProps} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" /><path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a4 4 0 0 1 -4 -4v-1a.5 .5 0 0_0 -1 0" /></svg>
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
  const { user: currentUser, updateUser, logout, allUsers, addNotification, removeUserFromTeam } = useUser();
  const { auth, user: firebaseUser } = useFirebase();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [primaryGame, setPrimaryGame] = useState<'BGMI' | 'FREE FIRE' | 'COD' | undefined>();
  const [inGameUsername, setInGameUsername] = useState('');
  const [inGameId, setInGameId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [mobile, setMobile] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  
  const [isEmailChangeOpen, setIsEmailChangeOpen] = useState(false);
  const [emailReauthPassword, setEmailReauthPassword] = useState('');

  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  
   const [helpAndSupportSettings, setHelpAndSupportSettings] = useState<HelpAndSupportSettings>({
        helplineNumber: '+911234567890',
        supportEmail: 'support@gamezonepro.com',
    });
    const [socialMediaLinks, setSocialMediaLinks] = useState<SocialLink[]>([]);
    
  const teamMembers = currentUser?.teamName ? allUsers.filter(u => u.teamName === currentUser.teamName) : [];
  const sortedTeamMembers = [...teamMembers].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const teamLeader = sortedTeamMembers.length > 0 ? sortedTeamMembers[0] : null;
  const isLeader = currentUser?.id === teamLeader?.id;

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || '');
      setEmail(currentUser.email || '');
      setPrimaryGame(currentUser.primaryGame);
      setInGameUsername(currentUser.inGameUsername || '');
      setInGameId(currentUser.inGameId || '');
      setTeamName(currentUser.teamName || '');
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
  
  const handleUpdateProfile = () => {
    if (!isEditing) {
        setIsEditing(true);
        return;
    }
    
    if (email !== currentUser?.email) {
        setIsEmailChangeOpen(true);
        return;
    }

    if (currentUser) {
      const updatedFields: Partial<User> = {
        username,
        mobile,
        primaryGame,
        inGameUsername,
        inGameId,
        teamName,
      };
      
      if (mobile !== currentUser.mobile) {
        updatedFields.mobileVerified = false;
      }

      updateUser(updatedFields);
      toast({ title: "Profile Updated", description: "Your profile information has been saved." });
      setIsEditing(false);
    }
  };

  const handleResetChanges = () => {
    if (currentUser) {
      setUsername(currentUser.username || '');
      setEmail(currentUser.email || '');
      setPrimaryGame(currentUser.primaryGame);
      setInGameUsername(currentUser.inGameUsername || '');
      setInGameId(currentUser.inGameId || '');
      setTeamName(currentUser.teamName || '');
      setMobile(currentUser.mobile || '');
    }
    setIsEditing(false);
  };

  const handleEmailChange = async () => {
    if (!firebaseUser || !currentUser || !currentUser.email) return;

    if (!emailReauthPassword) {
      toast({ variant: 'destructive', title: "Password Required", description: "Please enter your current password to change your email." });
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(currentUser.email, emailReauthPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updateEmail(firebaseUser, email);

      const updatedFields: Partial<User> = {
          username,
          mobile,
          email,
          emailVerified: false,
          primaryGame,
          inGameUsername,
          inGameId,
          teamName,
      };
      
      updateUser(updatedFields);
      toast({ title: "Profile & Email Updated", description: "Your profile information has been saved. A verification email has been sent to your new address." });
      setIsEditing(false);
      setIsEmailChangeOpen(false);
      setEmailReauthPassword('');

    } catch (error: any) {
        let description = "An error occurred while updating your email.";
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            description = "The password you entered is incorrect.";
        } else if (error.code === 'auth/email-already-in-use') {
            description = "This email address is already in use by another account.";
        }
        toast({ variant: 'destructive', title: "Email Change Failed", description });
    }
  };


  const handleAvatarUpdate = async () => {
    if (currentUser && avatarFile) {
        try {
            // Compress image to 200x200 for avatar
            const avatarUrl = await compressImage(avatarFile, { maxWidth: 200, maxHeight: 200, quality: 0.8 });
            updateUser({ avatarUrl });
            toast({ title: "Avatar Updated", description: "Your profile picture has been changed." });
        } catch (error) {
            console.error("Avatar compression error:", error);
            toast({ variant: 'destructive', title: "Update Failed", description: "Could not process the image. Please try a different one." });
        }
    } else {
        toast({ variant: 'destructive', title: "No file selected", description: "Please select an image file to update your avatar."});
    }
  };
  
  const handleCoverImageUpdate = async () => {
    if (currentUser && coverImageFile) {
        try {
            // Compress cover image to a reasonable banner size
            const coverImageUrl = await compressImage(coverImageFile, { maxWidth: 1000, maxHeight: 400, quality: 0.7 });
            updateUser({ coverImageUrl });
            toast({ title: "Cover Image Updated", description: "Your profile background has been changed." });
        } catch (error) {
            console.error("Cover image compression error:", error);
            toast({ variant: 'destructive', title: "Update Failed", description: "Could not process the image. Please try a different one." });
        }
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

  const handleChangePassword = async () => {
    if (!firebaseUser || !firebaseUser.email) {
      toast({ variant: 'destructive', title: "Error", description: "You must be logged in to change your password." });
      return;
    }

    if (!currentPassword || !newPassword) {
      toast({ variant: 'destructive', title: "Fields Required", description: "Please enter both your current and new password." });
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);

      updateUser({ password: newPassword });

      toast({ title: "Password Changed", description: "Your password has been successfully updated." });
      setCurrentPassword('');
      setNewPassword('');
    } catch (error: any) {
      let description = "An unexpected error occurred.";
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = "The current password you entered is incorrect.";
      } else if (error.code === 'auth/weak-password') {
        description = "The new password is too weak. It must be at least 6 characters long.";
      }
      console.error("Password change error:", error);
      toast({ variant: 'destructive', title: "Password Change Failed", description });
    }
  };

  const handleLogout = () => {
    logout();
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  };
  
  const handleGenerateInvite = (userToInvite: User) => {
    if (!teamName || !currentUser) return;

    if (teamMembers.length >= 4) {
      toast({
        variant: 'destructive',
        title: "Team is Full",
        description: "Your team already has 4 members. You cannot invite more players.",
      });
      setIsInviteDialogOpen(false);
      return;
    }
    
    const joinLink = `${window.location.origin}/login?action=join&team=${encodeURIComponent(teamName)}`;

    addNotification({
      userId: userToInvite.id,
      title: 'Team Invitation',
      description: `${currentUser.username} has invited you to join team "${teamName}".`,
      type: 'team-invite',
      payload: {
          teamName: teamName,
      },
      link: joinLink,
    });

    const inviteMessage = `Hi ${userToInvite.username}, join my team "${teamName}" on Gamezone Pro! Tap this link to join: ${joinLink}`;
    navigator.clipboard.writeText(inviteMessage);
    toast({
        title: "Invitation Sent & Link Copied!",
        description: `A notification has been sent to ${userToInvite.username}. A join link is copied to your clipboard.`,
    });
    setIsInviteDialogOpen(false);
  };
  
  const handleRemoveMember = (memberId: string) => {
    removeUserFromTeam(memberId);
  };

  const usersToInvite = allUsers.filter(u => u.id !== currentUser?.id && u.teamName !== teamName);
  const searchedUsersToInvite = inviteSearch ? usersToInvite.filter(u => u.username.toLowerCase().includes(inviteSearch.toLowerCase())) : usersToInvite;

  
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
      <div id="recaptcha-container" />
      <h1 className="font-headline text-3xl font-bold px-4">My Profile</h1>

      <div className="-mx-4">
        <Card className="overflow-hidden rounded-none border-x-0">
          <div className="relative h-32 bg-muted">
              {currentUser.coverImageUrl && (
                  <Image src={currentUser.coverImageUrl} alt="Cover image" fill={{objectFit: 'cover'}} />
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
                <Label htmlFor="primaryGame">Primary Game</Label>
                <Select value={primaryGame} onValueChange={(value) => setPrimaryGame(value as any)} disabled={!isEditing}>
                    <SelectTrigger id="primaryGame">
                        <SelectValue placeholder="Select your main game" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="BGMI">BGMI</SelectItem>
                        <SelectItem value="FREE FIRE">FREE FIRE</SelectItem>
                        <SelectItem value="COD">COD</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inGameUsername">{primaryGame || 'Game'} Username</Label>
                <Input id="inGameUsername" value={inGameUsername} onChange={(e) => setInGameUsername(e.target.value)} placeholder="Your in-game name" disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inGameId">{primaryGame || 'Game'} User ID</Label>
                <Input id="inGameId" value={inGameId} onChange={(e) => setInGameId(e.target.value)} placeholder="Your numeric game ID" disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <div className="flex items-center gap-2">
                  <Input id="teamName" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Your team name" disabled={!isEditing} />
                  {teamName && (
                    <>
                        <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
                            <DialogTrigger asChild>
                            <Button variant="outline" size="icon" disabled={!teamName || isEditing}>
                                <Users className="h-4 w-4" />
                                <span className="sr-only">View Team Members</span>
                            </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                <DialogTitle>Team: {teamName}</DialogTitle>
                                <DialogDescription>
                                    Members of your team.
                                </DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="h-72">
                                <div className="space-y-4 pr-4">
                                    {sortedTeamMembers.map(member => (
                                    <div key={member.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10">
                                            <AvatarImage src={member.avatarUrl} alt={member.username} />
                                            <AvatarFallback>{member.username.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                            <p className="font-semibold">{member.username}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {member.inGameUsername} ({member.inGameId})
                                            </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {teamLeader && member.id === teamLeader.id && (
                                                <Badge>Leader</Badge>
                                            )}
                                            {isLeader && member.id !== currentUser.id && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Remove {member.username}?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to remove {member.username} from your team? They will need a new invite to rejoin.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleRemoveMember(member.id)} className="bg-destructive hover:bg-destructive/90">
                                                                Remove
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </div>
                                    </div>
                                    ))}
                                </div>
                                </ScrollArea>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button>Close</Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="icon" disabled={!teamName || isEditing || teamMembers.length >= 4}>
                                    <Plus className="h-4 w-4" />
                                    <span className="sr-only">Send Invite Request</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Invite a player to '{teamName}'</DialogTitle>
                                    <DialogDescription>Search for a user to create a personalized invite.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <Input placeholder="Search for player by username..." value={inviteSearch} onChange={(e) => setInviteSearch(e.target.value)} />
                                    <ScrollArea className="h-72">
                                        <div className="space-y-2 pr-4">
                                            {searchedUsersToInvite.map(userToInvite => (
                                                <div key={userToInvite.id} className="flex items-center justify-between p-2 rounded-md border">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={userToInvite.avatarUrl} alt={userToInvite.username} />
                                                            <AvatarFallback>{userToInvite.username.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-semibold">{userToInvite.username}</p>
                                                            <p className="text-xs text-muted-foreground">{userToInvite.primaryGame}</p>
                                                        </div>
                                                    </div>
                                                    <Button size="sm" onClick={() => handleGenerateInvite(userToInvite)}>Invite</Button>
                                                </div>
                                            ))}
                                            {searchedUsersToInvite.length === 0 && (
                                                <p className="text-sm text-center text-muted-foreground py-8">No users found.</p>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center gap-2">
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isEditing} />
                      {currentUser.emailVerified && <CheckCircle className="text-green-500" />}
                  </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <div className="flex items-center gap-2">
                      <Input id="mobile" type="tel" value={mobile} onChange={(e) => {
                          const numericValue = e.target.value.replace(/[^0-9]/g, '');
                          if (numericValue.length <= 10) {
                            setMobile(numericValue);
                          }
                      }} disabled={!isEditing} />
                      {currentUser.mobileVerified && <CheckCircle className="text-green-500" />}
                  </div>
              </div>
              {isEditing ? (
                <div className="flex gap-4">
                    <Button onClick={handleResetChanges} variant="outline" className="w-full" type="button">
                        Cancel
                    </Button>
                    <Button onClick={handleUpdateProfile} className="w-full" type="button">
                        Save Changes
                    </Button>
                </div>
                ) : (
                <Button onClick={handleUpdateProfile} className="w-full" type="button">
                    Edit Profile
                </Button>
              )}
          </CardContent>
        </Card>
        
        <Dialog open={isEmailChangeOpen} onOpenChange={setIsEmailChangeOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Email Change</DialogTitle>
                    <DialogDescription>
                        To change your email address, please re-enter your current password for security.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="email-reauth-password">Current Password</Label>
                    <Input
                        id="email-reauth-password"
                        type="password"
                        value={emailReauthPassword}
                        onChange={(e) => setEmailReauthPassword(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleEmailChange}>Confirm & Change Email</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

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
              <Button onClick={handleChangePassword} className="w-full">Change Password</Button>
              <div className="text-center pt-2">
                <Link href="/forgot-password">
                    <span className="text-sm text-muted-foreground hover:text-primary">Forgot your password?</span>
                </Link>
              </div>
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
