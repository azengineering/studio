
'use server';

<<<<<<< HEAD
import { supabaseAdmin, handleSupabaseError } from '@/lib/db';
=======
import { supabase } from '@/lib/db';
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd

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
<<<<<<< HEAD
    const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
    return handleSupabaseError({ data, error }, 'getNotifications') || [];
=======
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
        
    if (error) {
        console.error("Error getting notifications:", error);
        return [];
    }
    return data;
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
}

export async function getActiveNotifications(): Promise<SiteNotification[]> {
    const now = new Date().toISOString();
<<<<<<< HEAD
    
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
=======
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('isActive', true)
        .or(`startTime.is.null,startTime.lte.${now}`)
        .or(`endTime.is.null,endTime.gte.${now}`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error getting active notifications:", error);
        return [];
    }
    return data;
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
}

type NotificationPayload = Omit<SiteNotification, 'id' | 'created_at'>;

export async function addNotification(data: NotificationPayload): Promise<SiteNotification> {
<<<<<<< HEAD
    const { data: newNotification, error } = await supabaseAdmin
=======
    const { data: newNotification, error } = await supabase
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
        .from('notifications')
        .insert(data)
        .select()
        .single();
<<<<<<< HEAD
    return handleSupabaseError({ data: newNotification, error }, 'addNotification');
}

export async function updateNotification(id: string, data: NotificationPayload): Promise<SiteNotification> {
    const { data: updatedNotification, error } = await supabaseAdmin
=======

    if (error) {
        console.error("Error adding notification:", error);
        throw error;
    }
    return newNotification;
}

export async function updateNotification(id: string, data: NotificationPayload): Promise<SiteNotification> {
    const { data: updatedNotification, error } = await supabase
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
        .from('notifications')
        .update(data)
        .eq('id', id)
        .select()
        .single();
<<<<<<< HEAD
    return handleSupabaseError({ data: updatedNotification, error }, 'updateNotification');
}

export async function deleteNotification(id: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', id);
    if (error) handleSupabaseError({ data: null, error }, 'deleteNotification');
=======

    if (error) {
        console.error("Error updating notification:", error);
        throw error;
    }
    return updatedNotification;
}

export async function deleteNotification(id: string): Promise<void> {
    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("Error deleting notification:", error);
        throw error;
    }
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
}
