/** Word suggestion types, matching the suggestion endpoints of the API. */

import { WordLevel } from "@/src/types/word.type";
import { Topic, TopicId } from "@/src/types/topic.type";

/** Moderation status of a suggestion. */
export type SuggestionStatus = "Pending" | "Approved" | "Rejected";


/** A suggestion as returned to learners and admins. */
export type WordSuggestion = {
    id: string;

    userId: string;

    value: string;

    meaning: string;

    level: WordLevel;

    topic: Topic["name"];

    cover?: string | null;

    demoURL?: string | null;

    instruction?: string | null;

    note?: string | null;

    status: SuggestionStatus;

    approvedWordId?: number | null;

    reviewNote?: string | null;

    createdAt: string;

    reviewedAt?: string | null;
};

/** Not used; the admin word editor defines its own form type. */
export type WordForm = {
    value: string;
    meaning: string;
    cover: string;
    demoURL: string;
    instruction: string;
    level: WordLevel;
    topic: TopicId;
};

/** Body for submitting a suggestion. */
export type CreateSuggestionPayload = {
    value: string;
    meaning: string;

    level: WordLevel;
    topic: number;

    demoURL?: string;
    instruction?: string;
    note?: string;
};

/** Body for approving: optional corrections applied before the word is created. */
export type ApproveSuggestionPayload = {
    value?: string;
    meaning?: string;

    // Admin provides the cover when creating
    // the final Word.
    cover: string;

    demoURL?: string;
    instruction?: string;

    level?: WordLevel;
    topic?: number;

    reviewNote?: string;
};

/** Body for rejecting: the reason shown to the learner. */
export type RemoteRejectSuggestion = {
    reviewNote?: string;
};

/** Result of an approval, including the new word's id. */
export type RemoteSuggestionApproval = {
    suggestionId: string;
    wordId: number;
    status: SuggestionStatus;
};

