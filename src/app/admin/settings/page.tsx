
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Loader2, RefreshCcw, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SocialLink } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { compressImage } from "@/lib/utils";
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
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface WalletSettings {
    minWithdrawal: number;
    maxWithdrawal: number;
    depositUpiId: string;
    qrCodeImageUrl?: string;
    // Bank Transfer
    bankName?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    bankAccountHolderName?: string;
    // Binance
    binanceId?: string;
    binanceQrCodeImageUrl?: string;
    // PayPal
    paypalEmail?: string;
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
    const router = useRouter();
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
    
    const [upiQrFile, setUpiQrFile] = useState<File | null>(null);
    const [binanceQrFile, setBinanceQrFile] = useState<File | null>(null);
    const [isUpdatingWallet, setIsUpdatingWallet] = useState(false);

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
    
    const handleWalletUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdatingWallet(true);

        const saveSettings = (settings: WalletSettings) => {
            try {
                localStorage.setItem('walletSettings', JSON.stringify(settings));
                toast({
                    title: "Wallet Settings Updated",
                    description: "The global wallet settings have been saved."
                });
            } catch (error) {
                console.error("Wallet update save error:", error);
                toast({ variant: 'destructive', title: 'Update Failed', description: 'Storage limit reached. Try using a smaller QR image.' });
            } finally {
                setIsUpdatingWallet(false);
            }
        };

        let updatedSettings = { ...walletSettings };

        if (upiQrFile) {
            try {
                const imageUrl = await compressImage(upiQrFile, { maxWidth: 400, maxHeight: 400, quality: 0.6 });
                updatedSettings.qrCodeImageUrl = imageUrl;
            } catch (error) {
                console.error("UPI QR Compression error:", error);
                toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not process UPI QR image.' });
            }
        }

        if (binanceQrFile) {
            try {
                const imageUrl = await compressImage(binanceQrFile, { maxWidth: 400, maxHeight: 400, quality: 0.6 });
                updatedSettings.binanceQrCodeImageUrl = imageUrl;
            } catch (error) {
                console.error("Binance QR Compression error:", error);
                toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not process Binance QR image.' });
            }
        }

        setWalletSettings(updatedSettings);
        saveSettings(updatedSettings);
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

     const handleUpiFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUpiQrFile(e.target.files[0]);
        }
    };

    const handleBinanceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setBinanceQrFile(e.target.files[0]);
        }
    };
    
    const handleHelpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setHelpAndSupportSettings(prev => ({
            ...prev,
            [id]: value,
        }));
    }

    const handleResetAppData = () => {
        localStorage.clear();
        toast({
            title: "App Data Reset",
            description: "All local storage has been cleared. The app will now reload with defaults."
        });
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
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
                            <CardTitle>Wallet & Payment Settings</CardTitle>
                            <CardDescription>Configure global wallet limits and deposit details.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleWalletUpdate}>
                            <CardContent className="pt-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="minWithdrawal">Min Withdrawal (₹)</Label>
                                        <Input id="minWithdrawal" type="number" value={walletSettings.minWithdrawal} onChange={handleWalletInputChange} required disabled={isUpdatingWallet} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maxWithdrawal">Max Withdrawal (₹)</Label>
                                        <Input id="maxWithdrawal" type="number" value={walletSettings.maxWithdrawal} onChange={handleWalletInputChange} required disabled={isUpdatingWallet} />
                                    </div>
                                </div>

                                <Tabs defaultValue="upi" className="w-full">
                                    <TabsList className="grid w-full grid-cols-4">
                                        <TabsTrigger value="upi">UPI</TabsTrigger>
                                        <TabsTrigger value="bank">Bank</TabsTrigger>
                                        <TabsTrigger value="binance">Binance</TabsTrigger>
                                        <TabsTrigger value="paypal">PayPal</TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContent value="upi" className="space-y-4 pt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="depositUpiId">Deposit UPI ID</Label>
                                            <Input id="depositUpiId" value={walletSettings.depositUpiId} onChange={handleWalletInputChange} disabled={isUpdatingWallet} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="upi-qr">UPI QR Code</Label>
                                            <Input id="upi-qr" type="file" accept="image/*" onChange={handleUpiFileChange} disabled={isUpdatingWallet} />
                                            {walletSettings.qrCodeImageUrl && !upiQrFile && <p className="text-xs text-muted-foreground">Current QR code is set.</p>}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="bank" className="space-y-4 pt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="bankName">Bank Name</Label>
                                                <Input id="bankName" value={walletSettings.bankName} onChange={handleWalletInputChange} disabled={isUpdatingWallet} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="bankIfscCode">IFSC Code</Label>
                                                <Input id="bankIfscCode" value={walletSettings.bankIfscCode} onChange={handleWalletInputChange} disabled={isUpdatingWallet} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bankAccountNumber">Account Number</Label>
                                            <Input id="bankAccountNumber" value={walletSettings.bankAccountNumber} onChange={handleWalletInputChange} disabled={isUpdatingWallet} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bankAccountHolderName">Account Holder Name</Label>
                                            <Input id="bankAccountHolderName" value={walletSettings.bankAccountHolderName} onChange={handleWalletInputChange} disabled={isUpdatingWallet} />
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="binance" className="space-y-4 pt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="binanceId">Binance ID</Label>
                                            <Input id="binanceId" value={walletSettings.binanceId} onChange={handleWalletInputChange} disabled={isUpdatingWallet} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="binance-qr">Binance Pay QR Code</Label>
                                            <Input id="binance-qr" type="file" accept="image/*" onChange={handleBinanceFileChange} disabled={isUpdatingWallet} />
                                            {walletSettings.binanceQrCodeImageUrl && !binanceQrFile && <p className="text-xs text-muted-foreground">Current QR code is set.</p>}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="paypal" className="space-y-4 pt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="paypalEmail">PayPal Support Email</Label>
                                            <Input id="paypalEmail" type="email" value={walletSettings.paypalEmail} onChange={handleWalletInputChange} disabled={isUpdatingWallet} />
                                        </div>
                                    </TabsContent>
                                </Tabs>

                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={isUpdatingWallet}>
                                        {isUpdatingWallet ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Save Payment Settings
                                    </Button>
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
                                                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
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

                <Card className="border-destructive/50 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Danger Zone
                        </CardTitle>
                        <CardDescription>Destructive actions that cannot be undone.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/20 bg-background p-4">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold">Reset App Data</p>
                                <p className="text-xs text-muted-foreground">Clear all local storage data. Useful if you hit storage limits or data is corrupted.</p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                        <RefreshCcw className="mr-2 h-4 w-4" />
                                        Reset Data
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently clear all mock data, users, tournaments, and transactions from your browser's local storage. This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleResetAppData} className="bg-destructive hover:bg-destructive/90 text-white">
                                            Yes, Reset Everything
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
