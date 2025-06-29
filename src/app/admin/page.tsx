'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, UserCheck, MessageSquare, Calendar as CalendarIcon, RotateCcw, Loader2 } from "lucide-react";
import { getUserCount } from "@/data/users";
import { getLeaderCount, getRatingCount } from "@/data/leaders";
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from "react-day-picker";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ userCount: 0, leaderCount: 0, ratingCount: 0 });
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async (startDate?: Date, endDate?: Date) => {
    setIsLoading(true);
    // Format dates to be start/end of day in UTC for consistent DB querying
    const start = startDate ? format(startDate, 'yyyy-MM-dd') + 'T00:00:00.000Z' : undefined;
    const end = endDate ? format(endDate, 'yyyy-MM-dd') + 'T23:59:59.999Z' : undefined;
    
    const [userCount, leaderCount, ratingCount] = await Promise.all([
      getUserCount(start, end),
      getLeaderCount(start, end),
      getRatingCount(start, end),
    ]);

    setStats({ userCount, leaderCount, ratingCount });
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStats(); // Fetch total counts on initial load
  }, []);
  
  const handleFilter = () => {
    if (date?.from && date?.to) {
      fetchStats(date.from, date.to);
    }
  };
  
  const handleReset = () => {
    setDate(undefined);
    fetchStats();
  };

  const statCards = [
    { title: 'Total Users', value: stats.userCount, icon: Users, color: 'text-blue-500' },
    { title: 'Total Leaders', value: stats.leaderCount, icon: UserCheck, color: 'text-green-500' },
    { title: 'Total Ratings', value: stats.ratingCount, icon: MessageSquare, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">Dashboard</h1>

        <Card>
            <CardHeader>
                <CardTitle>Filter Statistics</CardTitle>
                <CardDescription>Select a date range to view data for a specific period.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-4">
                 <div className="grid gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                            date.to ? (
                                <>
                                {format(date.from, "LLL dd, y")} -{" "}
                                {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                            ) : (
                            <span>Pick a date range</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                        />
                        </PopoverContent>
                    </Popover>
                </div>
                <Button onClick={handleFilter} disabled={!date?.from || !date?.to || isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Apply Filter
                </Button>
                <Button onClick={handleReset} variant="outline" disabled={isLoading}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                </Button>
            </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {statCards.map(stat => (
                <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{date?.from ? `New ${stat.title}` : stat.title}</CardTitle>
                        <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-8 w-1/4 animate-pulse bg-muted rounded-md mt-1" />
                        ) : (
                            <div className="text-2xl font-bold">{stat.value}</div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
  );
}
