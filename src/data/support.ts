
'use server';

import { db, convertFirestoreData } from '@/lib/db';
import { FieldValue } from 'firebase-admin/firestore';

export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';

export interface SupportTicket {
    id: string;
    user_id: string | null;
    user_name: string;
    user_email: string;
    subject: string;
    message: string;
    status: TicketStatus;
    created_at: any;
    updated_at: any;
    resolved_at: any | null;
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
    const ticketRef = db.collection('support_tickets').doc();
    const now = FieldValue.serverTimestamp();
    await ticketRef.set({
        ...data,
        status: 'open',
        admin_notes: null,
        resolved_at: null,
        created_at: now,
        updated_at: now,
    });
}

export async function getSupportTickets(filters: { status?: TicketStatus, dateFrom?: string, dateTo?: string, searchQuery?: string } = {}): Promise<SupportTicket[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oldTicketsSnapshot = await db.collection('support_tickets')
        .where('status', 'in', ['in-progress', 'resolved', 'closed'])
        .where('updated_at', '<', thirtyDaysAgo)
        .get();
        
    if (!oldTicketsSnapshot.empty) {
        const batch = db.batch();
        oldTicketsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    }

    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('support_tickets');

    if (filters.status) {
        query = query.where('status', '==', filters.status);
    }
    if (filters.dateFrom && filters.dateTo) {
        query = query.where('created_at', '>=', new Date(filters.dateFrom)).where('created_at', '<=', new Date(filters.dateTo));
    }
    if (filters.searchQuery) {
        // Simple search on one field. For more complex search, use a dedicated service.
        query = query.orderBy('user_email').startAt(filters.searchQuery).endAt(filters.searchQuery + '\uf8ff');
    } else {
        query = query.orderBy('updated_at', 'desc');
    }

    const snapshot = await query.get();
    const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as SupportTicket);
    return convertFirestoreData(tickets);
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus, adminNotes: string | null): Promise<void> {
    const ticketRef = db.collection('support_tickets').doc(ticketId);
    await ticketRef.update({
        status: status,
        admin_notes: adminNotes,
        resolved_at: (status === 'resolved' || status === 'closed') ? FieldValue.serverTimestamp() : null,
        updated_at: FieldValue.serverTimestamp(),
    });
}

export async function getSupportTicketStats(): Promise<SupportTicketStats> {
    const collectionRef = db.collection('support_tickets');
    const countsSnapshot = await collectionRef.aggregate({
        open: { 'count': 'open' },
        inProgress: { 'count': 'in-progress' },
        resolved: { 'count': 'resolved' },
        closed: { 'count': 'closed' },
        total: { 'count': '*' }
    }).get();
    
    // Firestore aggregation by status is more complex. A simpler way for this app:
    const open = (await collectionRef.where('status', '==', 'open').count().get()).data().count;
    const inProgress = (await collectionRef.where('status', '==', 'in-progress').count().get()).data().count;
    const resolved = (await collectionRef.where('status', '==', 'resolved').count().get()).data().count;
    const closed = (await collectionRef.where('status', '==', 'closed').count().get()).data().count;
    const total = open + inProgress + resolved + closed;

    const resolvedSnapshot = await collectionRef.where('status', 'in', ['resolved', 'closed']).where('resolved_at', '!=', null).get();
    let totalSeconds = 0;
    resolvedSnapshot.forEach(doc => {
        const data = doc.data();
        const createdAt = (data.created_at as Timestamp).toMillis();
        const resolvedAt = (data.resolved_at as Timestamp).toMillis();
        totalSeconds += (resolvedAt - createdAt) / 1000;
    });

    const avgResolutionHours = resolvedSnapshot.size > 0 ? (totalSeconds / resolvedSnapshot.size) / 3600 : null;

    const settingsSnapshot = await db.collection('site_config').doc('main').get();
    const settings = settingsSnapshot.data() || {};

    return {
        total,
        open,
        inProgress,
        resolved,
        closed,
        avgResolutionHours,
        contact_email: settings.contact_email || null,
        contact_phone: settings.contact_phone || null,
        contact_twitter: settings.contact_twitter || null,
        contact_linkedin: settings.contact_linkedin || null,
        contact_youtube: settings.contact_youtube || null,
    };
}
