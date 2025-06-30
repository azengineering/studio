
'use server';

import { db } from '@/lib/db';
import type { RunResult } from 'better-sqlite3';

export interface SiteNotification {
    id: string;
    message: string;
    startTime: string | null;
    endTime: string | null;
    isActive: boolean;
    createdAt: string;
}

const dbToNotification = (row: any): SiteNotification => ({
    id: row.id,
    message: row.message,
    startTime: row.start_time,
    endTime: row.end_time,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
});

export async function getNotifications(): Promise<SiteNotification[]> {
    const stmt = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map(dbToNotification);
}

export async function getActiveNotifications(): Promise<SiteNotification[]> {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
        SELECT * FROM notifications
        WHERE is_active = 1
          AND (start_time IS NULL OR start_time <= ?)
          AND (end_time IS NULL OR end_time >= ?)
        ORDER BY created_at DESC
    `);
    const rows = stmt.all(now, now) as any[];
    return rows.map(dbToNotification);
}

type NotificationPayload = Omit<SiteNotification, 'id' | 'createdAt'>;

export async function addNotification(data: NotificationPayload): Promise<SiteNotification> {
    const id = new Date().getTime().toString();
    const createdAt = new Date().toISOString();
    const stmt = db.prepare(`
        INSERT INTO notifications (id, message, start_time, end_time, is_active, created_at)
        VALUES (@id, @message, @startTime, @endTime, @isActive, @createdAt)
    `);
    stmt.run({
        id,
        message: data.message,
        startTime: data.startTime,
        endTime: data.endTime,
        isActive: data.isActive ? 1 : 0,
        createdAt,
    });
    return { id, ...data, createdAt };
}

export async function updateNotification(id: string, data: NotificationPayload): Promise<SiteNotification> {
    const stmt = db.prepare(`
        UPDATE notifications
        SET message = @message,
            start_time = @startTime,
            end_time = @endTime,
            is_active = @isActive
        WHERE id = @id
    `);
    stmt.run({
        id,
        message: data.message,
        startTime: data.startTime,
        endTime: data.endTime,
        isActive: data.isActive ? 1 : 0,
    });
    const updatedStmt = db.prepare('SELECT * FROM notifications WHERE id = ?');
    const row = updatedStmt.get(id) as any;
    return dbToNotification(row);
}

export async function deleteNotification(id: string): Promise<void> {
    const stmt = db.prepare('DELETE FROM notifications WHERE id = ?');
    stmt.run(id);
}
