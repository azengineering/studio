
'use server';

import { supabase } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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
      previous_elections: leader.previous_elections || []
  }));
}

export async function addLeader(leaderData: Omit<Leader, 'id' | 'rating' | 'review_count' | 'created_at' | 'status' | 'admin_comment' | 'user_name'>, userId: string | null): Promise<void> {
    const { error } = await supabase.from('leaders').insert({
        ...leaderData,
        added_by_user_id: userId,
        status: 'pending'
    });

    if (error) {
        console.error("Error adding leader:", error);
        throw error;
    }
}

export async function getLeaderById(id: string): Promise<Leader | null> {
    const { data, error } = await supabase
        .from('leaders')
        .select('*')
        .eq('id', id)
        .single();
        
    if (error) {
        console.error("Error fetching leader by ID:", error);
        return null;
    }
    return {
        ...data,
        previous_elections: data.previous_elections || []
    };
}

export async function updateLeader(leaderId: string, leaderData: Partial<Omit<Leader, 'id' | 'rating' | 'review_count' | 'created_at' | 'status' | 'admin_comment'>>, userId: string | null, isAdmin: boolean): Promise<Leader | null> {
    const db = isAdmin ? supabaseAdmin : supabase;

    const leaderToUpdate = await getLeaderById(leaderId);
    if (!leaderToUpdate) throw new Error("Leader not found.");

    if (!isAdmin && leaderToUpdate.added_by_user_id !== userId) {
        throw new Error("You are not authorized to edit this leader.");
    }

    const payload: Partial<Leader> = { ...leaderData };
    if (!isAdmin) {
        payload.status = 'pending';
        payload.admin_comment = 'User updated details. Pending re-approval.';
    }
    
    const { data, error } = await db
        .from('leaders')
        .update(payload)
        .eq('id', leaderId)
        .select()
        .single();

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
    
    return getLeaderById(leaderId);
}

export async function getReviewsForLeader(leaderId: string): Promise<Review[]> {
    const { data, error } = await supabase
        .rpc('get_reviews_for_leader', { p_leader_id: leaderId });

    if (error) {
        console.error('Error getting reviews for leader:', error);
        return [];
    }
    return data;
}

export async function getRatingDistribution(leaderId: string): Promise<RatingDistribution[]> {
    const { data, error } = await supabaseAdmin.rpc('get_rating_distribution', { p_leader_id: leaderId });
    if (error) {
        console.error("Error getting rating distribution:", error);
        return [];
    }
    return data;
}

export async function getSocialBehaviourDistribution(leaderId: string): Promise<SocialBehaviourDistribution[]> {
    const { data, error } = await supabaseAdmin.rpc('get_social_behaviour_distribution', { p_leader_id: leaderId });
     if (error) {
        console.error("Error getting social behaviour distribution:", error);
        return [];
    }
    return data;
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
}

export async function getLeadersAddedByUser(userId: string): Promise<Leader[]> {
  const { data, error } = await supabase
    .from('leaders')
    .select('*')
    .eq('added_by_user_id', userId)
    .order('name', { ascending: true });
    
  if (error) {
      console.error("Error getting leaders added by user:", error);
      return [];
  }
  return data.map(leader => ({
      ...leader,
      previous_elections: leader.previous_elections || []
  }));
}


export async function getLeaderCount(filters?: { startDate?: string, endDate?: string, state?: string, constituency?: string }): Promise<number> {
    let query = supabaseAdmin.from('leaders').select('*', { count: 'exact', head: true });

    if (filters?.startDate) query = query.gte('created_at', filters.startDate);
    if (filters?.endDate) query = query.lte('created_at', filters.endDate);
    if (filters?.state) query = query.eq('location->>state', filters.state);
    if (filters?.constituency) query = query.ilike('constituency', `%${filters.constituency}%`);

    const { error, count } = await query;
    if (error) console.error("Error getting leader count:", error);
    return count ?? 0;
}

export async function getRatingCount(filters?: { startDate?: string, endDate?: string, state?: string, constituency?: string }): Promise<number> {
    let query = supabaseAdmin.from('ratings').select('leader_id, leaders!inner(*)', { count: 'exact', head: true });
    
    if (filters?.startDate) query = query.gte('created_at', filters.startDate);
    if (filters?.endDate) query = query.lte('created_at', filters.endDate);
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
    .select('*, user_name:users(name)')
    .order('created_at', { ascending: false });

  if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
  if (filters.dateTo) query = query.lte('created_at', filters.dateTo);
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
      user_name: (leader.user_name as any)?.name ?? 'Admin/System',
      previous_elections: leader.previous_elections || []
  }));
}

export async function approveLeader(leaderId: string): Promise<void> {
    await updateLeaderStatus(leaderId, 'approved', 'Approved by admin.');
}

export async function updateLeaderStatus(leaderId: string, status: 'pending' | 'approved' | 'rejected', adminComment: string | null): Promise<void> {
  const { error } = await supabaseAdmin
    .from('leaders')
    .update({ status, admin_comment: adminComment })
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
    }
}
