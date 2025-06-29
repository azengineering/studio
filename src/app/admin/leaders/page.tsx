
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { getApprovedLeaders, getPendingLeaders, approveLeader, deleteLeader, type Leader } from "@/data/leaders";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Edit, Trash2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminLeadersPage() {
    const [pendingLeaders, setPendingLeaders] = useState<Leader[]>([]);
    const [approvedLeaders, setApprovedLeaders] = useState<Leader[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const { toast } = useToast();

    const fetchLeaders = async () => {
        setIsLoading(true);
        const [pending, approved] = await Promise.all([getPendingLeaders(), getApprovedLeaders()]);
        setPendingLeaders(pending);
        setApprovedLeaders(approved);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchLeaders();
    }, []);

    const handleApprove = (leaderId: string) => {
        startTransition(async () => {
            await approveLeader(leaderId);
            toast({ title: "Leader Approved", description: "The leader is now visible on the public site." });
            await fetchLeaders();
        });
    };

    const handleDelete = (leaderId: string, leaderName: string) => {
        startTransition(async () => {
            await deleteLeader(leaderId);
            toast({ variant: 'destructive', title: "Leader Deleted", description: `${leaderName} has been removed from the database.` });
            await fetchLeaders();
        });
    };

    const handleEdit = (leaderId: string) => {
        router.push(`/add-leader?edit=${leaderId}`);
    };

    const LeaderTable = ({ leaders, isPendingTab }: { leaders: Leader[], isPendingTab: boolean }) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Constituency</TableHead>
                    <TableHead>Added On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {leaders.length > 0 ? leaders.map((leader: Leader) => (
                    <TableRow key={leader.id}>
                        <TableCell className="font-medium">{leader.name}</TableCell>
                        <TableCell>{leader.partyName}</TableCell>
                        <TableCell>{leader.constituency}</TableCell>
                        <TableCell>{leader.createdAt ? new Date(leader.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell className="text-right space-x-2">
                             {isPendingTab && (
                                <Button variant="ghost" size="sm" onClick={() => handleApprove(leader.id)} disabled={isPending}>
                                    <CheckCircle className="h-4 w-4 mr-1 text-green-600" /> Approve
                                </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(leader.id)} disabled={isPending}>
                                <Edit className="h-4 w-4 mr-1 text-blue-600" /> Edit
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={isPending}>
                                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the leader and all associated ratings and comments.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(leader.id, leader.name)} className="bg-destructive hover:bg-destructive/90">
                                            Yes, delete it
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            {isPendingTab ? "No leaders pending approval." : "No approved leaders found."}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Leader Management</CardTitle>
                <CardDescription>Approve, edit, or delete leader submissions.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="pending">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pending">
                            <Clock className="mr-2 h-4 w-4"/>
                            Pending Approval
                            <Badge variant="secondary" className="ml-2">{pendingLeaders.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="approved">
                             <CheckCircle className="mr-2 h-4 w-4"/>
                            Approved Leaders
                            <Badge variant="secondary" className="ml-2">{approvedLeaders.length}</Badge>
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="pending" className="mt-4">
                        {isLoading ? <p>Loading...</p> : <LeaderTable leaders={pendingLeaders} isPendingTab={true} />}
                    </TabsContent>
                    <TabsContent value="approved" className="mt-4">
                        {isLoading ? <p>Loading...</p> : <LeaderTable leaders={approvedLeaders} isPendingTab={false} />}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
