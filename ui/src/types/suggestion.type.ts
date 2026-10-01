import { WordLevel } from "@/src/types/word.type";
import { Topic, TopicId } from "@/src/types/topic.type";

export type SuggestionStatus = "Pending" | "Approved" | "Rejected";


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

export type WordForm = {
    value: string;
    meaning: string;
    cover: string;
    demoURL: string;
    instruction: string;
    level: WordLevel;
    topic: TopicId;
};

export type CreateSuggestionPayload = {
    value: string;
    meaning: string;

    level: WordLevel;
    topic: number;

    demoURL?: string;
    instruction?: string;
    note?: string;
};

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

export type RemoteRejectSuggestion = {
    reviewNote?: string;
};

export type RemoteSuggestionApproval = {
    suggestionId: string;
    wordId: number;
    status: SuggestionStatus;
};

