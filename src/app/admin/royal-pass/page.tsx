
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminRoyalPassPage() {
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
                    <h1 className="font-headline text-3xl font-bold">Royal Pass Management</h1>
                    <p className="text-muted-foreground">Manage Royal Pass users and rewards.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Coming Soon!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">The Royal Pass management feature is under development. Here you will be able to view users with an active pass, define rewards for different tiers, and manage pass settings.</p>
                </CardContent>
            </Card>
        </div>
    );
}
