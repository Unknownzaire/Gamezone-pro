
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { SocialLink } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

export interface HelpAndSupportSettings {
    helplineNumber: string;
    supportEmail: string;
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
    const [socialMediaLinks, setSocialMediaLinks] = useState<SocialLink[]>([
        { id: '1', name: 'YouTube', url: 'https://youtube.com', icon: 'youtube' },
        { id: '2', name: 'Instagram', url: 'https://instagram.com', icon: 'instagram' },
        { id: '3', name: 'Discord', url: 'https://discord.com', icon: 'discord' },
    ]);
     const [helpAndSupportSettings, setHelpAndSupportSettings] = useState<HelpAndSupportSettings>({
        helplineNumber: '+911234567890',
        supportEmail: 'support@gamezonepro.com',
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
        const storedSocialMediaSettings = localStorage.getItem('socialMediaLinks');
        if (storedSocialMediaSettings) {
            setSocialMediaLinks(JSON.parse(storedSocialMediaSettings));
        }
        const storedHelpSettings = localStorage.getItem('helpAndSupportSettings');
        if (storedHelpSettings) {
            setHelpAndSupportSettings(JSON.parse(storedHelpSettings));
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
        localStorage.setItem('socialMediaLinks', JSON.stringify(socialMediaLinks));
        toast({
            title: "Social Media Links Updated",
            description: "The app's social media links have been saved."
        });
    }

    const handleHelpAndSupportUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('helpAndSupportSettings', JSON.stringify(helpAndSupportSettings));
        toast({
            title: "Help & Support Settings Updated",
            description: "The support contact details have been saved."
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
    
    const handleSocialLinkChange = (id: string, field: 'name' | 'url' | 'icon', value: string) => {
        setSocialMediaLinks(prev => prev.map(link => 
            link.id === id ? { ...link, [field]: value } : link
        ));
    };

    const addSocialLink = () => {
        setSocialMediaLinks(prev => [...prev, { id: Date.now().toString(), name: '', url: '', icon: 'link' }]);
    };

    const removeSocialLink = (id: string) => {
        setSocialMediaLinks(prev => prev.filter(link => link.id !== id));
    };

     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setQrCodeFile(e.target.files[0]);
        }
    };
    
    const handleHelpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setHelpAndSupportSettings(prev => ({
            ...prev,
            [id]: value,
        }));
    }


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
                                {socialMediaLinks.map((link) => (
                                    <div key={link.id} className="flex items-end gap-2">
                                        <div className="grid w-full grid-cols-[1fr,1fr,auto] gap-2">
                                            <div className="space-y-1">
                                                <Label htmlFor={`name-${link.id}`} className="text-xs">Name</Label>
                                                <Input id={`name-${link.id}`} value={link.name} onChange={(e) => handleSocialLinkChange(link.id, 'name', e.target.value)} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor={`url-${link.id}`} className="text-xs">URL</Label>
                                                <Input id={`url-${link.id}`} value={link.url} onChange={(e) => handleSocialLinkChange(link.id, 'url', e.target.value)} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor={`icon-${link.id}`} className="text-xs">Icon</Label>
                                                <Select value={link.icon} onValueChange={(value) => handleSocialLinkChange(link.id, 'icon', value)}>
                                                    <SelectTrigger id={`icon-${link.id}`} className="w-28">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="youtube">YouTube</SelectItem>
                                                        <SelectItem value="instagram">Instagram</SelectItem>
                                                        <SelectItem value="discord">Discord</SelectItem>
                                                        <SelectItem value="telegram">Telegram</SelectItem>
                                                        <SelectItem value="link">Generic</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => removeSocialLink(link.id)} type="button">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={addSocialLink} type="button">
                                    <Plus className="mr-2 h-4 w-4" /> Add Link
                                </Button>
                                <div className="flex justify-end pt-4">
                                    <Button type="submit">Save Social Media Links</Button>
                                </div>
                            </CardContent>
                        </form>
                    </Card>
                 )}

                 {(!showOnly || showOnly === 'help') && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Help &amp; Support Settings</CardTitle>
                            <CardDescription>Configure contact details for user support.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleHelpAndSupportUpdate}>
                            <CardContent className="pt-6 space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="helplineNumber">Helpline Number</Label>
                                        <Input id="helplineNumber" type="tel" value={helpAndSupportSettings.helplineNumber} onChange={handleHelpInputChange} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="supportEmail">Support Email</Label>
                                        <Input id="supportEmail" type="email" value={helpAndSupportSettings.supportEmail} onChange={handleHelpInputChange} required />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit">Save Support Settings</Button>
                                </div>
                            </CardContent>
                        </form>
                    </Card>
                )}
            </div>
        </div>
    );
}
