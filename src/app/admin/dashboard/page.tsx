import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockTournaments, mockUsers } from "@/lib/mock-data";
import { DollarSign, Swords, Trophy, Users } from "lucide-react";

export default function AdminDashboardPage() {
  const totalUsers = mockUsers.length;
  const totalTournaments = mockTournaments.length;
  const totalPrizeDistributed = mockTournaments
    .filter(t => t.status === 'Completed')
    .reduce((acc, t) => acc + t.prizePool, 0);
  const totalRevenue = mockTournaments
    .filter(t => t.status === 'Completed')
    .reduce((acc, t) => acc + t.prizePool * (t.commissionPercentage / 100), 0);

  const stats = [
    { title: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign },
    { title: "Total Users", value: totalUsers, icon: Users },
    { title: "Total Tournaments", value: totalTournaments, icon: Swords },
    { title: "Prize Distributed", value: `₹${totalPrizeDistributed.toLocaleString()}`, icon: Trophy },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
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
