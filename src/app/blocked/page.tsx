
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/Logo";
import { Ban } from "lucide-react";
import { useUser } from "@/hooks/use-user.tsx";

export default function BlockedPage() {
    const { logout } = useUser();

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8 text-center">
                <div className="flex justify-center">
                    <Logo />
                </div>
                <Card className="border-destructive">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                                <Ban className="w-8 h-8 text-destructive" />
                            </div>
                        </div>
                        <CardTitle className="font-headline text-destructive">Account Blocked</CardTitle>
                        <CardDescription>
                            Your account has been suspended by an administrator.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            You no longer have access to your profile, wallet, or tournaments. If you believe this is a mistake, please contact our support team.
                        </p>
                        <Button variant="destructive" onClick={logout} className="w-full">
                            Return to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
