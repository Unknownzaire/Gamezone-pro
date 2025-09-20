
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export interface WalletSettings {
    minWithdrawal: number;
    maxWithdrawal: number;
    depositUpiId: string;
    qrCodeImageUrl?: string;
}

export interface ReferralSettings {
    referralBonus: number;
    newUserBonus: number;
}

export interface SocialMediaSettings {
    youtubeUrl: string;
    instagramUrl: string;
    discordUrl: string;
}

export default function AdminSettingsPage() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const showOnly = searchParams.get('show');

    const [walletSettings, setWalletSettings] = useState<WalletSettings>({
        minWithdrawal: 100,
        maxWithdrawal: 5000,
        depositUpiId: 'gamezonepro@upi',
        qrCodeImageUrl: '',
    });
    const [referralSettings, setReferralSettings] = useState<ReferralSettings>({
        referralBonus: 25,
        newUserBonus: 25,
    });
    const [socialMediaSettings, setSocialMediaSettings] = useState<SocialMediaSettings>({
        youtubeUrl: 'https://youtube.com',
        instagramUrl: 'https://instagram.com',
        discordUrl: 'https://discord.com',
    });
    const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);

    useEffect(() => {
        const storedWalletSettings = localStorage.getItem('walletSettings');
        if (storedWalletSettings) {
            setWalletSettings(JSON.parse(storedWalletSettings));
        }
        const storedReferralSettings = localStorage.getItem('referralSettings');
        if (storedReferralSettings) {
            setReferralSettings(JSON.parse(storedReferralSettings));
        }
        const storedSocialMediaSettings = localStorage.getItem('socialMediaSettings');
        if (storedSocialMediaSettings) {
            setSocialMediaSettings(JSON.parse(storedSocialMediaSettings));
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

    const handleReferralUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('referralSettings', JSON.stringify(referralSettings));
        toast({
            title: "Referral Settings Updated",
            description: "The referral program settings have been saved."
        });
    }

    const handleSocialMediaUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('socialMediaSettings', JSON.stringify(socialMediaSettings));
        toast({
            title: "Social Media Links Updated",
            description: "The app's social media links have been saved."
        });
    }

    const handleWalletInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setWalletSettings(prev => ({
            ...prev,
            [id]: type === 'number' ? Number(value) : value,
        }));
    }

    const handleReferralInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setReferralSettings(prev => ({
            ...prev,
            [id]: Number(value),
        }));
    }

    const handleSocialMediaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setSocialMediaSettings(prev => ({
            ...prev,
            [id]: value,
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
                 <Link href={showOnly ? `/admin/referrals` : "/admin/dashboard"}>
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
                {(!showOnly || showOnly === 'security') && (
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
                )}

                 {(!showOnly || showOnly === 'wallet') && (
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
                 )}

                {(!showOnly || showOnly === 'referrals') && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Referral Settings</CardTitle>
                            <CardDescription>Configure bonuses for the user referral program.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleReferralUpdate}>
                            <CardContent className="pt-6 space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="referralBonus">Referrer Bonus (₹)</Label>
                                        <Input id="referralBonus" type="number" value={referralSettings.referralBonus} onChange={handleReferralInputChange} required />
                                        <p className="text-xs text-muted-foreground">Bonus for the user who refers a new player.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="newUserBonus">New User Bonus (₹)</Label>
                                        <Input id="newUserBonus" type="number" value={referralSettings.newUserBonus} onChange={handleReferralInputChange} required />
                                        <p className="text-xs text-muted-foreground">Bonus for the new user who signs up with a referral code.</p>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit">Save Referral Settings</Button>
                                </div>
                            </CardContent>
                        </form>
                    </Card>
                )}

                 {(!showOnly || showOnly === 'social') && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Social Media Links</CardTitle>
                            <CardDescription>Set the URLs for your community social media pages.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSocialMediaUpdate}>
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="youtubeUrl">YouTube URL</Label>
                                    <Input id="youtubeUrl" value={socialMediaSettings.youtubeUrl} onChange={handleSocialMediaInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="instagramUrl">Instagram URL</Label>
                                    <Input id="instagramUrl" value={socialMediaSettings.instagramUrl} onChange={handleSocialMediaInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="discordUrl">Discord URL</Label>
                                    <Input id="discordUrl" value={socialMediaSettings.discordUrl} onChange={handleSocialMediaInputChange} />
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit">Save Social Media Links</Button>
                                </div>
                            </CardContent>
                        </form>
                    </Card>
                 )}
            </div>
        </div>
    );
}
