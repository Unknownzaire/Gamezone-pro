
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import React, { useState } from "react";
import type { Tournament } from "@/lib/types";
import { mockTournaments as initialMockTournaments } from "@/lib/mock-data";

export default function CreateTournamentPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [imageFile, setImageFile] = useState<File | null>(null);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        const processAndSubmit = (imageUrl: string) => {
            const newTournament: Tournament = {
                id: `t-${Date.now()}`,
                title: formData.get('title') as string,
                gameName: formData.get('game') as string,
                matchTime: new Date(formData.get('match-time') as string),
                entryFee: Number(formData.get('entry-fee')),
                prizePool: Number(formData.get('prize-pool')),
                commissionPercentage: Number(formData.get('commission')),
                imageUrl,
                imageHint: formData.get('imageHint') as string,
                status: 'Upcoming',
                participants: [],
            };

            const storedTournaments = localStorage.getItem('allTournaments');
            const allTournaments: Tournament[] = storedTournaments ? JSON.parse(storedTournaments) : initialMockTournaments;
            
            localStorage.setItem('allTournaments', JSON.stringify([newTournament, ...allTournaments]));

            toast({
                title: "Tournament Created",
                description: "The new tournament has been successfully created."
            });
            router.push('/admin/tournaments');
        };
        
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                processAndSubmit(imageUrl);
            };
            reader.readAsDataURL(imageFile);
        } else {
             const imageUrl = `https://picsum.photos/seed/${Math.random()}/600/400`;
             processAndSubmit(imageUrl);
        }
    }

     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/tournaments">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="font-headline text-3xl font-bold">Create New Tournament</h1>
                    <p className="text-muted-foreground">Fill in the details to set up a new event.</p>
                </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <CardContent className="pt-6 grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="title">Tournament Title</Label>
                            <Input id="title" name="title" placeholder="e.g., Summer Showdown" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="game">Game Name</Label>
                            <Input id="game" name="game" placeholder="BGMI" defaultValue="BGMI" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="match-time">Match Time</Label>
                            <Input id="match-time" name="match-time" type="datetime-local" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="entry-fee">Entry Fee (₹)</Label>
                            <Input id="entry-fee" name="entry-fee" type="number" placeholder="50" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="prize-pool">Prize Pool (₹)</Label>
                            <Input id="prize-pool" name="prize-pool" type="number" placeholder="5000" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="commission">Commission (%)</Label>
                            <Input id="commission" name="commission" type="number" placeholder="10" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="imageHint">Image Hint</Label>
                            <Input id="imageHint" name="imageHint" placeholder="e.g., epic battle" />
                        </div>
                         <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="imageFile">Tournament Image</Label>
                            <Input id="imageFile" type="file" accept="image/*" onChange={handleFileChange} />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <Button type="submit">Create Tournament</Button>
                        </div>
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
