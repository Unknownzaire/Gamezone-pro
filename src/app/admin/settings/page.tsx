'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettingsPage() {
    const { toast } = useToast();

    const handleSecurityUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Security Settings Updated",
            description: "Your admin credentials have been updated."
        });
    }
    
    const handleWalletUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Wallet Settings Updated",
            description: "The global wallet settings have been saved."
        });
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-headline text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Update your admin and application settings.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Admin Security</CardTitle>
                        <CardDescription>Update your admin account credentials.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSecurityUpdate}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Admin Username</Label>
                                <Input id="username" defaultValue="admin" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input id="current-password" type="password" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input id="new-password" type="password" />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit">Save Security Settings</Button>
                            </div>
                        </CardContent>
                    </form>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Wallet Settings</CardTitle>
                        <CardDescription>Configure global wallet and payment settings.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleWalletUpdate}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="min-withdrawal">Minimum Withdrawal (₹)</Label>
                                <Input id="min-withdrawal" type="number" defaultValue="100" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="max-withdrawal">Maximum Withdrawal (₹)</Label>
                                <Input id="max-withdrawal" type="number" defaultValue="5000" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="upi-id">Deposit UPI ID</Label>
                                <Input id="upi-id" defaultValue="arenaace@upi" required />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit">Save Wallet Settings</Button>
                            </div>
                        </CardContent>
                    </form>
                </Card>
            </div>
        </div>
    );
}
