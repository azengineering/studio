
'use server';

<<<<<<< HEAD
import { supabaseAdmin } from '@/lib/db';
import { isAfter } from 'date-fns';
=======
import { supabase } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd

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

<<<<<<< HEAD
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
=======
export async function findUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error finding user by ID:', error);
    return null;
  }
  return data;
}

export async function updateUserProfile(userId: string, profileData: Partial<Omit<User, 'id' | 'email' | 'createdAt'>>): Promise<User | null> {
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
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
}

export async function getUserCount(filters?: { startDate?: string, endDate?: string, state?: string, constituency?: string }): Promise<number> {
    let query = supabaseAdmin.from('users').select('*', { count: 'exact', head: true });
<<<<<<< HEAD
    
    if (filters?.startDate) query = query.gte('created_at', filters.startDate);
    if (filters?.endDate) query = query.lte('created_at', filters.endDate);
    if (filters?.state) query = query.eq('state', filters.state);

    const { count, error } = await query;
    if (error) console.error("Error getting user count:", error);
    return count || 0;
=======

    if (filters?.startDate && filters?.endDate) {
        query = query.gte('createdAt', filters.startDate).lte('createdAt', filters.endDate);
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
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
}


// --- Admin Moderation Functions ---

export async function blockUser(userId: string, reason: string, blockedUntil: string | null): Promise<void> {
    const { error } = await supabaseAdmin
<<<<<<< HEAD
      .from('users')
      .update({ is_blocked: true, block_reason: reason, blocked_until: blockedUntil })
      .eq('id', userId);
    if (error) throw error;
=======
        .from('users')
        .update({ isBlocked: true, blockReason: reason, blockedUntil: blockedUntil })
        .eq('id', userId);
        
    if (error) {
      console.error("Error blocking user:", error);
      throw error;
    }
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
}

export async function unblockUser(userId: string): Promise<void> {
    const { error } = await supabaseAdmin
<<<<<<< HEAD
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
=======
        .from('users')
        .update({ isBlocked: false, blockReason: null, blockedUntil: null })
        .eq('id', userId);

    if (error) {
      console.error("Error unblocking user:", error);
      throw error;
    }
}

export async function getUsers(query?: string): Promise<Partial<User>[]> {
  let selectQuery = supabaseAdmin
    .from('users')
    .select(`
        *,
        leader_added_count:leaders(count),
        rating_count:ratings(count),
        unread_message_count:admin_messages!inner(count)
    `)
    .eq('admin_messages.isRead', false)
    .order('createdAt', { ascending: false });

  if (query) {
    const searchTerm = `%${query}%`;
    selectQuery = selectQuery.or(`name.ilike.${searchTerm},email.ilike.${searchTerm},id.ilike.${searchTerm}`);
  }

  const { data, error } = await selectQuery;

  if (error) {
    console.error("Error fetching users for admin:", error);
    return [];
  }
  
  return data.map((u: any) => ({
    ...u,
    leaderAddedCount: u.leader_added_count[0]?.count ?? 0,
    ratingCount: u.rating_count[0]?.count ?? 0,
    unreadMessageCount: u.unread_message_count[0]?.count ?? 0,
  }));
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
}

export async function addAdminMessage(userId: string, message: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('admin_messages')
<<<<<<< HEAD
    .insert({ user_id: userId, message });
  if (error) throw error;
=======
    .insert({ user_id: userId, message: message });
    
  if (error) {
    console.error("Error adding admin message:", error);
    throw error;
  }
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
}

export async function getAdminMessages(userId: string): Promise<AdminMessage[]> {
  const { data, error } = await supabaseAdmin
    .from('admin_messages')
    .select('*')
    .eq('user_id', userId)
<<<<<<< HEAD
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
=======
    .order('createdAt', { ascending: false });

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
    .eq('isRead', false)
    .order('createdAt', { ascending: true });

  if (error) {
    console.error("Error getting unread messages:", error);
    return [];
  }
  return data;
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('admin_messages')
    .update({ isRead: true })
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
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
}
