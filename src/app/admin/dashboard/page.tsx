'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockTournaments, mockUsers } from "@/lib/mock-data";
import { User } from '@/lib/types';
import { DollarSign, Swords, Trophy, Users } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [totalUsers, setTotalUsers] = useState(mockUsers.length);

  useEffect(() => {
    const storedUsers = localStorage.getItem('allUsers');
    if (storedUsers) {
      const users: User[] = JSON.parse(storedUsers);
      setTotalUsers(users.length);
    }
  }, []);


  const totalTournaments = mockTournaments.length;
  const totalPrizeDistributed = mockTournaments
    .filter(t => t.status === 'Completed')
    .reduce((acc, t) => acc + t.prizePool, 0);
  const totalRevenue = mockTournaments
    .filter(t => t.status === 'Completed')
    .reduce((acc, t) => acc + t.prizePool * (t.commissionPercentage / 100), 0);

  const stats = [
    { title: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, href: null },
    { title: "Total Users", value: totalUsers, icon: Users, href: '/admin/users' },
    { title: "Total Tournaments", value: totalTournaments, icon: Swords, href: '/admin/tournaments' },
    { title: "Prize Distributed", value: `₹${totalPrizeDistributed.toLocaleString()}`, icon: Trophy, href: null },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const cardContent = (
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
          
          if (stat.href) {
            return (
              <Link href={stat.href} key={index}>
                {cardContent}
              </Link>
            )
          }

          return <div key={index}>{cardContent}</div>;
        })}
      </div>
       <Card>
        <CardHeader>
            <CardTitle className="font-headline">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">Activity feed will be shown here.</p>
        </CardContent>
       </Card>
    </div>
  );
}
