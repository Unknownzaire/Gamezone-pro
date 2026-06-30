
'use client';
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { CheckCircle, Edit2, Mail, Phone, MessageSquare, Bot, Ticket, Link as LinkIcon, Users, Plus, Trash2 } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"
import Image from 'next/image';
import type { User, SocialLink } from '@/lib/types';
import Link from 'next/link';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateEmail, sendPasswordResetEmail } from 'firebase/auth';
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
  const { 
    user: currentUser, 
    updateUser, 
    logout, 
    allUsers, 
    addNotification, 
    removeUserFromTeam,
    gameList,
    socialMediaLinks,
    helpAndSupportSettings
  } = useUser();
  const { auth, user: firebaseUser } = useFirebase();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [primaryGame, setPrimaryGame] = useState<string | undefined>();
  const [gameProfiles, setGameProfiles] = useState<{ [key: string]: any }>({});
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
  
  const teamMembers = currentUser?.teamName ? allUsers.filter(u => u.teamName === currentUser.teamName) : [];
  const sortedTeamMembers = [...teamMembers].sort((a, b) => {
    if (a.teamJoinedAt && b.teamJoinedAt) return new Date(a.teamJoinedAt).getTime() - new Date(b.teamJoinedAt).getTime();
    return 0;
  });
  const teamLeader = sortedTeamMembers.length > 0 ? sortedTeamMembers[0] : null;
  const isLeader = currentUser?.id === teamLeader?.id;

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || '');
      setEmail(currentUser.email || '');
      setPrimaryGame(currentUser.primaryGame || (gameList.length > 0 ? gameList[0] : undefined));
      setGameProfiles(currentUser.gameProfiles || {});
      setTeamName(currentUser.teamName || '');
      setMobile(currentUser.mobile || '');
    }
  }, [currentUser, gameList]);
  
  const handleGameProfileChange = (game: string, field: 'inGameUsername' | 'inGameId', value: string) => {
    setGameProfiles(prev => ({
      ...prev,
      [game]: {
        ...prev[game],
        [field]: value
      }
    }));
  };

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
      if (username !== currentUser.username && allUsers.some(u => u.id !== currentUser.id && u.username.toLowerCase() === username.toLowerCase())) {
          toast({ variant: 'destructive', title: "Username Taken" });
          return;
      }

      const updatedFields: Partial<User> = {
        username,
        mobile,
        primaryGame,
        teamName,
        gameProfiles,
      };
      
      updateUser(updatedFields);
      toast({ title: "Profile Updated" });
      setIsEditing(false);
    }
  };

  const handleResetChanges = () => {
    if (currentUser) {
      setUsername(currentUser.username || '');
      setEmail(currentUser.email || '');
      setPrimaryGame(currentUser.primaryGame || (gameList.length > 0 ? gameList[0] : undefined));
      setGameProfiles(currentUser.gameProfiles || {});
      setTeamName(currentUser.teamName || '');
      setMobile(currentUser.mobile || '');
    }
    setIsEditing(false);
  };

  const handleEmailChange = async () => {
    if (!firebaseUser || !currentUser || !currentUser.email) return;

    try {
      const credential = EmailAuthProvider.credential(currentUser.email, emailReauthPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updateEmail(firebaseUser, email);

      updateUser({ email, emailVerified: false });
      toast({ title: "Email Updated" });
      setIsEditing(false);
      setIsEmailChangeOpen(false);
      setEmailReauthPassword('');
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Email Change Failed", description: error.message });
    }
  };

  const handleAvatarUpdate = async () => {
    if (currentUser && avatarFile) {
        const avatarUrl = await compressImage(avatarFile, { maxWidth: 200, maxHeight: 200 });
        updateUser({ avatarUrl });
        toast({ title: "Avatar Updated" });
    }
  };
  
  const handleCoverImageUpdate = async () => {
    if (currentUser && coverImageFile) {
        const coverImageUrl = await compressImage(coverImageFile, { maxWidth: 1000, maxHeight: 400 });
        updateUser({ coverImageUrl });
        toast({ title: "Cover Image Updated" });
    }
  };

  const handleChangePassword = async () => {
    if (!firebaseUser || !firebaseUser.email) return;
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);
      toast({ title: "Password Changed" });
      setCurrentPassword('');
      setNewPassword('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Password Change Failed", description: error.message });
    }
  };

  const handleForgotPassword = async () => {
    if (!auth || !currentUser?.email) return;
    await sendPasswordResetEmail(auth, currentUser.email);
    toast({ title: "Reset Email Sent" });
  };

  const handleGenerateInvite = (userToInvite: User) => {
    if (!teamName || !currentUser) return;
    addNotification({
      userId: userToInvite.id,
      title: 'Team Invitation',
      description: `${currentUser.username} has invited you to join team "${teamName}".`,
      type: 'team-invite',
      payload: { teamName },
    });
    toast({ title: "Invitation Sent!" });
    setIsInviteDialogOpen(false);
  };
  
  const handleRemoveMember = (memberId: string) => {
    removeUserFromTeam(memberId);
  };

  const searchedUsersToInvite = inviteSearch ? allUsers.filter(u => u.id !== currentUser?.id && u.username.toLowerCase().includes(inviteSearch.toLowerCase())) : allUsers.filter(u => u.id !== currentUser?.id);

  if (!currentUser) return <div className="p-8 text-center">Loading profile...</div>;

  const currentInGameUsername = (primaryGame && gameProfiles[primaryGame]?.inGameUsername) || '';
  const currentInGameId = (primaryGame && gameProfiles[primaryGame]?.inGameId) || '';

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold px-4">My Profile</h1>

      <div className="-mx-4">
        <Card className="overflow-hidden rounded-none border-x-0">
          <div className="relative h-32 bg-muted">
              {currentUser.coverImageUrl && <Image src={currentUser.coverImageUrl} alt="Cover" fill className="object-cover" />}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-black/50 hover:bg-black/70">
                      <Edit2 className="h-4 w-4 text-white" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Change Cover Image</DialogTitle></DialogHeader>
                  <Input type="file" accept="image/*" onChange={(e) => setCoverImageFile(e.target.files?.[0] || null)} />
                  <DialogFooter>
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
                  <DialogHeader><DialogTitle>Change Profile Picture</DialogTitle></DialogHeader>
                  <Input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
                  <DialogFooter>
                    <DialogClose asChild><Button onClick={handleAvatarUpdate}>Save</Button></DialogClose>
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
                <Select value={primaryGame} onValueChange={setPrimaryGame} disabled={!isEditing}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {gameList.map(game => <SelectItem key={game} value={game}>{game}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{primaryGame || 'Game'} Username</Label>
                <Input value={currentInGameUsername} onChange={(e) => handleGameProfileChange(primaryGame!, 'inGameUsername', e.target.value)} disabled={!isEditing || !primaryGame} />
              </div>
              <div className="space-y-2">
                <Label>{primaryGame || 'Game'} User ID</Label>
                <Input value={currentInGameId} onChange={(e) => handleGameProfileChange(primaryGame!, 'inGameId', e.target.value)} disabled={!isEditing || !primaryGame} />
              </div>
              <div className="space-y-2">
                <Label>Team Name</Label>
                <div className="flex items-center gap-2">
                  <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} disabled={!isEditing} />
                  {teamName && (
                    <>
                        <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="icon" disabled={isEditing}><Users className="h-4 w-4" /></Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Team: {teamName}</DialogTitle></DialogHeader>
                                <ScrollArea className="h-72">
                                <div className="space-y-4 pr-4">
                                    {sortedTeamMembers.map((member, index) => (
                                    <div key={member.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <span className="font-bold text-muted-foreground w-4 text-xs">{index + 1}.</span>
                                            <Avatar className="h-10 w-10">
                                              <AvatarImage src={member.avatarUrl} />
                                              <AvatarFallback>{member.username.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                              <p className="font-semibold">{member.username}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {teamLeader && member.id === teamLeader.id && <Badge>Leader</Badge>}
                                            {isLeader && member.id !== currentUser.id && (
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(member.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            )}
                                        </div>
                                    </div>
                                    ))}
                                </div>
                                </ScrollArea>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="icon" disabled={isEditing || teamMembers.length >= 4}><Plus className="h-4 w-4" /></Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Invite a player</DialogTitle></DialogHeader>
                                <Input placeholder="Search..." value={inviteSearch} onChange={(e) => setInviteSearch(e.target.value)} />
                                <ScrollArea className="h-72">
                                    <div className="space-y-2 pr-4">
                                        {searchedUsersToInvite.map(userToInvite => (
                                            <div key={userToInvite.id} className="flex items-center justify-between p-2 rounded-md border">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8"><AvatarImage src={userToInvite.avatarUrl} /></Avatar>
                                                    <span className="font-semibold">{userToInvite.username}</span>
                                                </div>
                                                <Button size="sm" onClick={() => handleGenerateInvite(userToInvite)}>Invite</Button>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </DialogContent>
                        </Dialog>
                    </>
                  )}
                </div>
              </div>
              {isEditing ? (
                <div className="flex gap-4">
                    <Button onClick={handleResetChanges} variant="outline" className="w-full">Cancel</Button>
                    <Button onClick={handleUpdateProfile} className="w-full">Save Changes</Button>
                </div>
                ) : (
                <Button onClick={handleUpdateProfile} className="w-full">Edit Profile</Button>
              )}
          </CardContent>
        </Card>
        
        <Dialog open={isEmailChangeOpen} onOpenChange={setIsEmailChangeOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Confirm Email Change</DialogTitle></DialogHeader>
                <Input type="password" value={emailReauthPassword} onChange={(e) => setEmailReauthPassword(e.target.value)} placeholder="Current Password" />
                <DialogFooter>
                    <Button onClick={handleEmailChange}>Confirm & Change Email</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Card>
          <CardContent className="pt-6 space-y-4">
              <h2 className="font-headline text-xl font-semibold">Change Password</h2>
              <Input type="password" placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              <Input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <div className="flex flex-col gap-2">
                <Button onClick={handleChangePassword} className="w-full">Change Password</Button>
                <Button onClick={handleForgotPassword} variant="link" className="text-muted-foreground text-xs h-auto py-0">Forgot Password?</Button>
              </div>
          </CardContent>
        </Card>
        
        {socialMediaLinks.length > 0 && (
          <Card>
              <CardHeader>
                  <CardTitle className="font-headline text-xl font-semibold">Join Our Community</CardTitle>
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

        {helpAndSupportSettings && (
          <Card>
              <CardHeader>
                  <CardTitle className="font-headline text-xl font-semibold">Help &amp; Support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <Link href="/my-tickets" className='w-full'><Button variant="outline" className="w-full"><Ticket className="mr-2 h-4 w-4" />My Support Tickets</Button></Link>
                  <Link href="/help-agent" className='w-full'><Button variant="outline" className="w-full"><Bot className="mr-2 h-4 w-4" />Talk to Help Agent</Button></Link>
                  <div className="flex items-center gap-4">
                      <Phone className="h-5 w-5 text-primary" />
                      <a href={`tel:${helpAndSupportSettings.helplineNumber}`} className="font-medium">{helpAndSupportSettings.helplineNumber}</a>
                  </div>
                  <div className="flex items-center gap-4">
                      <Mail className="h-5 w-5 text-primary" />
                      <a href={`mailto:${helpAndSupportSettings.supportEmail}`} className="font-medium">{helpAndSupportSettings.supportEmail}</a>
                  </div>
              </CardContent>
          </Card>
        )}
        
        <div className="pt-4">
          <Button variant="destructive" className="w-full" onClick={logout}>Logout</Button>
        </div>
      </div>
    </div>
  );
}
