
'use server';

import { supabase } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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

export async function findUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error finding user by ID:', error);
  }
  return data;
}

export async function updateUserProfile(userId: string, profileData: Partial<Omit<User, 'id' | 'email' | 'created_at'>>): Promise<User | null> {
    const { data, error } = await supabase
        .from('users')
        .update(profileData)
        .eq('id', userId)
        .select()
        .single();
        
    if (error) {
        console.error("Error updating user profile:", error);
        return null;
    }
    return data;
}

export async function getUserCount(filters?: { startDate?: string, endDate?: string, state?: string, constituency?: string }): Promise<number> {
    let query = supabaseAdmin.from('users').select('*', { count: 'exact', head: true });

    if (filters?.startDate && filters?.endDate) {
        query = query.gte('created_at', filters.startDate).lte('created_at', filters.endDate);
    }
    if (filters?.state) {
        query = query.eq('state', filters.state);
    }
    if (filters?.constituency) {
        const searchTerm = `%${filters.constituency}%`;
        query = query.or(`mpConstituency.ilike.${searchTerm},mlaConstituency.ilike.${searchTerm},panchayat.ilike.${searchTerm}`);
    }
    
    const { count, error } = await query;
    if (error) {
        console.error("Error getting user count:", error);
        return 0;
    }
    return count ?? 0;
}


// --- Admin Moderation Functions ---

export async function blockUser(userId: string, reason: string, blockedUntil: string | null): Promise<void> {
    const { error } = await supabaseAdmin
        .from('users')
        .update({ is_blocked: true, block_reason: reason, blocked_until: blockedUntil })
        .eq('id', userId);
        
    if (error) {
      console.error("Error blocking user:", error);
      throw error;
    }
}

export async function unblockUser(userId: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from('users')
        .update({ is_blocked: false, block_reason: null, blocked_until: null })
        .eq('id', userId);

    if (error) {
      console.error("Error unblocking user:", error);
      throw error;
    }
}

export async function getUsers(query?: string): Promise<(User & { ratingCount: number; leaderAddedCount: number; unreadMessageCount: number; })[]> {
    const rpcParams = query ? { p_search_term: query } : { p_search_term: null };
    const { data, error } = await supabaseAdmin.rpc('get_users_with_counts', rpcParams);

    if (error) {
      console.error("Error fetching users for admin:", error);
      return [];
    }
    return data;
}

export async function addAdminMessage(userId: string, message: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('admin_messages')
    .insert({ user_id: userId, message: message });
    
  if (error) {
    console.error("Error adding admin message:", error);
    throw error;
  }
}

export async function getAdminMessages(userId: string): Promise<AdminMessage[]> {
  const { data, error } = await supabaseAdmin
    .from('admin_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error getting admin messages:", error);
    return [];
  }
  return data;
}

export async function getUnreadMessages(userId: string): Promise<AdminMessage[]> {
  const { data, error } = await supabase
    .from('admin_messages')
    .select('*')
    .eq('user_id', userId)
    .eq('is_read', false)
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error getting unread messages:", error);
    return [];
  }
  return data;
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('admin_messages')
    .update({ is_read: true })
    .eq('id', messageId);

  if (error) {
    console.error("Error marking message as read:", error);
    throw error;
  }
}

export async function deleteAdminMessage(messageId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('admin_messages')
      .delete()
      .eq('id', messageId);
      
    if (error) {
      console.error("Error deleting admin message:", error);
      throw error;
    }
}
