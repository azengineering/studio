
'use server';

import { db, convertFirestoreData } from '@/lib/db';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export interface SiteNotification {
    id: string;
    message: string;
    startTime: any | null;
    endTime: any | null;
    isActive: boolean;
    createdAt: any;
    link: string | null;
}

export async function getNotifications(): Promise<SiteNotification[]> {
    const snapshot = await db.collection('notifications').orderBy('createdAt', 'desc').get();
    if (snapshot.empty) return [];
    
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as SiteNotification);
    return convertFirestoreData(notifications);
}

export async function getActiveNotifications(): Promise<SiteNotification[]> {
    const now = new Date();
    // Firestore requires two separate queries for this logic, which we combine in code.
    const noStartTimeSnapshot = await db.collection('notifications')
        .where('isActive', '==', true)
        .where('startTime', '==', null)
        .get();
        
    const withStartTimeSnapshot = await db.collection('notifications')
        .where('isActive', '==', true)
        .where('startTime', '<=', now)
        .get();

    const allPotentiallyActive = [
      ...noStartTimeSnapshot.docs,
      ...withStartTimeSnapshot.docs
    ];
    
    // Deduplicate and filter by end time in code
    const uniqueDocs = Array.from(new Map(allPotentiallyActive.map(doc => [doc.id, doc])).values());
    const activeNotifications = uniqueDocs
        .map(doc => ({ id: doc.id, ...doc.data() }) as SiteNotification)
        .filter(n => !n.endTime || (n.endTime as Timestamp).toDate() >= now);

    return convertFirestoreData(activeNotifications.sort((a,b) => (b.createdAt as Timestamp).toMillis() - (a.createdAt as Timestamp).toMillis()));
}

type NotificationPayload = Omit<SiteNotification, 'id' | 'createdAt'>;

export async function addNotification(data: NotificationPayload): Promise<SiteNotification> {
    const notificationRef = db.collection('notifications').doc();
    const payload = {
        message: data.message,
        isActive: data.isActive,
        startTime: data.startTime ? Timestamp.fromMillis(new Date(data.startTime).getTime()) : null,
        endTime: data.endTime ? Timestamp.fromMillis(new Date(data.endTime).getTime()) : null,
        link: data.link || null,
        createdAt: FieldValue.serverTimestamp()
    };
    await notificationRef.set(payload);
    return { id: notificationRef.id, ...data, createdAt: new Date().toISOString() };
}

export async function updateNotification(id: string, data: NotificationPayload): Promise<SiteNotification> {
    const notificationRef = db.collection('notifications').doc(id);
    const payload = {
        message: data.message,
        isActive: data.isActive,
        startTime: data.startTime ? Timestamp.fromMillis(new Date(data.startTime).getTime()) : null,
        endTime: data.endTime ? Timestamp.fromMillis(new Date(data.endTime).getTime()) : null,
        link: data.link || null,
    };
    await notificationRef.update(payload);
    const doc = await notificationRef.get();
    return convertFirestoreData({ id: doc.id, ...doc.data() }) as SiteNotification;
}

export async function deleteNotification(id: string): Promise<void> {
    await db.collection('notifications').doc(id).delete();
}
