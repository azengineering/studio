import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, MessageSquare } from "lucide-react";
import { getUserCount } from "@/data/users";
import { getLeaderCount, getRatingCount } from "@/data/leaders";

export default async function AdminDashboard() {
  const userCount = await getUserCount();
  const leaderCount = await getLeaderCount();
  const ratingCount = await getRatingCount();

  const stats = [
    { title: 'Total Users', value: userCount, icon: Users, color: 'text-blue-500' },
    { title: 'Total Leaders', value: leaderCount, icon: UserCheck, color: 'text-green-500' },
    { title: 'Total Ratings', value: ratingCount, icon: MessageSquare, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stats.map(stat => (
                <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
  );
}
