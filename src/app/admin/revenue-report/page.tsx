
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockTournaments } from "@/lib/mock-data";
import { Tournament } from "@/lib/types";
import { format, getWeek, getYear, startOfWeek, endOfWeek } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type RevenueReport = {
  [key: string]: {
    totalRevenue: number;
    count: number;
  }
};

const ReportTable = ({ data, title, valueHeader }: { data: RevenueReport, title: string, valueHeader: string }) => {
  const sortedData = Object.entries(data).sort(([keyA], [keyB]) => keyB.localeCompare(keyA));
  
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{title}</TableHead>
              <TableHead className="text-right">Tournaments</TableHead>
              <TableHead className="text-right">{valueHeader}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map(([period, stats]) => (
              <TableRow key={period}>
                <TableCell className="font-medium">{period}</TableCell>
                <TableCell className="text-right">{stats.count}</TableCell>
                <TableCell className="text-right font-semibold">₹{stats.totalRevenue.toLocaleString()}</TableCell>
              </TableRow>
            ))}
             <TableRow className="bg-muted/50 font-bold">
              <TableCell>Total</TableCell>
              <TableCell className="text-right">{Object.values(data).reduce((acc, curr) => acc + curr.count, 0)}</TableCell>
              <TableCell className="text-right">₹{Object.values(data).reduce((acc, curr) => acc + curr.totalRevenue, 0).toLocaleString()}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};


export default function AdminRevenueReportPage() {
  const [completed, setCompleted] = useState<Tournament[]>([]);

  const loadCompletedTournaments = useCallback(() => {
    try {
      const storedTournaments = localStorage.getItem('allTournaments');
      const allTournaments = storedTournaments 
        ? JSON.parse(storedTournaments).map((t: any) => ({...t, matchTime: new Date(t.matchTime)})) 
        : mockTournaments;
      setCompleted(allTournaments.filter((t: Tournament) => t.status === 'Completed'));
    } catch (error) {
      console.error("Failed to load tournament data", error);
      setCompleted(mockTournaments.filter((t: Tournament) => t.status === 'Completed'));
    }
  }, []);

  useEffect(() => {
    loadCompletedTournaments();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'allTournaments') {
        loadCompletedTournaments();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadCompletedTournaments]);

  const calculateRevenue = (t: Tournament) => (t.participants.length * t.entryFee) - t.prizePool;

  const dailyReport = completed.reduce((acc: RevenueReport, t) => {
    const day = format(t.matchTime, 'yyyy-MM-dd (EEEE)');
    if (!acc[day]) acc[day] = { totalRevenue: 0, count: 0 };
    acc[day].totalRevenue += calculateRevenue(t);
    acc[day].count += 1;
    return acc;
  }, {});

  const weeklyReport = completed.reduce((acc: RevenueReport, t) => {
    const year = getYear(t.matchTime);
    const week = getWeek(t.matchTime, { weekStartsOn: 1 });
    const weekStart = format(startOfWeek(t.matchTime, { weekStartsOn: 1 }), 'MMM d');
    const weekEnd = format(endOfWeek(t.matchTime, { weekStartsOn: 1 }), 'MMM d, yyyy');
    const key = `${year}, Week ${week} (${weekStart} - ${weekEnd})`;
    
    if (!acc[key]) acc[key] = { totalRevenue: 0, count: 0 };
    acc[key].totalRevenue += calculateRevenue(t);
    acc[key].count += 1;
    return acc;
  }, {});

  const monthlyReport = completed.reduce((acc: RevenueReport, t) => {
    const month = format(t.matchTime, 'yyyy-MM (MMMM)');
    if (!acc[month]) acc[month] = { totalRevenue: 0, count: 0 };
    acc[month].totalRevenue += calculateRevenue(t);
    acc[month].count += 1;
    return acc;
  }, {});
  
  const yearlyReport = completed.reduce((acc: RevenueReport, t) => {
    const year = format(t.matchTime, 'yyyy');
    if (!acc[year]) acc[year] = { totalRevenue: 0, count: 0 };
    acc[year].totalRevenue += calculateRevenue(t);
    acc[year].count += 1;
    return acc;
  }, {});


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
            <h1 className="font-headline text-3xl font-bold">Total Revenue Report</h1>
            <p className="text-muted-foreground">Breakdown of all revenue generated from commissions.</p>
        </div>
      </div>
      <Tabs defaultValue="daily" className="w-full">
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>
        <TabsContent value="daily" className="mt-4">
            <ReportTable data={dailyReport} title="Day" valueHeader="Total Revenue" />
        </TabsContent>
        <TabsContent value="weekly" className="mt-4">
            <ReportTable data={weeklyReport} title="Week" valueHeader="Total Revenue" />
        </TabsContent>
        <TabsContent value="monthly" className="mt-4">
            <ReportTable data={monthlyReport} title="Month" valueHeader="Total Revenue" />
        </TabsContent>
        <TabsContent value="yearly" className="mt-4">
            <ReportTable data={yearlyReport} title="Year" valueHeader="Total Revenue" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
