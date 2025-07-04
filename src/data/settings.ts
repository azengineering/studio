
'use server';

import { supabaseAdmin, handleSupabaseError } from '@/lib/db';

export interface SiteSettings {
    maintenance_active: boolean;
    maintenance_start: string | null;
    maintenance_end: string | null;
    maintenance_message: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    contact_twitter: string | null;
    contact_linkedin: string | null;
    contact_youtube: string | null;
    contact_facebook: string | null;
}

const defaultSettings: SiteSettings = {
    maintenance_active: false,
    maintenance_start: null,
    maintenance_end: null,
    maintenance_message: 'The site is currently down for maintenance. We will be back shortly.',
    contact_email: 'support@politirate.com',
    contact_phone: null,
    contact_twitter: null,
    contact_linkedin: null,
    contact_youtube: null,
    contact_facebook: null,
};

export async function getSiteSettings(): Promise<SiteSettings> {
    const { data, error } = await supabaseAdmin
        .from('site_settings')
        .select('*')
        .limit(1)
        .single();
    
    if (error && error.code === 'PGRST116') { // No rows found
        const { data: newData, error: insertError } = await supabaseAdmin
            .from('site_settings')
            .insert(defaultSettings)
            .select()
            .single();
        if (insertError) {
            console.error("Failed to insert default settings:", insertError);
            return defaultSettings;
        }
        return newData || defaultSettings;
    }
    
    if (error) {
        console.error("Failed to get site settings:", error);
        return defaultSettings;
    }

    return { ...defaultSettings, ...data };
}

export async function updateSiteSettings(settings: Partial<SiteSettings>): Promise<void> {
    const { error } = await supabaseAdmin
        .from('site_settings')
        .upsert({ id: 1, ...settings }); // Assuming a single row with id=1 for settings

    if (error) {
        handleSupabaseError({ data: null, error }, 'updateSiteSettings');
    }
}
