
'use server';

import { db, convertFirestoreData } from '@/lib/db';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

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
  active_until: any | null;
  created_at: any;
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

// --- Admin Panel Functions ---

export async function getPollsForAdmin(): Promise<PollListItem[]> {
    const snapshot = await db.collection('polls').orderBy('created_at', 'desc').get();
    if (snapshot.empty) return [];

    const polls = await Promise.all(snapshot.docs.map(async (doc) => {
        const pollData = doc.data();
        const responseCount = (await db.collection('poll_responses').where('poll_id', '==', doc.id).count().get()).data().count;
        const promoNotif = (await db.collection('notifications').where('link', '==', `/polls/${doc.id}`).limit(1).get());
        return {
            id: doc.id,
            title: pollData.title,
            is_active: pollData.is_active,
            active_until: pollData.active_until,
            created_at: pollData.created_at,
            response_count: responseCount,
            is_promoted: !promoNotif.empty
        } as PollListItem;
    }));
    
    return convertFirestoreData(polls);
}

export async function getPollForEdit(pollId: string): Promise<Poll | null> {
    const pollDoc = await db.collection('polls').doc(pollId).get();
    if (!pollDoc.exists) return null;

    const questionsSnapshot = await db.collection('polls').doc(pollId).collection('questions').orderBy('question_order').get();
    const questions = await Promise.all(questionsSnapshot.docs.map(async (qDoc) => {
        const optionsSnapshot = await qDoc.ref.collection('options').orderBy('option_order').get();
        const options = optionsSnapshot.docs.map(oDoc => ({ id: oDoc.id, ...oDoc.data() }) as PollOption);
        return { id: qDoc.id, ...qDoc.data(), options } as PollQuestion;
    }));

    const pollData = { id: pollDoc.id, ...pollDoc.data(), questions } as Poll;
    return convertFirestoreData(pollData);
}

export async function deletePoll(pollId: string): Promise<void> {
    // This requires a recursive delete, best handled by a Cloud Function.
    // For this prototype, we'll delete the poll doc, and related responses.
    // Subcollections (questions/options) will be orphaned.
    const pollRef = db.collection('polls').doc(pollId);
    const responsesSnapshot = await db.collection('poll_responses').where('poll_id', '==', pollId).get();
    
    const batch = db.batch();
    responsesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    batch.delete(pollRef);
    
    await batch.commit();
}

export async function upsertPoll(poll: Omit<Poll, 'created_at'>): Promise<Poll> {
    const batch = db.batch();
    const pollId = poll.id || db.collection('polls').doc().id;
    const pollRef = db.collection('polls').doc(pollId);

    batch.set(pollRef, {
        title: poll.title,
        description: poll.description || null,
        is_active: poll.is_active,
        active_until: poll.active_until ? Timestamp.fromDate(new Date(poll.active_until)) : null,
        created_at: poll.id ? poll.created_at : FieldValue.serverTimestamp(), // Keep original date on edit
    }, { merge: true });

    // For simplicity, we delete and re-add questions/options.
    // This is not ideal for preserving response data if questions change.
    const questionsRef = pollRef.collection('questions');
    const oldQuestionsSnapshot = await questionsRef.get();
    oldQuestionsSnapshot.forEach(doc => batch.delete(doc.ref));

    for (const q of poll.questions) {
        const questionRef = questionsRef.doc();
        batch.set(questionRef, {
            question_text: q.question_text,
            question_type: q.question_type,
            question_order: q.question_order,
        });
        for (const o of q.options) {
            batch.set(questionRef.collection('options').doc(), {
                option_text: o.option_text,
                option_order: o.option_order,
            });
        }
    }
    
    await batch.commit();
    return (await getPollForEdit(pollId))!;
}

export async function getPollResults(pollId: string): Promise<PollResult | null> {
    const poll = await getPollForEdit(pollId);
    if (!poll) return null;

    const responsesSnapshot = await db.collectionGroup('poll_answers').where('poll_id', '==', pollId).get();
    const totalResponses = (await db.collection('poll_responses').where('poll_id', '==', pollId).count().get()).data().count;

    if (totalResponses === 0) {
        return { pollTitle: poll.title, totalResponses: 0, genderDistribution: [], questions: [] };
    }

    const allAnswers = responsesSnapshot.docs.map(doc => doc.data());
    
    // This is simplified. Accurate gender distribution requires fetching each user.
    // We'll return a dummy distribution.
    const genderDistribution = [{name: 'Not Available', value: totalResponses}];
    
    const questions = poll.questions.map(q => {
        const answers = q.options.map(opt => {
            const count = allAnswers.filter(ans => ans.selected_option_id === opt.id).length;
            return { name: opt.option_text, value: count };
        });
        return { id: q.id, text: q.question_text, answers };
    });

    return { pollTitle: poll.title, totalResponses, genderDistribution, questions };
}


// --- User Facing Functions ---

export async function getActivePollsForUser(userId: string | null): Promise<(PollListItem & { user_has_voted: boolean })[]> {
    const snapshot = await db.collection('polls')
        .where('is_active', '==', true)
        // .where('active_until', '>=', new Date()) // Firestore does not allow two inequality filters
        .orderBy('created_at', 'desc').get();
        
    let polls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    polls = polls.filter(p => !p.active_until || (p.active_until as Timestamp).toDate() >= new Date());

    const enrichedPolls = await Promise.all(polls.map(async (poll) => {
        let hasVoted = false;
        if (userId) {
            const responseDoc = await db.collection('poll_responses').where('poll_id', '==', poll.id).where('user_id', '==', userId).limit(1).get();
            hasVoted = !responseDoc.empty;
        }
        const responseCount = (await db.collection('poll_responses').where('poll_id', '==', poll.id).count().get()).data().count;

        return {
            id: poll.id,
            title: poll.title,
            description: poll.description,
            is_active: poll.is_active,
            active_until: poll.active_until,
            created_at: poll.created_at,
            response_count: responseCount,
            user_has_voted: hasVoted
        };
    }));

    return convertFirestoreData(enrichedPolls);
}

export async function getPollForParticipation(pollId: string, userId: string | null): Promise<PollForParticipation | null> {
    const poll = await getPollForEdit(pollId);
    if (!poll) return null;

    let hasVoted = false;
    if (userId) {
        const responseSnapshot = await db.collection('poll_responses').where('poll_id', '==', pollId).where('user_id', '==', userId).limit(1).get();
        hasVoted = !responseSnapshot.empty;
    }

    return { ...poll, user_has_voted: hasVoted };
}

export async function submitPollResponse(pollId: string, userId: string, answers: PollAnswer[]): Promise<void> {
    const responseRef = db.collection('poll_responses').doc();
    const batch = db.batch();

    batch.set(responseRef, {
        poll_id: pollId,
        user_id: userId,
        created_at: FieldValue.serverTimestamp(),
    });

    for (const answer of answers) {
        const answerRef = db.collection('poll_answers').doc();
        batch.set(answerRef, {
            response_id: responseRef.id,
            poll_id: pollId, // Denormalize for easier querying
            question_id: answer.questionId,
            selected_option_id: answer.optionId
        });
    }

    await batch.commit();
}
