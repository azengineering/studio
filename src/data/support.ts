
'use server';

import { db } from '@/lib/db';
import type { User } from './users';

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

const dbToTicket = (row: any): SupportTicket => ({
    ...row,
    resolved_at: row.resolved_at || null,
    admin_notes: row.admin_notes || null,
});

export async function createSupportTicket(data: Omit<SupportTicket, 'id' | 'status' | 'created_at' | 'resolved_at' | 'admin_notes' | 'updated_at'>): Promise<void> {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
        INSERT INTO support_tickets (id, user_id, user_name, user_email, subject, message, status, created_at, updated_at)
        VALUES (@id, @user_id, @user_name, @user_email, @subject, @message, 'open', @created_at, @updated_at)
    `);
    
    stmt.run({
        id: new Date().getTime().toString(),
        user_id: data.user_id,
        user_name: data.user_name,
        user_email: data.user_email,
        subject: data.subject,
        message: data.message,
        created_at: now,
        updated_at: now,
    });
}

export async function getSupportTickets(filters: { status?: TicketStatus, dateFrom?: string, dateTo?: string } = {}): Promise<SupportTicket[]> {
    let query = 'SELECT * FROM support_tickets';
    const params: string[] = [];
    const conditions: string[] = [];

    if (filters.status) {
        conditions.push('status = ?');
        params.push(filters.status);
    }
    if (filters.dateFrom && filters.dateTo) {
        conditions.push('created_at >= ? AND created_at <= ?');
        params.push(filters.dateFrom, filters.dateTo);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];

    // This simulates a cron job that would otherwise run on the server to clean up old tickets.
    // We filter out old tickets here to keep the admin UI clean and performant.
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const activeTickets = rows.filter(ticket => {
        const isOldAndClosed = (ticket.status === 'resolved' || ticket.status === 'closed') &&
                               ticket.resolved_at &&
                               ticket.resolved_at < thirtyDaysAgo;
        return !isOldAndClosed;
    });
    
    return activeTickets.map(dbToTicket);
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus, adminNotes: string | null): Promise<void> {
    const stmt = db.prepare(`
        UPDATE support_tickets
        SET status = @status, 
            admin_notes = @admin_notes, 
            resolved_at = @resolved_at,
            updated_at = @updated_at
        WHERE id = @id
    `);
    
    stmt.run({
        id: ticketId,
        status: status,
        admin_notes: adminNotes,
        resolved_at: (status === 'resolved' || status === 'closed') ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
    });
}
