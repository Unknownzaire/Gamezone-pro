
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockTournaments } from "@/lib/mock-data";
import { Tournament } from "@/lib/types";
import { format, getWeek, getYear, parseISO, startOfWeek, endOfWeek, formatISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

type PrizeReport = {
  [key: string]: {
    totalPrize: number;
    count: number;
    tournaments: Tournament[];
  }
};

const ReportTable = ({ data, title }: { data: PrizeReport, title: string }) => {
  const sortedData = Object.entries(data).sort(([keyA], [keyB]) => keyB.localeCompare(keyA));
  
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{title}</TableHead>
              <TableHead className="text-right">Tournaments</TableHead>
              <TableHead className="text-right">Total Prize Distributed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map(([period, stats]) => (
              <Dialog key={period}>
                <TableRow>
                  <TableCell className="font-medium">{period}</TableCell>
                  <TableCell className="text-right">{stats.count}</TableCell>
                  <DialogTrigger asChild>
                    <TableCell className="text-right font-semibold cursor-pointer">₹{stats.totalPrize.toLocaleString()}</TableCell>
                  </DialogTrigger>
                  <TableCell className="text-right">
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm"><Eye className="mr-2 h-4 w-4" />View</Button>
                      </DialogTrigger>
                  </TableCell>
                </TableRow>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tournaments for {period}</DialogTitle>
                    <DialogDescription>
                        A total of {stats.count} tournaments were completed in this period.
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="h-72">
                    <div className="space-y-2 pr-4">
                      {stats.tournaments.map(t => (
                        <div key={t.id} className="flex items-center justify-between rounded-md border p-3">
                          <div>
                            <p className="font-semibold">{t.title}</p>
                            <p className="text-sm text-muted-foreground">{format(new Date(t.matchTime), 'PPp')}</p>
                          </div>
                            <Link href={`/admin/tournaments/${t.id}`}>
                            <Button size="sm">Manage</Button>
                            </Link>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            ))}
             <TableRow className="bg-muted/50 font-bold">
              <TableCell>Total</TableCell>
              <TableCell className="text-right">{Object.values(data).reduce((acc, curr) => acc + curr.count, 0)}</TableCell>
              <TableCell className="text-right">₹{Object.values(data).reduce((acc, curr) => acc + curr.totalPrize, 0).toLocaleString()}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};


export default function AdminReportsPage() {
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

  const dailyReport = completed.reduce((acc: PrizeReport, t) => {
    const day = format(t.matchTime, 'yyyy-MM-dd (EEEE)');
    if (!acc[day]) acc[day] = { totalPrize: 0, count: 0, tournaments: [] };
    acc[day].totalPrize += t.prizePool;
    acc[day].count += 1;
    acc[day].tournaments.push(t);
    return acc;
  }, {});

  const weeklyReport = completed.reduce((acc: PrizeReport, t) => {
    const year = getYear(t.matchTime);
    const week = getWeek(t.matchTime, { weekStartsOn: 1 });
    const weekStart = format(startOfWeek(t.matchTime, { weekStartsOn: 1 }), 'MMM d');
    const weekEnd = format(endOfWeek(t.matchTime, { weekStartsOn: 1 }), 'MMM d, yyyy');
    const key = `${year}, Week ${week} (${weekStart} - ${weekEnd})`;
    
    if (!acc[key]) acc[key] = { totalPrize: 0, count: 0, tournaments: [] };
    acc[key].totalPrize += t.prizePool;
    acc[key].count += 1;
    acc[key].tournaments.push(t);
    return acc;
  }, {});

  const monthlyReport = completed.reduce((acc: PrizeReport, t) => {
    const month = format(t.matchTime, 'yyyy-MM (MMMM)');
    if (!acc[month]) acc[month] = { totalPrize: 0, count: 0, tournaments: [] };
    acc[month].totalPrize += t.prizePool;
    acc[month].count += 1;
    acc[month].tournaments.push(t);
    return acc;
  }, {});
  
  const yearlyReport = completed.reduce((acc: PrizeReport, t) => {
    const year = format(t.matchTime, 'yyyy');
    if (!acc[year]) acc[year] = { totalPrize: 0, count: 0, tournaments: [] };
    acc[year].totalPrize += t.prizePool;
    acc[year].count += 1;
    acc[year].tournaments.push(t);
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
            <h1 className="font-headline text-3xl font-bold">Prize Distribution Report</h1>
            <p className="text-muted-foreground">Breakdown of all prize money distributed.</p>
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
            <ReportTable data={dailyReport} title="Day" />
        </TabsContent>
        <TabsContent value="weekly" className="mt-4">
            <ReportTable data={weeklyReport} title="Week" />
        </TabsContent>
        <TabsContent value="monthly" className="mt-4">
            <ReportTable data={monthlyReport} title="Month" />
        </TabsContent>
        <TabsContent value="yearly" className="mt-4">
            <ReportTable data={yearlyReport} title="Year" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
