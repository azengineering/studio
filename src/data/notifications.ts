
'use server';

import { supabaseAdmin, handleSupabaseError } from '@/lib/db';

export interface SiteNotification {
    id: string;
    message: string;
    start_time: string | null;
    end_time: string | null;
    is_active: boolean;
    created_at: string;
    link: string | null;
}

export async function getNotifications(): Promise<SiteNotification[]> {
    const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
    return handleSupabaseError({ data, error }, 'getNotifications') || [];
}

export async function getActiveNotifications(): Promise<SiteNotification[]> {
    const now = new Date().toISOString();
    
    // This is a non-critical function. If it fails, the app should not crash.
    // We log the error and return an empty array.
    try {
        const { data, error } = await supabaseAdmin
            .from('notifications')
            .select('*')
            .and(`is_active.eq.true,or(start_time.is.null,start_time.lte.${now}),or(end_time.is.null,end_time.gte.${now})`)
            .order('created_at', { ascending: false });

        if (error) {
            // This can fail with placeholder keys, so we prevent a crash.
            console.error("Could not fetch active notifications:", error.message);
            return [];
        }
            
        return data || [];
    } catch (e) {
        console.error("An unexpected error occurred while fetching notifications:", e);
        return [];
    }
}

type NotificationPayload = Omit<SiteNotification, 'id' | 'created_at'>;

export async function addNotification(data: NotificationPayload): Promise<SiteNotification> {
    const { data: newNotification, error } = await supabaseAdmin
        .from('notifications')
        .insert(data)
        .select()
        .single();
    return handleSupabaseError({ data: newNotification, error }, 'addNotification');
}

export async function updateNotification(id: string, data: NotificationPayload): Promise<SiteNotification> {
    const { data: updatedNotification, error } = await supabaseAdmin
        .from('notifications')
        .update(data)
        .eq('id', id)
        .select()
        .single();
    return handleSupabaseError({ data: updatedNotification, error }, 'updateNotification');
}

export async function deleteNotification(id: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', id);
    if (error) handleSupabaseError({ data: null, error }, 'deleteNotification');
}
