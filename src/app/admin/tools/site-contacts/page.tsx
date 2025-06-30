
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { getSiteSettings, updateSiteSettings, type SiteSettings } from '@/data/settings';
import { getSupportTickets, updateTicketStatus, type SupportTicket, type TicketStatus } from '@/data/support';
import { useToast } from '@/hooks/use-toast';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Loader2, Save, Mail, Eye, Inbox, History, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const contactFormSchema = z.object({
  contact_email: z.string().email().or(z.literal('')),
  contact_phone: z.string().optional(),
  contact_twitter: z.string().url().or(z.literal('')),
  contact_linkedin: z.string().url().or(z.literal('')),
  contact_youtube: z.string().url().or(z.literal('')),
});

type ContactFormData = z.infer<typeof contactFormSchema>;
type settableSiteSettings = Omit<SiteSettings, 'maintenance_active' | 'maintenance_start' | 'maintenance_end' | 'maintenance_message'>;

export default function SiteContactsPage() {
    const router = useRouter();
    const { toast } = useToast();

    // State for tickets
    const [openTickets, setOpenTickets] = useState<SupportTicket[]>([]);
    const [inProgressTickets, setInProgressTickets] = useState<SupportTicket[]>([]);
    const [resolvedTickets, setResolvedTickets] = useState<SupportTicket[]>([]);
    const [closedTickets, setClosedTickets] = useState<SupportTicket[]>([]);
    const [isLoadingTickets, setIsLoadingTickets] = useState(true);

    // State for ticket dialog
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [isUpdatingTicket, setIsUpdatingTicket] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<TicketStatus>('open');

    // State for contact info
    const [isSavingContacts, setIsSavingContacts] = useState(false);

    const contactForm = useForm<ContactFormData>({
        resolver: zodResolver(contactFormSchema),
        defaultValues: {
            contact_email: '', contact_phone: '', contact_twitter: '', contact_linkedin: '', contact_youtube: ''
        },
    });

    const fetchTickets = async () => {
        setIsLoadingTickets(true);
        const allTickets = await getSupportTickets();
        setOpenTickets(allTickets.filter(t => t.status === 'open'));
        setInProgressTickets(allTickets.filter(t => t.status === 'in-progress'));
        setResolvedTickets(allTickets.filter(t => t.status === 'resolved'));
        setClosedTickets(allTickets.filter(t => t.status === 'closed'));
        setIsLoadingTickets(false);
    };

    const fetchContactInfo = async () => {
        const settings = await getSiteSettings();
        contactForm.reset({
            contact_email: settings.contact_email || '',
            contact_phone: settings.contact_phone || '',
            contact_twitter: settings.contact_twitter || '',
            contact_linkedin: settings.contact_linkedin || '',
            contact_youtube: settings.contact_youtube || '',
        });
    };

    useEffect(() => {
        fetchTickets();
        fetchContactInfo();
    }, []);

    const onContactSubmit = async (data: ContactFormData) => {
        setIsSavingContacts(true);
        try {
            await updateSiteSettings(data as settableSiteSettings);
            toast({ title: "Contact Information Saved" });
        } catch (error) {
            toast({ variant: 'destructive', title: "Save Failed", description: "Could not update contact information." });
        } finally {
            setIsSavingContacts(false);
        }
    };

    const handleViewTicket = (ticket: SupportTicket) => {
        setSelectedTicket(ticket);
        setAdminNotes(ticket.admin_notes || '');
        setSelectedStatus(ticket.status);
    };
    
    const handleUpdateTicket = async () => {
        if (!selectedTicket) return;
        setIsUpdatingTicket(true);
        try {
            await updateTicketStatus(selectedTicket.id, selectedStatus, adminNotes);
            toast({ title: 'Ticket Updated' });
            setSelectedTicket(null);
            await fetchTickets();
        } catch (error) {
            toast({ variant: 'destructive', title: "Update Failed", description: "Could not update the ticket status." });
        } finally {
            setIsUpdatingTicket(false);
        }
    }
    
    const statusConfig: Record<TicketStatus, { variant: 'destructive' | 'secondary' | 'default' | 'outline', icon: React.ElementType, name: string }> = {
        'open': { variant: 'destructive', icon: Inbox, name: 'Open' },
        'in-progress': { variant: 'secondary', icon: History, name: 'In Progress' },
        'resolved': { variant: 'default', icon: CheckCircle, name: 'Resolved' },
        'closed': { variant: 'outline', icon: XCircle, name: 'Closed' }
    };
    
    const TicketTable = ({ tickets }: { tickets: SupportTicket[] }) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tickets.length > 0 ? tickets.map(ticket => (
                    <TableRow key={ticket.id}>
                        <TableCell><div className="font-medium">{ticket.user_name}</div><div className="text-sm text-muted-foreground">{ticket.user_email}</div></TableCell>
                        <TableCell>{ticket.subject}</TableCell>
                        <TableCell>{format(new Date(ticket.created_at), 'PPP')}</TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleViewTicket(ticket)}><Eye className="h-4 w-4"/></Button>
                        </TableCell>
                    </TableRow>
                )) : <TableRow><TableCell colSpan={4} className="h-24 text-center">No tickets in this category.</TableCell></TableRow>}
            </TableBody>
        </Table>
    );

    const TableSkeleton = () => (
         <div className="border rounded-md p-4"><div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div></div>
    );
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold font-headline">Contact Management</h1>
                <Button variant="outline" onClick={() => router.back()}><ChevronLeft className="mr-2 h-4 w-4" />Back to Tools</Button>
            </div>
            <Tabs defaultValue="tickets">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
                    <TabsTrigger value="info">Contact Information</TabsTrigger>
                </TabsList>
                
                <TabsContent value="tickets" className="mt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>User Support Tickets</CardTitle>
                            <CardDescription>Manage and respond to all user-submitted inquiries.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Tabs defaultValue="open">
                                <TabsList className="grid w-full grid-cols-4">
                                     <TabsTrigger value="open">
                                        <Inbox className="mr-2 h-4 w-4"/>Open <Badge variant="secondary" className="ml-2">{openTickets.length}</Badge>
                                    </TabsTrigger>
                                    <TabsTrigger value="in-progress">
                                        <History className="mr-2 h-4 w-4"/>In Progress <Badge variant="secondary" className="ml-2">{inProgressTickets.length}</Badge>
                                    </TabsTrigger>
                                    <TabsTrigger value="resolved">
                                        <CheckCircle className="mr-2 h-4 w-4"/>Resolved <Badge variant="secondary" className="ml-2">{resolvedTickets.length}</Badge>
                                    </TabsTrigger>
                                    <TabsTrigger value="closed">
                                        <XCircle className="mr-2 h-4 w-4"/>Closed <Badge variant="secondary" className="ml-2">{closedTickets.length}</Badge>
                                    </TabsTrigger>
                                </TabsList>
                                <div className="mt-4">
                                     {isLoadingTickets ? <TableSkeleton /> : (
                                        <>
                                            <TabsContent value="open"><TicketTable tickets={openTickets} /></TabsContent>
                                            <TabsContent value="in-progress"><TicketTable tickets={inProgressTickets} /></TabsContent>
                                            <TabsContent value="resolved"><TicketTable tickets={resolvedTickets} /></TabsContent>
                                            <TabsContent value="closed"><TicketTable tickets={closedTickets} /></TabsContent>
                                        </>
                                    )}
                                </div>
                             </Tabs>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="info" className="mt-6">
                    <Form {...contactForm}>
                    <form onSubmit={contactForm.handleSubmit(onContactSubmit)}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Mail/> Public Contact Information</CardTitle>
                                <CardDescription>This information will be displayed on the public "Contact Us" page.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField control={contactForm.control} name="contact_email" render={({ field }) => (<FormItem><FormLabel>Support Email</FormLabel><FormControl><Input {...field} placeholder="support@example.com"/></FormControl><FormMessage/></FormItem>)}/>
                                <FormField control={contactForm.control} name="contact_phone" render={({ field }) => (<FormItem><FormLabel>Support Phone (Optional)</FormLabel><FormControl><Input {...field} placeholder="+91 12345 67890"/></FormControl><FormMessage/></FormItem>)}/>
                                <FormField control={contactForm.control} name="contact_twitter" render={({ field }) => (<FormItem><FormLabel>X/Twitter URL (Optional)</FormLabel><FormControl><Input {...field} placeholder="https://x.com/yourhandle"/></FormControl><FormMessage/></FormItem>)}/>
                                <FormField control={contactForm.control} name="contact_linkedin" render={({ field }) => (<FormItem><FormLabel>LinkedIn URL (Optional)</FormLabel><FormControl><Input {...field} placeholder="https://linkedin.com/in/yourprofile"/></FormControl><FormMessage/></FormItem>)}/>
                                <FormField control={contactForm.control} name="contact_youtube" render={({ field }) => (<FormItem><FormLabel>YouTube Channel URL (Optional)</FormLabel><FormControl><Input {...field} placeholder="https://youtube.com/c/yourchannel"/></FormControl><FormMessage/></FormItem>)}/>
                            </CardContent>
                            <CardFooter className="flex justify-end">
                                <Button type="submit" disabled={isSavingContacts}>{isSavingContacts ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2"/>}Save Information</Button>
                            </CardFooter>
                        </Card>
                    </form>
                    </Form>
                </TabsContent>
            </Tabs>
            
            <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Ticket from: {selectedTicket?.user_name}</DialogTitle>
                        <DialogDescription>Subject: {selectedTicket?.subject}</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="p-4 bg-secondary rounded-lg border">
                            <Label className="font-semibold">User's Message</Label>
                            <p className="text-sm mt-1">{selectedTicket?.message}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as TicketStatus)}>
                                    <SelectTrigger>
                                        <span className="flex items-center gap-2">
                                            {React.createElement(statusConfig[selectedStatus].icon, { className: "h-4 w-4" })}
                                            <span className="capitalize">{statusConfig[selectedStatus].name}</span>
                                        </span>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(statusConfig).map(([status, { icon, name }]) => (
                                            <SelectItem key={status} value={status}>
                                                <span className="flex items-center gap-2">
                                                    {React.createElement(icon, { className: "h-4 w-4" })}
                                                    <span className="capitalize">{name}</span>
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Admin Notes (internal)</Label>
                            <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={4} placeholder="Add notes about this ticket..."/>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setSelectedTicket(null)}>Cancel</Button>
                        <Button onClick={handleUpdateTicket} disabled={isUpdatingTicket}>
                            {isUpdatingTicket && <Loader2 className="animate-spin mr-2"/>} Update Ticket
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
