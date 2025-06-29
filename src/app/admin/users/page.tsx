
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUsers, type User } from "@/data/users";
import { getActivitiesForUser, getLeadersAddedByUser, type UserActivity, type Leader } from "@/data/leaders";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, RotateCw, X, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

// The User type from the data layer will include these optional counts
type UserWithCounts = User & {
    ratingCount?: number;
    leaderAddedCount?: number;
};

type SelectedTab = 'profile' | 'ratings' | 'leaders';

const ProfileInfo = ({ label, value }: {label: string, value: string | number | undefined | null}) => (
    <div>
        <Label className="text-sm text-muted-foreground">{label}</Label>
        <p className="text-base font-medium">{value || 'N/A'}</p>
    </div>
);

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserWithCounts[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserWithCounts | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const [selectedTab, setSelectedTab] = useState<SelectedTab>('profile');
    const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
    const [userAddedLeaders, setUserAddedLeaders] = useState<Leader[]>([]);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);
    
    const fetchUsers = async (query?: string) => {
        setIsLoading(true);
        setSelectedUser(null);
        const fetchedUsers = await getUsers(query);
        setUsers(fetchedUsers as UserWithCounts[]);
        setIsLoading(false);
    };

    const handleSearch = () => {
        if (!hasSearched) setHasSearched(true);
        fetchUsers(searchTerm);
    };
    
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    };
    
    const handleReset = () => {
        setSearchTerm('');
        setUsers([]);
        setHasSearched(false);
        setSelectedUser(null);
    };

    const handleSelectUser = (user: UserWithCounts, tab: SelectedTab = 'profile') => {
        setSelectedUser(user);
        setSelectedTab(tab);
        setUserActivities([]);
        setUserAddedLeaders([]);
        if (tab === 'ratings') {
            fetchUserRatings(user.id);
        }
        if (tab === 'leaders') {
            fetchUserLeaders(user.id);
        }
    };

    const fetchUserRatings = useCallback(async (userId: string) => {
        setIsDetailsLoading(true);
        const activities = await getActivitiesForUser(userId);
        setUserActivities(activities);
        setIsDetailsLoading(false);
    }, []);

    const fetchUserLeaders = useCallback(async (userId: string) => {
        setIsDetailsLoading(true);
        const leaders = await getLeadersAddedByUser(userId);
        setUserAddedLeaders(leaders);
        setIsDetailsLoading(false);
    }, []);
    
    useEffect(() => {
        if (selectedUser) {
            if (selectedTab === 'ratings') fetchUserRatings(selectedUser.id);
            if (selectedTab === 'leaders') fetchUserLeaders(selectedUser.id);
        }
    }, [selectedUser, selectedTab, fetchUserRatings, fetchUserLeaders]);


    const TableSkeleton = () => (
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Joined On</TableHead>
                        <TableHead className="text-center">Ratings</TableHead>
                        <TableHead className="text-center">Leaders Added</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell>
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-40" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>Search for registered users in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                        <Input
                            placeholder="Search by name, email, or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="max-w-sm"
                        />
                        <Button onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Search
                        </Button>
                        <Button onClick={handleReset} variant="outline" size="icon" disabled={isLoading}>
                            <RotateCw className="h-4 w-4" />
                            <span className="sr-only">Reset search</span>
                        </Button>
                    </div>
                    
                    {isLoading ? <TableSkeleton /> : hasSearched ? (
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Joined On</TableHead>
                                        <TableHead className="text-center">Ratings</TableHead>
                                        <TableHead className="text-center">Leaders Added</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.length > 0 ? (
                                        users.map((user: UserWithCounts) => (
                                            <TableRow 
                                                key={user.id}
                                                className={cn("cursor-pointer", selectedUser?.id === user.id && "bg-secondary")}
                                            >
                                                <TableCell onClick={() => handleSelectUser(user, 'profile')}>
                                                    <div className="font-medium hover:text-primary hover:underline">{user.name || 'N/A'}</div>
                                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                                    <div className="text-xs text-muted-foreground/70">ID: {user.id}</div>
                                                </TableCell>
                                                <TableCell onClick={() => handleSelectUser(user, 'profile')}>
                                                    {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}
                                                </TableCell>
                                                <TableCell 
                                                    className="text-center font-medium hover:text-primary hover:underline"
                                                    onClick={() => handleSelectUser(user, 'ratings')}
                                                >
                                                    {user.ratingCount}
                                                </TableCell>
                                                <TableCell 
                                                    className="text-center font-medium hover:text-primary hover:underline"
                                                    onClick={() => handleSelectUser(user, 'leaders')}
                                                >
                                                    {user.leaderAddedCount}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                No users found matching your search.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-16 px-4 rounded-lg bg-secondary border-2 border-dashed border-border">
                            <h3 className="text-lg font-semibold">Search for Users</h3>
                            <p className="mt-2 text-muted-foreground">
                                Enter a name, email, or user ID to begin your search.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            {selectedUser && (
                <Card className="animate-in fade-in-0">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>User Details</CardTitle>
                            <CardDescription>Full profile and activity for {selectedUser.name}.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)}>
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close user details</span>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as SelectedTab)} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="profile">Profile Details</TabsTrigger>
                                <TabsTrigger value="ratings">Ratings ({selectedUser.ratingCount})</TabsTrigger>
                                <TabsTrigger value="leaders">Leaders Added ({selectedUser.leaderAddedCount})</TabsTrigger>
                            </TabsList>
                            <TabsContent value="profile" className="mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                                    <ProfileInfo label="Name" value={selectedUser.name} />
                                    <ProfileInfo label="Email" value={selectedUser.email} />
                                    <ProfileInfo label="User ID" value={selectedUser.id} />
                                    <ProfileInfo label="Gender" value={selectedUser.gender} />
                                    <ProfileInfo label="Age" value={selectedUser.age} />
                                    <ProfileInfo label="Joined On" value={selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'} />
                                </div>
                                <Separator className="my-4" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                    <ProfileInfo label="State" value={selectedUser.state} />
                                    <ProfileInfo label="MP Constituency" value={selectedUser.mpConstituency} />
                                    <ProfileInfo label="MLA Constituency" value={selectedUser.mlaConstituency} />
                                    <ProfileInfo label="Panchayat / Corporation" value={selectedUser.panchayat} />
                                </div>
                            </TabsContent>
                            <TabsContent value="ratings" className="mt-4">
                                {isDetailsLoading ? <p>Loading ratings...</p> : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Leader</TableHead>
                                                <TableHead>Rating</TableHead>
                                                <TableHead>Comment</TableHead>
                                                <TableHead className="text-right">Date</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                        {userActivities.length > 0 ? userActivities.map(activity => (
                                            <TableRow key={activity.leaderId}>
                                                <TableCell>{activity.leaderName}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                        {activity.rating}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate">{activity.comment || 'N/A'}</TableCell>
                                                <TableCell className="text-right">{new Date(activity.updatedAt).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        )) : <TableRow><TableCell colSpan={4} className="text-center h-24">This user has not submitted any ratings.</TableCell></TableRow>}
                                        </TableBody>
                                    </Table>
                                )}
                            </TabsContent>
                            <TabsContent value="leaders" className="mt-4">
                                {isDetailsLoading ? <p>Loading leaders...</p> : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Leader</TableHead>
                                                <TableHead>Constituency</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Date Added</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {userAddedLeaders.length > 0 ? userAddedLeaders.map(leader => (
                                                <TableRow key={leader.id}>
                                                    <TableCell className="font-medium">{leader.name}</TableCell>
                                                    <TableCell>{leader.constituency}</TableCell>
                                                    <TableCell className="capitalize">{leader.status}</TableCell>
                                                    <TableCell className="text-right">{leader.createdAt ? new Date(leader.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                                                </TableRow>
                                            )) : <TableRow><TableCell colSpan={4} className="text-center h-24">This user has not added any leaders.</TableCell></TableRow>}
                                        </TableBody>
                                    </Table>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            )}

        </div>
    );
}
