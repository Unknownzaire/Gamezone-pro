
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RoyalPassPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/home">
                    <Button variant="outline" size="icon" className="h-7 w-7">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Button>
                </Link>
                <div>
                    <h1 className="font-headline text-3xl font-bold">Royal Pass</h1>
                    <p className="text-muted-foreground">Unlock exclusive rewards.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Coming Soon!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">The Royal Pass feature is under development. Stay tuned for exciting new ways to earn rewards and enhance your gaming experience!</p>
                </CardContent>
            </Card>
        </div>
    );
}
