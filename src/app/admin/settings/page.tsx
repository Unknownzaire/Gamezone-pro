
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export interface WalletSettings {
    minWithdrawal: number;
    maxWithdrawal: number;
    depositUpiId: string;
    qrCodeImageUrl?: string;
}

export default function AdminSettingsPage() {
    const { toast } = useToast();
    const [walletSettings, setWalletSettings] = useState<WalletSettings>({
        minWithdrawal: 100,
        maxWithdrawal: 5000,
        depositUpiId: 'arenaace@upi',
        qrCodeImageUrl: '',
    });
    const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);

    useEffect(() => {
        const storedSettings = localStorage.getItem('walletSettings');
        if (storedSettings) {
            setWalletSettings(JSON.parse(storedSettings));
        }
    }, []);

    const handleSecurityUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Security Settings Updated",
            description: "Your admin credentials have been updated."
        });
    }
    
    const handleWalletUpdate = (e: React.FormEvent) => {
        e.preventDefault();

        const saveSettings = (settings: WalletSettings) => {
            localStorage.setItem('walletSettings', JSON.stringify(settings));
            toast({
                title: "Wallet Settings Updated",
                description: "The global wallet settings have been saved."
            });
        };

        if (qrCodeFile) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                const newSettings = { ...walletSettings, qrCodeImageUrl: imageUrl };
                setWalletSettings(newSettings);
                saveSettings(newSettings);
            };
            reader.readAsDataURL(qrCodeFile);
        } else {
            saveSettings(walletSettings);
        }
    }

    const handleWalletInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setWalletSettings(prev => ({
            ...prev,
            [id]: type === 'number' ? Number(value) : value,
        }));
    }

     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setQrCodeFile(e.target.files[0]);
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                 <Link href="/admin/dashboard">
                    <Button variant="outline" size="icon" className="h-7 w-7">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Button>
                </Link>
                <div>
                    <h1 className="font-headline text-3xl font-bold">Settings</h1>
                    <p className="text-muted-foreground">Update your admin and application settings.</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Admin Security</CardTitle>
                        <CardDescription>Update your admin account credentials.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSecurityUpdate}>
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
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="minWithdrawal">Minimum Withdrawal (₹)</Label>
                                <Input id="minWithdrawal" type="number" value={walletSettings.minWithdrawal} onChange={handleWalletInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxWithdrawal">Maximum Withdrawal (₹)</Label>
                                <Input id="maxWithdrawal" type="number" value={walletSettings.maxWithdrawal} onChange={handleWalletInputChange} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="depositUpiId">Deposit UPI ID</Label>
                                <Input id="depositUpiId" value={walletSettings.depositUpiId} onChange={handleWalletInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="qr-code">QR Code Image</Label>
                                <Input id="qr-code" type="file" accept="image/*" onChange={handleFileChange} />
                                {walletSettings.qrCodeImageUrl && !qrCodeFile && <p className="text-xs text-muted-foreground pt-1">Current QR code is set. Upload a new file to replace it.</p>}
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
