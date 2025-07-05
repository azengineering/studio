
'use server';

<<<<<<< HEAD
import { supabaseAdmin, handleSupabaseError } from '@/lib/db';
import type { User } from './users';
=======
import { supabase } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd

// Interfaces remain the same as they define the shape of the data for the app
export interface Leader {
  id: string;
  name: string;
  party_name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  photo_url: string;
  constituency: string;
  native_address: string;
  election_type: 'national' | 'state' | 'panchayat';
  location: {
    state?: string;
    district?: string;
  };
  rating: number;
  review_count: number;
  previous_elections: Array<{
    electionType: string;
    constituency: string;
    status: 'winner' | 'loser';
    electionYear: string;
    partyName: string;
    state?: string;
  }>;
  manifesto_url?: string;
  twitter_url?: string;
  added_by_user_id?: string | null;
  created_at?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_comment?: string | null;
  user_name?: string;
}

export interface Review {
  user_id: string;
  user_name: string;
  rating: number;
  comment: string | null;
  updated_at: string;
  social_behaviour: string | null;
}

export interface UserActivity {
  leader_id: string;
  leaderName: string;
  leaderPhotoUrl: string;
  rating: number;
  comment: string | null;
  updatedAt: string;
  leader: Leader;
  socialBehaviour: string | null;
  userName: string;
}

export interface RatingDistribution {
  rating: number;
  count: number;
}

export interface SocialBehaviourDistribution {
  name: string;
  count: number;
}

<<<<<<< HEAD
// Public API gets only approved leaders
export async function getLeaders(): Promise<Leader[]> {
  // This is a non-critical function for the public homepage.
  // It should not crash the app if the database is not configured.
  try {
    const { data, error } = await supabaseAdmin
      .from('leaders')
      .select('*')
      .eq('status', 'approved');

    if (error) {
      console.error("Could not fetch leaders for homepage:", error.message);
      return [];
    }
    return data || [];
  } catch (e) {
      console.error("An unexpected error occurred while fetching leaders:", e);
      return [];
  }
}

export async function addLeader(leaderData: Omit<Leader, 'id' | 'rating' | 'review_count' | 'added_by_user_id' | 'created_at' | 'status' | 'admin_comment' | 'user_name'>, userId: string | null): Promise<void> {
    const { error } = await supabaseAdmin.from('leaders').insert({
        ...leaderData,
        added_by_user_id: userId,
        status: 'pending',
    });
    if (error) handleSupabaseError({ data: null, error }, 'addLeader');
}

export async function getLeaderById(id: string): Promise<Leader | null> {
    const { data, error } = await supabaseAdmin
=======

// --- Public API ---

export async function getLeaders(): Promise<Leader[]> {
  const { data, error } = await supabase
    .from('leaders')
    .select('*')
    .eq('status', 'approved');

  if (error) {
    console.error("Error fetching leaders:", error);
    return [];
  }
  return data.map(leader => ({
      ...leader,
      previousElections: leader.previousElections || []
  }));
}

export async function addLeader(leaderData: Omit<Leader, 'id' | 'rating' | 'reviewCount' | 'createdAt' | 'status' | 'adminComment' | 'userName'>, userId: string | null): Promise<void> {
    const { error } = await supabase.from('leaders').insert({
        ...leaderData,
        addedByUserId: userId,
        status: 'pending'
    });

    if (error) {
        console.error("Error adding leader:", error);
        throw error;
    }
}

export async function getLeaderById(id: string): Promise<Leader | null> {
    const { data, error } = await supabase
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
        .from('leaders')
        .select('*')
        .eq('id', id)
        .single();
<<<<<<< HEAD
    if (error) {
        console.error('Error getting leader by ID:', error.message);
        return null;
    }
    return data;
}

export async function updateLeader(leaderId: string, leaderData: any, userId: string | null, isAdmin: boolean): Promise<Leader | null> {
    const { data: leaderToUpdate, error: fetchError } = await supabaseAdmin
        .from('leaders')
        .select('added_by_user_id')
        .eq('id', leaderId)
        .single();
    
    if (fetchError || !leaderToUpdate) throw new Error("Leader not found.");
    if (!isAdmin && leaderToUpdate.added_by_user_id !== userId) throw new Error("Unauthorized");
    
    const updatePayload = { ...leaderData };
    if (!isAdmin) {
        updatePayload.status = 'pending';
        updatePayload.admin_comment = 'User updated details. Pending re-approval.';
    }

    const { data, error } = await supabaseAdmin
        .from('leaders')
        .update(updatePayload)
=======
        
    if (error) {
        console.error("Error fetching leader by ID:", error);
        return null;
    }
    return {
        ...data,
        previousElections: data.previousElections || []
    };
}

export async function updateLeader(leaderId: string, leaderData: Partial<Omit<Leader, 'id' | 'rating' | 'reviewCount' | 'createdAt' | 'status' | 'adminComment'>>, userId: string | null, isAdmin: boolean): Promise<Leader | null> {
    const db = isAdmin ? supabaseAdmin : supabase;

    const leaderToUpdate = await getLeaderById(leaderId);
    if (!leaderToUpdate) throw new Error("Leader not found.");

    if (!isAdmin && leaderToUpdate.addedByUserId !== userId) {
        throw new Error("You are not authorized to edit this leader.");
    }

    const payload: Partial<Leader> = { ...leaderData };
    if (!isAdmin) {
        payload.status = 'pending';
        payload.adminComment = 'User updated details. Pending re-approval.';
    }
    
    const { data, error } = await db
        .from('leaders')
        .update(payload)
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
        .eq('id', leaderId)
        .select()
        .single();

<<<<<<< HEAD
    return handleSupabaseError({ data, error }, 'updateLeader');
}

export async function submitRatingAndComment(leaderId: string, userId: string, newRating: number, comment: string | null, socialBehaviour: string | null): Promise<Leader | null> {
    const { data: user } = await supabaseAdmin.from('users').select('name').eq('id', userId).single();
    if (!user) throw new Error("User not found.");

    await supabaseAdmin
        .from('ratings')
        .upsert({
            user_id: userId,
            leader_id: leaderId,
            user_name: user.name || 'Anonymous',
            rating: newRating,
            comment: comment,
            social_behaviour: socialBehaviour,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,leader_id' });

    const { data: stats } = await supabaseAdmin.rpc('get_leader_stats', { p_leader_id: leaderId });
    if (stats && stats.length > 0) {
        const { avg_rating, review_count } = stats[0];
        await supabaseAdmin
            .from('leaders')
            .update({ rating: avg_rating, review_count: review_count })
            .eq('id', leaderId);
    }

=======
    if (error) {
        console.error("Error updating leader:", error);
        throw error;
    }
    return data;
}

export async function submitRatingAndComment(leaderId: string, userId: string, newRating: number, comment: string | null, socialBehaviour: string | null): Promise<Leader | null> {
    const { error } = await supabase.rpc('handle_new_rating', {
        p_leader_id: leaderId,
        p_user_id: userId,
        p_rating: newRating,
        p_comment: comment,
        p_social_behaviour: socialBehaviour
    });

    if (error) {
        console.error('Error submitting rating via RPC:', error);
        throw error;
    }
    
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
    return getLeaderById(leaderId);
}

export async function getReviewsForLeader(leaderId: string): Promise<Review[]> {
<<<<<<< HEAD
    const { data, error } = await supabaseAdmin
        .from('ratings')
        .select('*')
        .eq('leader_id', leaderId)
        .order('updated_at', { ascending: false });
    return handleSupabaseError({ data, error }, 'getReviewsForLeader') || [];
}

export async function getRatingDistribution(leaderId: string): Promise<RatingDistribution[]> {
    const { data, error } = await supabaseAdmin.rpc('get_rating_distribution', { p_leader_id: leaderId });
    return handleSupabaseError({ data, error }, 'getRatingDistribution') || [];
}

export async function getSocialBehaviourDistribution(leaderId: string): Promise<SocialBehaviourDistribution[]> {
    const { data, error } = await supabaseAdmin.rpc('get_social_behaviour_distribution', { p_leader_id: leaderId });
    return handleSupabaseError({ data, error }, 'getSocialBehaviourDistribution') || [];
}

export async function getActivitiesForUser(userId: string): Promise<UserActivity[]> {
    const { data, error } = await supabaseAdmin
      .from('ratings')
      .select(`
        leader_id,
        rating,
        comment,
        updated_at,
        social_behaviour,
        user_name,
        leader:leaders(*)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
      
    if (error) {
        handleSupabaseError({ data: null, error }, 'getActivitiesForUser');
        return [];
    }

    return (data as any[]).map(activity => ({
        ...activity,
        leaderId: activity.leader_id,
        leaderName: activity.leader.name,
        leaderPhotoUrl: activity.leader.photo_url,
        updatedAt: activity.updated_at,
        socialBehaviour: activity.social_behaviour,
        userName: activity.user_name,
    })) || [];
=======
    const { data, error } = await supabase
        .rpc('get_reviews_for_leader', { p_leader_id: leaderId });

    if (error) {
        console.error('Error getting reviews for leader:', error);
        return [];
    }
    return data;
}

export async function getRatingDistribution(leaderId: string): Promise<RatingDistribution[]> {
    const { data, error } = await supabaseAdmin
        .from('ratings')
        .select('rating, count:id')
        .eq('leaderId', leaderId)
        .groupBy('rating');
        
    if (error) {
        console.error("Error getting rating distribution:", error);
        return [];
    }
    return (data as any[]).map(d => ({ rating: d.rating, count: d.count }));
}

export async function getSocialBehaviourDistribution(leaderId: string): Promise<SocialBehaviourDistribution[]> {
    const { data, error } = await supabaseAdmin
        .from('ratings')
        .select('socialBehaviour, count:id')
        .eq('leaderId', leaderId)
        .not('socialBehaviour', 'is', null)
        .groupBy('socialBehaviour');

    if (error) {
        console.error("Error getting social behaviour distribution:", error);
        return [];
    }
    return (data as any[]).map(d => ({ name: d.socialBehaviour.charAt(0).toUpperCase() + d.socialBehaviour.slice(1).replace('-', ' '), count: d.count }));
}

export async function getActivitiesForUser(userId: string): Promise<UserActivity[]> {
     const { data, error } = await supabase
        .rpc('get_user_activities', { p_user_id: userId });

    if (error) {
        console.error('Error getting user activities:', error);
        return [];
    }
    return data;
}

export async function getAllActivities(): Promise<UserActivity[]> {
    const { data, error } = await supabaseAdmin.rpc('get_all_activities');

    if (error) {
        console.error('Error getting all activities:', error);
        return [];
    }
    return data;
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
}

export async function getLeadersAddedByUser(userId: string): Promise<Leader[]> {
<<<<<<< HEAD
  const { data, error } = await supabaseAdmin
    .from('leaders')
    .select('*')
    .eq('added_by_user_id', userId)
    .order('name', { ascending: true });
  return handleSupabaseError({ data, error }, 'getLeadersAddedByUser') || [];
=======
  const { data, error } = await supabase
    .from('leaders')
    .select('*')
    .eq('addedByUserId', userId)
    .order('name', { ascending: true });
    
  if (error) {
      console.error("Error getting leaders added by user:", error);
      return [];
  }
  return data.map(leader => ({
      ...leader,
      previousElections: leader.previousElections || []
  }));
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
}


export async function getLeaderCount(filters?: { startDate?: string, endDate?: string, state?: string, constituency?: string }): Promise<number> {
    let query = supabaseAdmin.from('leaders').select('*', { count: 'exact', head: true });
<<<<<<< HEAD
    if (filters?.startDate) query.gte('created_at', filters.startDate);
    if (filters?.endDate) query.lte('created_at', filters.endDate);
    if (filters?.state) query.eq('location->>state', filters.state);
    if (filters?.constituency) query.eq('constituency', filters.constituency);
    const { count, error } = await query;
    if (error) console.error("Error fetching leader count:", error);
    return count || 0;
}

export async function getRatingCount(filters?: { startDate?: string, endDate?: string, state?: string, constituency?: string }): Promise<number> {
    const { count, error } = await supabaseAdmin.from('ratings').select('*', { count: 'exact', head: true });
    if (error) console.error("Error fetching rating count:", error);
    return count || 0;
}

// Admin Functions
export async function getLeadersForAdminPanel(filters: { dateFrom?: string; dateTo?: string; state?: string; constituency?: string; candidateName?: string; }): Promise<Leader[]> {
    let query = supabaseAdmin.from('leaders').select('*, user_name:users(name)');

    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
    if (filters.dateTo) query = query.lte('created_at', filters.dateTo);
    if (filters.state) query = query.eq('location->>state', filters.state);

    if (filters.candidateName) {
        query = query.ilike('name', `%${filters.candidateName}%`);
    } else if (filters.constituency) {
        query = query.ilike('constituency', `%${filters.constituency}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) handleSupabaseError({ data: null, error }, 'getLeadersForAdminPanel');
    
    return data?.map((l: any) => ({ ...l, userName: l.user_name?.name || 'Admin/System' })) || [];
}

export async function approveLeader(leaderId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('leaders')
      .update({ status: 'approved', admin_comment: 'Approved by admin.' })
      .eq('id', leaderId);
    if (error) handleSupabaseError({ data: null, error }, 'approveLeader');
}

export async function updateLeaderStatus(leaderId: string, status: 'pending' | 'approved' | 'rejected', adminComment: string | null): Promise<void> {
    const { error } = await supabaseAdmin
      .from('leaders')
      .update({ status, admin_comment: adminComment })
      .eq('id', leaderId);
    if (error) handleSupabaseError({ data: null, error }, 'updateLeaderStatus');
}

export async function deleteLeader(leaderId: string): Promise<void> {
    const { error } = await supabaseAdmin.from('leaders').delete().eq('id', leaderId);
    if (error) handleSupabaseError({ data: null, error }, 'deleteLeader');
}

export async function deleteRating(userId: string, leaderId: string): Promise<void> {
    const { error } = await supabaseAdmin.from('ratings').delete().match({ user_id: userId, leader_id: leaderId });
    if (error) handleSupabaseError({ data: null, error }, 'deleteRating');

    // Recalculate leader stats
    const { data: stats } = await supabaseAdmin.rpc('get_leader_stats', { p_leader_id: leaderId });
    if (stats && stats.length > 0) {
        const { avg_rating, review_count } = stats[0];
        await supabaseAdmin
            .from('leaders')
            .update({ rating: avg_rating, review_count: review_count })
            .eq('id', leaderId);
=======

    if (filters?.startDate) query = query.gte('createdAt', filters.startDate);
    if (filters?.endDate) query = query.lte('createdAt', filters.endDate);
    if (filters?.state) query = query.eq('location->>state', filters.state);
    if (filters?.constituency) query = query.ilike('constituency', `%${filters.constituency}%`);

    const { error, count } = await query;
    if (error) console.error("Error getting leader count:", error);
    return count ?? 0;
}

export async function getRatingCount(filters?: { startDate?: string, endDate?: string, state?: string, constituency?: string }): Promise<number> {
    let query = supabaseAdmin.from('ratings').select('leaderId, leaders!inner(*)', { count: 'exact', head: true });
    
    if (filters?.startDate) query = query.gte('createdAt', filters.startDate);
    if (filters?.endDate) query = query.lte('createdAt', filters.endDate);
    if (filters?.state) query = query.eq('leaders.location->>state', filters.state);
    if (filters?.constituency) query = query.ilike('leaders.constituency', `%${filters.constituency}%`);

    const { error, count } = await query;
    if (error) console.error("Error getting rating count:", error);
    return count ?? 0;
}

// --- Admin Functions ---
export async function getLeadersForAdminPanel(filters: { dateFrom?: string; dateTo?: string; state?: string; constituency?: string; candidateName?: string; }): Promise<Leader[]> {
  let query = supabaseAdmin
    .from('leaders')
    .select('*, userName:users(name)')
    .order('createdAt', { ascending: false });

  if (filters.dateFrom) query = query.gte('createdAt', filters.dateFrom);
  if (filters.dateTo) query = query.lte('createdAt', filters.dateTo);
  if (filters.state) query = query.eq('location->>state', filters.state);
  if (filters.constituency) query = query.ilike('constituency', `%${filters.constituency}%`);
  if (filters.candidateName) query = query.ilike('name', `%${filters.candidateName}%`);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching leaders for admin:", error);
    return [];
  }
  
  return data.map(leader => ({
      ...leader,
      userName: (leader.userName as any)?.name ?? 'Admin/System',
      previousElections: leader.previousElections || []
  }));
}

export async function approveLeader(leaderId: string): Promise<void> {
    await updateLeaderStatus(leaderId, 'approved', 'Approved by admin.');
}

export async function updateLeaderStatus(leaderId: string, status: 'pending' | 'approved' | 'rejected', adminComment: string | null): Promise<void> {
  const { error } = await supabaseAdmin
    .from('leaders')
    .update({ status, adminComment })
    .eq('id', leaderId);
    
  if (error) {
      console.error("Error updating leader status:", error);
      throw error;
  }
}

export async function deleteLeader(leaderId: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from('leaders')
        .delete()
        .eq('id', leaderId);
        
    if (error) {
        console.error("Error deleting leader:", error);
        throw error;
    }
}

export async function deleteRating(userId: string, leaderId: string): Promise<void> {
    const { error } = await supabaseAdmin.rpc('handle_rating_deletion', {
        p_user_id: userId,
        p_leader_id: leaderId
    });

    if (error) {
        console.error("Error deleting rating via RPC:", error);
        throw error;
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
    }
}
