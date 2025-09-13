'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CreateTournamentPage() {
    const router = useRouter();
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Tournament Created",
            description: "The new tournament has been successfully created."
        });
        router.push('/admin/tournaments');
    }

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
                            <Input id="title" placeholder="e.g., Summer Showdown" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="game">Game Name</Label>
                            <Input id="game" placeholder="BGMI" defaultValue="BGMI" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="match-time">Match Time</Label>
                            <Input id="match-time" type="datetime-local" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="entry-fee">Entry Fee (₹)</Label>
                            <Input id="entry-fee" type="number" placeholder="50" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="prize-pool">Prize Pool (₹)</Label>
                            <Input id="prize-pool" type="number" placeholder="5000" required />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="commission">Commission (%)</Label>
                            <Input id="commission" type="number" placeholder="10" required />
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
