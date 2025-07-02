
'use server';

import { supabase } from '@/lib/db';

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
    contact_email: string | null;
    contact_phone: string | null;
    contact_twitter: string | null;
    contact_linkedin: string | null;
    contact_youtube: string | null;
}


export async function createSupportTicket(data: Omit<SupportTicket, 'id' | 'status' | 'created_at' | 'resolved_at' | 'admin_notes' | 'updated_at'>): Promise<void> {
    const { error } = await supabase.from('support_tickets').insert({
        ...data,
        status: 'open',
    });
    
    if (error) {
        console.error("Error creating support ticket:", error);
        throw error;
    }
}

export async function getSupportTickets(filters: { status?: TicketStatus, dateFrom?: string, dateTo?: string, searchQuery?: string } = {}): Promise<SupportTicket[]> {
    let query = supabase.from('support_tickets').select('*');

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
        query = query.or(`user_name.ilike.${searchTerm},user_email.ilike.${searchTerm}`);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) {
        console.error("Error fetching support tickets:", error);
        return [];
    }
    return data;
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus, adminNotes: string | null): Promise<void> {
    const { error } = await supabase
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
    const { data: stats, error: statsError } = await supabase.rpc('get_ticket_stats');

    if (statsError) {
        console.error("Error fetching ticket stats:", statsError);
        throw statsError;
    }

    const { data: settings, error: settingsError } = await supabase
        .from('site_settings')
        .select('contact_email, contact_phone, contact_twitter, contact_linkedin, contact_youtube')
        .single();
    
    if (settingsError) {
        console.error("Error fetching contact settings for stats:", settingsError);
    }

    return {
        total: stats.total,
        open: stats.open,
        inProgress: stats.in_progress,
        resolved: stats.resolved,
        closed: stats.closed,
        avgResolutionHours: stats.avg_resolution_hours,
        ...settings
    }
}
