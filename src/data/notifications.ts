
'use server';

import { supabase } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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
        
    if (error) {
        console.error("Error getting notifications:", error);
        return [];
    }
    return data;
}

export async function getActiveNotifications(): Promise<SiteNotification[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_active', true)
        .or(`start_time.is.null,start_time.lte.${now}`)
        .or(`end_time.is.null,end_time.gte.${now}`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error getting active notifications:", error);
        return [];
    }
    return data;
}

type NotificationPayload = Omit<SiteNotification, 'id' | 'created_at'>;

export async function addNotification(data: NotificationPayload): Promise<SiteNotification> {
    const { data: newNotification, error } = await supabaseAdmin
        .from('notifications')
        .insert(data)
        .select()
        .single();

    if (error) {
        console.error("Error adding notification:", error);
        throw error;
    }
    return newNotification;
}

export async function updateNotification(id: string, data: NotificationPayload): Promise<SiteNotification> {
    const { data: updatedNotification, error } = await supabaseAdmin
        .from('notifications')
        .update(data)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error("Error updating notification:", error);
        throw error;
    }
    return updatedNotification;
}

export async function deleteNotification(id: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("Error deleting notification:", error);
        throw error;
    }
}
