
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, RefreshCw, Trash2, Search, Copy, CheckCircle, Clock, Users, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { RedeemCode, User } from '@/lib/types';
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
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminRedeemCodesPage() {
    const [codes, setCodes] = useState<RedeemCode[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newAmount, setNewAmount] = useState('100');
    const [usageLimit, setUsageLimit] = useState('1');
    const [customCode, setCustomCode] = useState('');
    const { toast } = useToast();

    const loadData = useCallback(() => {
        const storedCodes = localStorage.getItem('redeemCodes');
        if (storedCodes) {
            setCodes(JSON.parse(storedCodes));
        }

        const storedUsers = localStorage.getItem('allUsers');
        if (storedUsers) {
            setUsers(JSON.parse(storedUsers));
        }
    }, []);

    useEffect(() => {
        loadData();
        window.addEventListener('storage', loadData);
        window.addEventListener('focus', loadData);
        return () => {
            window.removeEventListener('storage', loadData);
            window.removeEventListener('focus', loadData);
        };
    }, [loadData]);

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 10; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const handleCreateCode = () => {
        const amount = parseFloat(newAmount);
        if (isNaN(amount) || amount <= 0) {
            toast({ variant: 'destructive', title: "Invalid Amount" });
            return;
        }

        const limit = parseInt(usageLimit);
        if (isNaN(limit) || limit <= 0) {
            toast({ variant: 'destructive', title: "Invalid Usage Limit" });
            return;
        }

        const finalCode = customCode.trim() || generateCode();
        
        if (codes.some(c => c.code.toUpperCase() === finalCode.toUpperCase())) {
            toast({ variant: 'destructive', title: "Code Already Exists", description: "Please use a unique code." });
            return;
        }

        const newRedeemCode: RedeemCode = {
            id: `rc-${Date.now()}`,
            code: finalCode.toUpperCase(),
            amount: amount,
            status: 'active',
            usageLimit: limit,
            usedCount: 0,
            usedBy: [],
            createdAt: new Date().toISOString()
        };

        const updatedCodes = [newRedeemCode, ...codes];
        setCodes(updatedCodes);
        localStorage.setItem('redeemCodes', JSON.stringify(updatedCodes));
        
        toast({ title: "Redeem Code Created", description: `Code ${finalCode.toUpperCase()} is now active.` });
        setIsCreateOpen(false);
        setCustomCode('');
        setUsageLimit('1');
    };

    const handleDeleteCode = (id: string) => {
        const updatedCodes = codes.filter(c => c.id !== id);
        setCodes(updatedCodes);
        localStorage.setItem('redeemCodes', JSON.stringify(updatedCodes));
        toast({ title: "Code Deleted" });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Code Copied!" });
    };

    const getUserById = (userId: string) => users.find(u => u.id === userId);

    const filteredCodes = codes.filter(c => 
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/dashboard">
                        <Button variant="outline" size="icon" className="h-7 w-7">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h1 className="font-headline text-3xl font-bold">Redeem Codes</h1>
                        <p className="text-muted-foreground">Generate and manage balance top-up codes.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={loadData}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => setIsCreateOpen(!isCreateOpen)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Code
                    </Button>
                </div>
            </div>

            {isCreateOpen && (
                <Card>
                    <CardHeader>
                        <CardTitle>Generate Code</CardTitle>
                        <CardDescription>Enter details for the new redeemable voucher.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Voucher Value (₹)</Label>
                                <Input id="amount" type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="usageLimit">Usage Limit (Users)</Label>
                                <Input id="usageLimit" type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} />
                                <p className="text-[10px] text-muted-foreground">How many people can use this code.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customCode">Custom Code (Optional)</Label>
                                <div className="flex items-center gap-2">
                                    <Input 
                                        id="customCode" 
                                        placeholder="Leave blank for random" 
                                        value={customCode} 
                                        onChange={(e) => setCustomCode(e.target.value.toUpperCase())} 
                                        className="font-mono"
                                    />
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="icon" 
                                        title="Auto Generate"
                                        onClick={() => setCustomCode(generateCode())}
                                    >
                                        <RefreshCcw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateCode}>Create Code</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>History & Inventory</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search codes..." 
                                className="pl-8" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[600px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Usage Limit</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCodes.map((code) => {
                                    const isExhausted = code.usedCount >= code.usageLimit;
                                    return (
                                        <TableRow key={code.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <code className="bg-muted px-2 py-1 rounded font-bold text-primary">{code.code}</code>
                                                    {!isExhausted && (
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(code.code)}>
                                                            <Copy className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-bold">₹{code.amount.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-sm">
                                                        <span className="font-bold text-primary">{code.usedCount}</span> / {code.usageLimit}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={!isExhausted ? 'default' : 'secondary'}>
                                                    {!isExhausted ? <Clock className="mr-1 h-3 w-3" /> : <CheckCircle className="mr-1 h-3 w-3" />}
                                                    {isExhausted ? 'Exhausted' : 'Active'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {format(new Date(code.createdAt), 'PPp')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Redeem Code?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will remove the code "{code.code}" from the system. Users who already redeemed it will keep their balance.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteCode(code.id)} className="bg-destructive">Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                        {filteredCodes.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground italic">No redeem codes found.</div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
