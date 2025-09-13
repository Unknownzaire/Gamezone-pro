'use client';
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { mockUsers } from "@/lib/mock-data";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const currentUser = mockUsers[0];

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
              <Input id="email" type="email" defaultValue={currentUser.email} />
            </div>
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
