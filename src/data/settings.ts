
'use server';

import { db } from '@/lib/db';

export interface SiteSettings {
    maintenance_active: 'true' | 'false';
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
    maintenance_active: 'false',
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

const settingsRef = db.collection('site_config').doc('main');

/**
 * Retrieves all site settings from the database.
 * @returns A promise that resolves to an object containing all site settings.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
    try {
        const doc = await settingsRef.get();
        if (!doc.exists) {
            // If the settings document doesn't exist, create it with defaults
            await settingsRef.set(defaultSettings);
            return defaultSettings;
        }
        return { ...defaultSettings, ...doc.data() as Partial<SiteSettings> };
    } catch (error) {
        console.error("Failed to get site settings, returning defaults.", error);
        return defaultSettings;
    }
}

/**
 * Updates multiple site settings in a single transaction.
 * @param settings An object where keys are the setting names and values are the new values.
 * @returns A promise that resolves when the settings have been updated.
 */
export async function updateSiteSettings(settings: Partial<SiteSettings>): Promise<void> {
    try {
        // Using set with merge:true will create the document if it doesn't exist,
        // or update it if it does, only changing the specified fields.
        await settingsRef.set(settings, { merge: true });
    } catch (error) {
        console.error("Failed to update site settings:", error);
        throw new Error("Database transaction for updating settings failed.");
    }
}
