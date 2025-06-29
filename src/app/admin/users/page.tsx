
'use client';

import { useState, useEffect } from 'react';
import { getUsers, type User } from "@/data/users";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// The User type from the data layer will include these optional counts
type UserWithCounts = User & {
    ratingCount?: number;
    leaderAddedCount?: number;
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserWithCounts[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);

    const fetchUsers = async (query?: string) => {
        if (!query) setIsLoading(true);
        else setIsSearching(true);

        const fetchedUsers = await getUsers(query);
        setUsers(fetchedUsers as UserWithCounts[]);

        if (!query) setIsLoading(false);
        else setIsSearching(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSearch = () => {
        fetchUsers(searchTerm);
    };
    
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    };
    
    const TableSkeleton = () => (
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>State</TableHead>
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
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
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
        <Card>
            <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>A list of all registered users in the system.</CardDescription>
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
                    <Button onClick={handleSearch} disabled={isSearching}>
                        {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Search
                    </Button>
                </div>
                
                {isLoading ? <TableSkeleton /> : (
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>State</TableHead>
                                    <TableHead>Joined On</TableHead>
                                    <TableHead className="text-center">Ratings</TableHead>
                                    <TableHead className="text-center">Leaders Added</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length > 0 ? (
                                    users.map((user: UserWithCounts) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="font-medium">{user.name || 'N/A'}</div>
                                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                                <div className="text-xs text-muted-foreground/70">ID: {user.id}</div>
                                            </TableCell>
                                            <TableCell>{user.state || 'N/A'}</TableCell>
                                            <TableCell>
                                                {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-center font-medium">{user.ratingCount}</TableCell>
                                            <TableCell className="text-center font-medium">{user.leaderAddedCount}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
