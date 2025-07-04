
'use server';

import { supabaseAdmin, handleSupabaseError } from '@/lib/supabase';
import type { User } from './users';

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

// Public API gets only approved leaders
export async function getLeaders(): Promise<Leader[]> {
  const { data, error } = await supabaseAdmin
    .from('leaders')
    .select('*')
    .eq('status', 'approved');
  return handleSupabaseError({ data, error }, 'getLeaders') || [];
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
        .from('leaders')
        .select('*')
        .eq('id', id)
        .single();
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
        .eq('id', leaderId)
        .select()
        .single();

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

    return getLeaderById(leaderId);
}

export async function getReviewsForLeader(leaderId: string): Promise<Review[]> {
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
}


export async function getLeadersAddedByUser(userId: string): Promise<Leader[]> {
  const { data, error } = await supabaseAdmin
    .from('leaders')
    .select('*')
    .eq('added_by_user_id', userId)
    .order('name', { ascending: true });
  return handleSupabaseError({ data, error }, 'getLeadersAddedByUser') || [];
}


export async function getLeaderCount(filters?: { startDate?: string, endDate?: string, state?: string, constituency?: string }): Promise<number> {
    let query = supabaseAdmin.from('leaders').select('*', { count: 'exact', head: true });
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
    }
}
