
'use client';

import { useState, useEffect } from 'react';
import { getUsers, type User } from "@/data/users";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, RotateCw, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// The User type from the data layer will include these optional counts
type UserWithCounts = User & {
    ratingCount?: number;
    leaderAddedCount?: number;
};

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

    const fetchUsers = async (query?: string) => {
        setIsLoading(true);
        setSelectedUser(null); // Clear selection on new search
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
                                                onClick={() => setSelectedUser(user)}
                                                className={cn("cursor-pointer", selectedUser?.id === user.id && "bg-secondary")}
                                            >
                                                <TableCell>
                                                    <div className="font-medium">{user.name || 'N/A'}</div>
                                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                                    <div className="text-xs text-muted-foreground/70">ID: {user.id}</div>
                                                </TableCell>
                                                <TableCell>
                                                    {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-center font-medium">{user.ratingCount}</TableCell>
                                                <TableCell className="text-center font-medium">{user.leaderAddedCount}</TableCell>
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
                            <CardDescription>Full profile information for {selectedUser.name}.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)}>
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close user details</span>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                            <ProfileInfo label="Name" value={selectedUser.name} />
                            <ProfileInfo label="Email" value={selectedUser.email} />
                            <ProfileInfo label="User ID" value={selectedUser.id} />
                            <ProfileInfo label="Gender" value={selectedUser.gender} />
                            <ProfileInfo label="Age" value={selectedUser.age} />
                             <ProfileInfo label="Joined On" value={selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'} />
                        </div>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <ProfileInfo label="State" value={selectedUser.state} />
                            <ProfileInfo label="MP Constituency" value={selectedUser.mpConstituency} />
                            <ProfileInfo label="MLA Constituency" value={selectedUser.mlaConstituency} />
                            <ProfileInfo label="Panchayat / Corporation" value={selectedUser.panchayat} />
                        </div>
                    </CardContent>
                </Card>
            )}

        </div>
    );
}
