
'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { addDays } from 'date-fns';

import { getUsers, type User, blockUser, unblockUser, addAdminMessage, getAdminMessages, deleteAdminMessage, type AdminMessage } from "@/data/users";
import { getActivitiesForUser, getLeadersAddedByUser, type UserActivity, type Leader } from "@/data/leaders";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, RotateCw, X, Star, MoreVertical, Ban, Unlock, MessageSquareWarning, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';


// The User type from the data layer will include these optional counts
type UserWithCounts = User & {
    ratingCount?: number;
    leaderAddedCount?: number;
};

type SelectedTab = 'profile' | 'ratings' | 'leaders' | 'messages';

const blockFormSchema = z.object({
  durationType: z.enum(['temporary', 'permanent']),
  days: z.coerce.number().int().positive().optional(),
  reason: z.string().min(10, { message: "Reason must be at least 10 characters." }),
}).refine(data => {
  if (data.durationType === 'temporary') {
    return data.days !== undefined && data.days > 0;
  }
  return true;
}, {
  message: "Number of days is required for a temporary block.",
  path: ['days'],
});

const messageFormSchema = z.object({
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
});

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
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [selectedTab, setSelectedTab] = useState<SelectedTab>('profile');
    const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
    const [userAddedLeaders, setUserAddedLeaders] = useState<Leader[]>([]);
    const [userAdminMessages, setUserAdminMessages] = useState<AdminMessage[]>([]);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);
    
    const [isBlockUserDialogOpen, setBlockUserDialogOpen] = useState(false);
    const [isSendMessageDialogOpen, setSendMessageDialogOpen] = useState(false);

    const blockUserForm = useForm<z.infer<typeof blockFormSchema>>({
      resolver: zodResolver(blockFormSchema),
      defaultValues: { durationType: 'temporary', reason: "" },
    });
    
    const sendMessageForm = useForm<z.infer<typeof messageFormSchema>>({
      resolver: zodResolver(messageFormSchema),
      defaultValues: { message: "" },
    });
    
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
        if (selectedUser?.id === user.id) {
          // If already selected, just switch tab
          setSelectedTab(tab);
        } else {
          // If new user selected, reset everything
          setSelectedUser(user);
          setSelectedTab(tab);
          setUserActivities([]);
          setUserAddedLeaders([]);
          setUserAdminMessages([]);
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

    const fetchUserAdminMessages = useCallback(async (userId: string) => {
        setIsDetailsLoading(true);
        const messages = await getAdminMessages(userId);
        setUserAdminMessages(messages);
        setIsDetailsLoading(false);
    }, []);
    
    useEffect(() => {
        if (selectedUser) {
            if (selectedTab === 'ratings') fetchUserRatings(selectedUser.id);
            if (selectedTab === 'leaders') fetchUserLeaders(selectedUser.id);
            if (selectedTab === 'messages') fetchUserAdminMessages(selectedUser.id);
        }
    }, [selectedUser, selectedTab, fetchUserRatings, fetchUserLeaders, fetchUserAdminMessages]);

    const handleUnblockUser = () => {
      if (!selectedUser) return;
      startTransition(async () => {
        await unblockUser(selectedUser.id);
        toast({ title: "User Unblocked", description: `${selectedUser.name} can now access the platform again.` });
        const updatedUser = { ...selectedUser, isBlocked: false, blockReason: null, blockedUntil: null };
        setSelectedUser(updatedUser);
        setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u));
      });
    }

    const onBlockUserSubmit = (values: z.infer<typeof blockFormSchema>) => {
      if (!selectedUser) return;
      startTransition(async () => {
        try {
          const blockUntil = values.durationType === 'temporary'
            ? addDays(new Date(), values.days!).toISOString()
            : null;
          
          await blockUser(selectedUser.id, values.reason, blockUntil);

          toast({ title: "User Blocked", description: `${selectedUser.name} has been blocked.` });
          setBlockUserDialogOpen(false);
          blockUserForm.reset();

          const updatedUser = { ...selectedUser, isBlocked: true, blockReason: values.reason, blockedUntil };
          setSelectedUser(updatedUser);
          setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u));
        } catch (error) {
          toast({ variant: 'destructive', title: "Failed to block user", description: String(error) });
        }
      });
    }

    const onSendMessageSubmit = (values: z.infer<typeof messageFormSchema>) => {
      if (!selectedUser) return;
      startTransition(async () => {
        await addAdminMessage(selectedUser.id, values.message);
        toast({ title: "Message Sent", description: "The message has been sent to the user." });
        setSendMessageDialogOpen(false);
        sendMessageForm.reset();
        // Optionally refresh messages if the tab is active
        if (selectedTab === 'messages') {
          fetchUserAdminMessages(selectedUser.id);
        }
      });
    }
    
    const handleDeleteMessage = (messageId: string) => {
        if (!selectedUser) return;
        startTransition(async () => {
            await deleteAdminMessage(messageId);
            toast({ title: "Message Deleted" });
            fetchUserAdminMessages(selectedUser.id);
        });
    }

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
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Search for registered users and perform administrative actions.</CardDescription>
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
                        <Button onClick={handleSearch} disabled={isLoading || isPending}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Search
                        </Button>
                        <Button onClick={handleReset} variant="outline" size="icon" disabled={isLoading || isPending}>
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
                                                    <div className="flex items-center gap-2">
                                                      <span className="font-medium hover:text-primary hover:underline">{user.name || 'N/A'}</span>
                                                      {user.isBlocked ? <Badge variant="destructive">Blocked</Badge> : null}
                                                    </div>
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
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="profile">Profile</TabsTrigger>
                                <TabsTrigger value="ratings">Ratings ({selectedUser.ratingCount})</TabsTrigger>
                                <TabsTrigger value="leaders">Leaders Added ({selectedUser.leaderAddedCount})</TabsTrigger>
                                <TabsTrigger value="messages">Admin Messages</TabsTrigger>
                            </TabsList>
                            <TabsContent value="profile" className="mt-4">
                                {selectedUser.isBlocked ? (
                                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive mb-4">
                                    <h4 className="font-bold flex items-center gap-2"><Ban /> User Blocked</h4>
                                    <p className="text-sm mt-2"><strong>Reason:</strong> {selectedUser.blockReason}</p>
                                    <p className="text-sm"><strong>Blocked Until:</strong> {selectedUser.blockedUntil ? new Date(selectedUser.blockedUntil).toLocaleString() : 'Permanent'}</p>
                                  </div>
                                ) : null}
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
                            <TabsContent value="messages" className="mt-4">
                                {isDetailsLoading ? <p>Loading messages...</p> : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Message</TableHead>
                                                <TableHead>Sent On</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {userAdminMessages.length > 0 ? userAdminMessages.map(message => (
                                                <TableRow key={message.id}>
                                                    <TableCell className="max-w-md break-words">{message.message}</TableCell>
                                                    <TableCell>{new Date(message.createdAt).toLocaleString()}</TableCell>
                                                    <TableCell>{message.isRead ? 'Read' : 'Unread'}</TableCell>
                                                    <TableCell className="text-right">
                                                        <AlertDialog>
                                                          <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" disabled={isPending}>
                                                              <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                          </AlertDialogTrigger>
                                                          <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                              <AlertDialogTitle>Delete this message?</AlertDialogTitle>
                                                              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                              <AlertDialogAction onClick={() => handleDeleteMessage(message.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                          </AlertDialogContent>
                                                        </AlertDialog>
                                                    </TableCell>
                                                </TableRow>
                                            )) : <TableRow><TableCell colSpan={4} className="text-center h-24">No messages have been sent to this user.</TableCell></TableRow>}
                                        </TableBody>
                                    </Table>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" disabled={isPending}>
                            <MoreVertical className="mr-2 h-4 w-4" />
                             Admin Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Moderation</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {selectedUser.isBlocked ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Unlock className="mr-2 h-4 w-4" />
                                    Unblock User
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Unblock {selectedUser.name}?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will allow the user to access the platform again. Are you sure?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleUnblockUser}>Confirm Unblock</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                          ) : (
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setBlockUserDialogOpen(true); }}>
                              <Ban className="mr-2 h-4 w-4" />
                              Block User
                            </DropdownMenuItem>
                          )}
                           <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSendMessageDialogOpen(true); }}>
                            <MessageSquareWarning className="mr-2 h-4 w-4" />
                            Send Warning/Message
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardFooter>
                </Card>
            )}

            {/* Block User Dialog */}
            <Dialog open={isBlockUserDialogOpen} onOpenChange={setBlockUserDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Block User: {selectedUser?.name}</DialogTitle>
                  <DialogDescription>
                    Select the duration and provide a reason for blocking this user. This action can be reversed later.
                  </DialogDescription>
                </DialogHeader>
                <Form {...blockUserForm}>
                  <form onSubmit={blockUserForm.handleSubmit(onBlockUserSubmit)} className="space-y-4">
                    <FormField
                      control={blockUserForm.control}
                      name="durationType"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Block Duration</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="temporary" />
                                </FormControl>
                                <FormLabel className="font-normal">Temporary</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="permanent" />
                                </FormControl>
                                <FormLabel className="font-normal">Permanent</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {blockUserForm.watch('durationType') === 'temporary' && (
                       <FormField
                          control={blockUserForm.control}
                          name="days"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Days</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="e.g., 30" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    )}
                    <FormField
                      control={blockUserForm.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason for Blocking (Required)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Explain why this user is being blocked..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                      <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Block
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Send Message Dialog */}
            <Dialog open={isSendMessageDialogOpen} onOpenChange={setSendMessageDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Message to: {selectedUser?.name}</DialogTitle>
                  <DialogDescription>
                    Compose a warning or message for this user. This will be logged for administrative review.
                  </DialogDescription>
                </DialogHeader>
                <Form {...sendMessageForm}>
                  <form onSubmit={sendMessageForm.handleSubmit(onSendMessageSubmit)} className="space-y-4">
                    <FormField
                        control={sendMessageForm.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Type your message here..." {...field} rows={6} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    <DialogFooter>
                      <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                      <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Message
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

        </div>
    );
}
