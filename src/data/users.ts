
'use server';

import { supabaseAdmin } from '@/lib/db';
import { isAfter } from 'date-fns';

export interface User {
  id: string;
  email: string;
  name?: string;
  gender?: 'male' | 'female' | 'other' | '';
  age?: number;
  state?: string;
  mpConstituency?: string;
  mlaConstituency?: string;
  panchayat?: string;
  created_at?: string;
  is_blocked?: boolean;
  blocked_until?: string | null;
  block_reason?: string | null;
}

export interface AdminMessage {
  id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // Ignore 'exact one row not found'
    console.error('Error finding user by email:', error);
  }
  
  return data || undefined;
}

export async function findUserById(id: string): Promise<User | undefined> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error finding user by id:', error);
  }

  return data || undefined;
}

export async function addUser(user: Partial<User> & { id: string; email: string }): Promise<User> {
  const name = user.name || user.email.split('@')[0];
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
  
  const { data, error } = await supabaseAdmin
    .from('users')
    .upsert({
      id: user.id,
      email: user.email.toLowerCase(),
      name: formattedName,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating/updating user profile:", error);
    throw new Error('Failed to create user profile.');
  }
  
  return data;
}

export async function updateUserProfile(userId: string, profileData: Partial<User>): Promise<User | null> {
  const dataToUpdate: { [key: string]: any } = { ...profileData };

  delete dataToUpdate.id;
  delete dataToUpdate.email;
  delete dataToUpdate.created_at;

  Object.keys(dataToUpdate).forEach(key => {
      if (dataToUpdate[key] === '') dataToUpdate[key] = null;
      if (key === 'age' && isNaN(Number(dataToUpdate[key]))) dataToUpdate[key] = null;
  });

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(dataToUpdate)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating user profile:", error);
    throw new Error('Failed to update user profile.');
  }
  return data;
}

export async function getUserCount(filters?: { startDate?: string, endDate?: string, state?: string, constituency?: string }): Promise<number> {
    let query = supabaseAdmin.from('users').select('*', { count: 'exact', head: true });
    
    if (filters?.startDate) query = query.gte('created_at', filters.startDate);
    if (filters?.endDate) query = query.lte('created_at', filters.endDate);
    if (filters?.state) query = query.eq('state', filters.state);

    const { count, error } = await query;
    if (error) console.error("Error getting user count:", error);
    return count || 0;
}


// --- Admin Moderation Functions ---

export async function blockUser(userId: string, reason: string, blockedUntil: string | null): Promise<void> {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_blocked: true, block_reason: reason, blocked_until: blockedUntil })
      .eq('id', userId);
    if (error) throw error;
}

export async function unblockUser(userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_blocked: false, block_reason: null, blocked_until: null })
      .eq('id', userId);
    if (error) throw error;
}

export async function getUsers(query?: string): Promise<(User & { ratingCount: number; leaderAddedCount: number; unreadMessageCount: number; })[]> {
    let queryBuilder = supabaseAdmin.from('users').select('*');
    
    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,email.ilike.%${query}%,id.eq.${query}`);
    } else {
      queryBuilder = queryBuilder.order('created_at', { ascending: false });
    }

    const { data: users, error } = await queryBuilder;
    if (error) {
      console.error("Error fetching users:", error);
      return [];
    }
    if (!users) return [];

    const enrichedUsers = await Promise.all(users.map(async (user) => {
        const { count: ratingCount } = await supabaseAdmin.from('ratings').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
        const { count: leaderAddedCount } = await supabaseAdmin.from('leaders').select('*', { count: 'exact', head: true }).eq('added_by_user_id', user.id);
        const { count: unreadMessageCount } = await supabaseAdmin.from('admin_messages').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false);
        return {
            ...user,
            ratingCount: ratingCount ?? 0,
            leaderAddedCount: leaderAddedCount ?? 0,
            unreadMessageCount: unreadMessageCount ?? 0,
        };
    }));

    return enrichedUsers;
}

export async function addAdminMessage(userId: string, message: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('admin_messages')
    .insert({ user_id: userId, message });
  if (error) throw error;
}

export async function getAdminMessages(userId: string): Promise<AdminMessage[]> {
  const { data, error } = await supabaseAdmin
    .from('admin_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getUnreadMessages(userId: string): Promise<AdminMessage[]> {
  const { data, error } = await supabaseAdmin
    .from('admin_messages')
    .select('*')
    .eq('user_id', userId)
    .eq('is_read', false)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  await supabaseAdmin
    .from('admin_messages')
    .update({ is_read: true })
    .eq('id', messageId);
}

export async function deleteAdminMessage(messageId: string): Promise<void> {
    await supabaseAdmin
      .from('admin_messages')
      .delete()
      .eq('id', messageId);
}
