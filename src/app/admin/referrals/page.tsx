
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockUsers as initialUsers } from "@/lib/mock-data";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { User } from "@/lib/types";
import Link from "next/link";
import { format } from "date-fns";

export default function AdminReferralsPage() {
  const [users, setUsers] = useState<User[]>([]);
  
  const loadData = useCallback(() => {
    const storedUsers = localStorage.getItem('allUsers');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers).map((u: any) => ({...u, createdAt: u.createdAt ? new Date(u.createdAt) : new Date() })));
    } else {
      setUsers(initialUsers);
      localStorage.setItem('allUsers', JSON.stringify(initialUsers));
    }
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('focus', loadData);
    return () => {
      window.removeEventListener('focus', loadData);
    };
  }, [loadData]);
  
  const referredUsers = users.filter(u => u.referredBy).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const getUserById = (id: string) => users.find(u => u.id === id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="hidden md:block">
              <Button variant="outline" size="icon" className="h-7 w-7">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
              </Button>
          </Link>
          <div>
            <h1 className="font-headline text-3xl font-bold">Referrals</h1>
            <p className="text-muted-foreground">List of all users who joined via a referral.</p>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={() => loadData()}>
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh referrals</span>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referred User</TableHead>
                <TableHead>Referred By</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referredUsers.map((user) => {
                const referrer = user.referredBy ? getUserById(user.referredBy) : null;
                return (
                    <TableRow key={user.id}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={user.avatarUrl} alt={user.username} />
                            <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">
                            <p>{user.username}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        </div>
                    </TableCell>
                     <TableCell>
                        {referrer ? (
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={referrer.avatarUrl} alt={referrer.username} />
                                    <AvatarFallback>{referrer.username.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="font-medium">
                                    <p>{referrer.username}</p>
                                    <p className="text-sm text-muted-foreground">{referrer.email}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">N/A</p>
                        )}
                    </TableCell>
                    <TableCell>{format(new Date(user.createdAt), 'PPp')}</TableCell>
                    </TableRow>
                )
            })}
            </TableBody>
          </Table>
          {referredUsers.length === 0 && (
            <p className="text-center text-muted-foreground py-16">No users have been referred yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
