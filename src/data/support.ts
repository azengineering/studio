
'use server';

<<<<<<< HEAD
import { supabaseAdmin, handleSupabaseError } from '@/lib/db';
import { getSiteSettings } from './settings';
=======
import { supabase } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd

export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';

export interface SupportTicket {
    id: string;
    user_id: string | null;
    user_name: string;
    user_email: string;
    subject: string;
    message: string;
    status: TicketStatus;
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
    admin_notes: string | null;
}

export interface SupportTicketStats {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    avgResolutionHours: number | null;
}

<<<<<<< HEAD
export async function createSupportTicket(data: Omit<SupportTicket, 'id' | 'status' | 'created_at' | 'resolved_at' | 'admin_notes' | 'updated_at'>): Promise<void> {
    const { error } = await supabaseAdmin.from('support_tickets').insert(data);
    if (error) handleSupabaseError({data: null, error}, 'createSupportTicket');
=======

export async function createSupportTicket(data: Omit<SupportTicket, 'id' | 'status' | 'created_at' | 'resolved_at' | 'admin_notes' | 'updated_at'>): Promise<void> {
    const { error } = await supabase.from('support_tickets').insert({
        ...data,
        status: 'open',
    });
    
    if (error) {
        console.error("Error creating support ticket:", error);
        throw error;
    }
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
}

export async function getSupportTickets(filters: { status?: TicketStatus, dateFrom?: string, dateTo?: string, searchQuery?: string } = {}): Promise<SupportTicket[]> {
    let query = supabaseAdmin.from('support_tickets').select('*');

<<<<<<< HEAD
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
    if (filters.dateTo) query = query.lte('created_at', filters.dateTo);
    if (filters.searchQuery) {
        query = query.or(`user_name.ilike.%${filters.searchQuery}%,user_email.ilike.%${filters.searchQuery}%`);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });
    return handleSupabaseError({data, error}, 'getSupportTickets') || [];
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus, adminNotes: string | null): Promise<void> {
    const updatePayload: Partial<SupportTicket> = {
        status: status,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString()
    };
    if (status === 'resolved' || status === 'closed') {
        updatePayload.resolved_at = new Date().toISOString();
    }
    const { error } = await supabaseAdmin
        .from('support_tickets')
        .update(updatePayload)
        .eq('id', ticketId);
    
    if (error) handleSupabaseError({data: null, error}, 'updateTicketStatus');
}

export async function getSupportTicketStats(): Promise<SupportTicketStats> {
    const { data: stats, error } = await supabaseAdmin.rpc('get_ticket_stats');
    const settings = await getSiteSettings();

    if (error || !stats) {
        console.error("Error fetching ticket stats:", error?.message);
        return { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, avgResolutionHours: null, ...settings };
    }
    
    const result = stats[0];
    return {
        total: result.total_tickets,
        open: result.open_tickets,
        inProgress: result.inprogress_tickets,
        resolved: result.resolved_tickets,
        closed: result.closed_tickets,
        avgResolutionHours: result.avg_resolution_hours,
        ...settings,
    };
=======
    if (filters.status) {
        query = query.eq('status', filters.status);
    }
    if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
    }
    if (filters.searchQuery) {
        const searchTerm = `%${filters.searchQuery}%`;
        query = query.or(`user_name.ilike.${searchTerm},user_email.ilike.${searchTerm},subject.ilike.${searchTerm}`);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) {
        console.error("Error fetching support tickets:", error);
        return [];
    }
    return data;
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus, adminNotes: string | null): Promise<void> {
    const { error } = await supabaseAdmin
        .from('support_tickets')
        .update({
            status: status,
            admin_notes: adminNotes,
            resolved_at: (status === 'resolved' || status === 'closed') ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

    if (error) {
        console.error("Error updating ticket status:", error);
        throw error;
    }
}

export async function getSupportTicketStats(): Promise<SupportTicketStats> {
    const { data, error } = await supabaseAdmin.rpc('get_ticket_stats');

    if (error) {
        console.error("Error fetching ticket stats:", error);
        throw error;
    }

    return {
        total: data[0].total,
        open: data[0].open,
        inProgress: data[0].in_progress,
        resolved: data[0].resolved,
        closed: data[0].closed,
        avgResolutionHours: data[0].avg_resolution_hours,
    }
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
}
