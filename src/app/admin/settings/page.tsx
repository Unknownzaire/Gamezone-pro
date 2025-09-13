'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettingsPage() {
    const { toast } = useToast();

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Settings Updated",
            description: "Your admin credentials have been updated."
        });
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-headline text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Update your admin account settings.</p>
            </div>

            <Card className="max-w-2xl">
                <form onSubmit={handleUpdate}>
                    <CardContent className="pt-6 space-y-4">
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
                            <Button type="submit">Save Changes</Button>
                        </div>
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
