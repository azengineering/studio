
'use server';

<<<<<<< HEAD
import { supabaseAdmin, handleSupabaseError } from '@/lib/db';
import { PostgrestError } from '@supabase/supabase-js';
=======
import { supabase } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd

export type PollQuestionType = 'yes_no' | 'multiple_choice';

export interface PollOption {
  id: string;
  question_id: string;
  option_text: string;
  option_order: number;
}

export interface PollQuestion {
  id: string;
  poll_id: string;
  question_text: string;
  question_type: PollQuestionType;
  question_order: number;
  options: PollOption[];
}

export interface Poll {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  active_until: string | null;
  created_at: string;
  questions: PollQuestion[];
}

export interface PollListItem {
    id: string;
    title: string;
    is_active: boolean;
    active_until: string | null;
    created_at: string;
    response_count: number;
    is_promoted?: boolean;
}

export interface PollForParticipation extends Poll {
    user_has_voted: boolean;
}

export interface PollAnswer {
    questionId: string;
    optionId: string;
}

export interface PollResult {
    pollTitle: string;
    totalResponses: number;
    genderDistribution: { name: string; value: number }[];
    questions: {
        id: string;
        text: string;
        answers: { name: string; value: number }[];
    }[];
}

async function getPollResponseCount(pollId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
        .from('poll_responses')
        .select('*', { count: 'exact', head: true })
        .eq('poll_id', pollId);
    if (error) console.error(error);
    return count || 0;
}

// --- Admin Panel Functions ---

export async function getPollsForAdmin(): Promise<PollListItem[]> {
<<<<<<< HEAD
    const { data, error } = await supabaseAdmin
      .from('polls')
      .select('*, poll_responses(count), notifications(count)')
      .order('created_at', { ascending: false });

    if (error) return handleSupabaseError({ data: null, error }, 'getPollsForAdmin');

    return data.map((poll: any) => ({
      id: poll.id,
      title: poll.title,
      is_active: poll.is_active,
      active_until: poll.active_until,
      created_at: poll.created_at,
      response_count: poll.poll_responses[0]?.count || 0,
      is_promoted: (poll.notifications[0]?.count || 0) > 0,
    })) || [];
=======
    const { data, error } = await supabaseAdmin.rpc('get_admin_polls');
    if (error) {
        console.error("Error getting polls for admin:", error);
        return [];
    }
    return data;
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
}

export async function getPollForEdit(pollId: string): Promise<Poll | null> {
    const { data, error } = await supabaseAdmin
        .from('polls')
<<<<<<< HEAD
        .select('*, questions:poll_questions(*, options:poll_options(*))')
        .eq('id', pollId)
        .single();
    if (error) {
      console.error(error.message);
      return null;
    }
    // Sort questions and options
    data.questions.sort((a,b) => a.question_order - b.question_order);
    data.questions.forEach(q => q.options.sort((a,b) => a.option_order - b.option_order));
=======
        .select(`
            *,
            questions:poll_questions (
                *,
                options:poll_options (*)
            )
        `)
        .eq('id', pollId)
        .single();
    
    if (error) {
        console.error("Error getting poll for edit:", error);
        return null;
    }
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
    return data;
}

export async function deletePoll(pollId: string): Promise<void> {
    const { error } = await supabaseAdmin.from('polls').delete().eq('id', pollId);
<<<<<<< HEAD
    if (error) handleSupabaseError({ data: null, error }, 'deletePoll');
}

export async function upsertPoll(poll: Omit<Poll, 'created_at'>): Promise<Poll> {
    const { questions, ...pollData } = poll;
    const { data: savedPoll, error: pollError } = await supabaseAdmin
        .from('polls')
        .upsert({ ...pollData })
        .select()
        .single();
    
    if (pollError) throw pollError;
    const pollId = savedPoll.id;

    const { data: existingQuestions } = await supabaseAdmin.from('poll_questions').select('id').eq('poll_id', pollId);
    const existingQuestionIds = existingQuestions?.map(q => q.id) || [];
    const newQuestionIds = questions.map(q => q.id).filter(id => id);

    const questionsToDelete = existingQuestionIds.filter(id => !newQuestionIds.includes(id));
    if (questionsToDelete.length > 0) {
        await supabaseAdmin.from('poll_questions').delete().in('id', questionsToDelete);
    }
    
    for (const [qIndex, q] of questions.entries()) {
        const { options, ...questionData } = q;
        const { data: savedQuestion, error: qError } = await supabaseAdmin
            .from('poll_questions')
            .upsert({ ...questionData, poll_id: pollId, question_order: qIndex })
            .select()
            .single();

        if (qError) throw qError;
        const questionId = savedQuestion.id;

        const { data: existingOptions } = await supabaseAdmin.from('poll_options').select('id').eq('question_id', questionId);
        const existingOptionIds = existingOptions?.map(o => o.id) || [];
        const newOptionIds = options.map(o => o.id).filter(id => id);
        
        const optionsToDelete = existingOptionIds.filter(id => !newOptionIds.includes(id));
        if (optionsToDelete.length > 0) {
            await supabaseAdmin.from('poll_options').delete().in('id', optionsToDelete);
        }

        if (options.length > 0) {
            const optionsToSave = options.map((opt, oIndex) => ({
                ...opt,
                question_id: questionId,
                option_order: oIndex,
            }));
            const { error: optError } = await supabaseAdmin.from('poll_options').upsert(optionsToSave);
            if (optError) throw optError;
        }
    }
    
    return (await getPollForEdit(pollId))!;
}

export async function getPollResults(pollId: string): Promise<PollResult | null> {
    const poll = await getPollForEdit(pollId);
    if (!poll) return null;

    const { data: results, error } = await supabaseAdmin.rpc('get_poll_results', { p_poll_id: pollId });
    if (error) return handleSupabaseError({ data: null, error }, 'getPollResults');
    return results;
=======
    if (error) {
        console.error("Error deleting poll:", error);
        throw error;
    }
}

export async function upsertPoll(poll: Omit<Poll, 'created_at'>): Promise<Poll> {
    const { data, error } = await supabaseAdmin.rpc('upsert_poll', { poll_data: poll });
    if (error) {
        console.error("Error upserting poll:", error);
        throw error;
    }
    const newPoll = await getPollForEdit(data);
    return newPoll!;
}

export async function getPollResults(pollId: string): Promise<PollResult | null> {
    const { data, error } = await supabaseAdmin.rpc('get_poll_results', { p_poll_id: pollId });
    if (error) {
        console.error("Error getting poll results:", error);
        return null;
    }
    return data;
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
}

// --- User Facing Functions ---

export async function getActivePollsForUser(userId: string | null): Promise<(PollListItem & { user_has_voted: boolean; description: string | null; })[]> {
<<<<<<< HEAD
    const { data, error } = await supabaseAdmin.rpc('get_active_polls_for_user', { p_user_id: userId });
    return handleSupabaseError({data, error}, 'getActivePollsForUser') || [];
=======
    const { data, error } = await supabase.rpc('get_active_polls_for_user', { p_user_id: userId });
    if (error) {
        console.error("Error getting active polls:", error);
        return [];
    }
    return data;
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
}

export async function getPollForParticipation(pollId: string, userId: string | null): Promise<PollForParticipation | null> {
    const { data: poll, error } = await supabase
        .from('polls')
        .select(`
            *,
            questions:poll_questions (
                *,
                options:poll_options (*)
            )
        `)
        .eq('id', pollId)
        .single();

    if (error || !poll) {
        console.error("Error getting poll for participation:", error);
        return null;
    }

    let hasVoted = false;
    if (userId) {
<<<<<<< HEAD
        const { count } = await supabaseAdmin
          .from('poll_responses')
          .select('*', { count: 'exact', head: true })
          .match({ poll_id: pollId, user_id: userId });
        hasVoted = (count || 0) > 0;
=======
        const { data, error: voteError } = await supabase
            .from('poll_responses')
            .select('id', { count: 'exact', head: true })
            .eq('poll_id', pollId)
            .eq('user_id', userId);
            
        if (voteError) console.error("Error checking if user voted:", voteError);
        hasVoted = (data?.length ?? 0) > 0;
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
    }

    return { ...poll, user_has_voted: hasVoted };
}

export async function submitPollResponse(pollId: string, userId: string, answers: PollAnswer[]): Promise<void> {
<<<<<<< HEAD
    const { data, error } = await supabaseAdmin.rpc('submit_poll_response', {
        p_poll_id: pollId,
        p_user_id: userId,
        p_answers: answers.map(a => ({ question_id: a.questionId, option_id: a.optionId }))
    });

    if (error) handleSupabaseError({ data: null, error }, 'submitPollResponse');
=======
    const { error } = await supabase.rpc('submit_poll_response', {
        p_poll_id: pollId,
        p_user_id: userId,
        p_answers: answers
    });

    if (error) {
        console.error("Error submitting poll response:", error);
        throw new Error(error.message);
    }
>>>>>>> 8101b16b387c37d514d6ddc62cfef33abe62a5fd
}
