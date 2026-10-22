/** Dictionary word types. "Remote" types match the API's JSON; WordItem is the UI shape. */

import { Topic } from "@/src/types/topic.type";

/** Sort options for the word list; `value` matches the API's SortDTO enum. */
export const WORDSORTs = [
    { value: 0, label: "A - Z" },
    { value: 1, label: "Z - A" },
    { value: 2, label: "Begginer - Advance" },
    { value: 3, label: "Advance - Begginer" },
    { value: 4, label: "Newest" },
    { value: 5, label: "Oldest" },
] as const;

/** Difficulty level as the API sends it (enum name). */
export type WordLevel = "Beginner" | "Intermediate" | "Advance";

export const WORD_LEVELS: WordLevel[] = ["Beginner", "Intermediate", "Advance"];


/** A word as the UI uses it (API field names mapped to friendlier ones, topic resolved). */
export type WordItem = {
    id: number;
    title: string;
    description: string;
    demo: string;
    instruction: string;
    level: WordLevel;
    topic: Topic;
    cover: string;
    createdAt: string;
    updatedAt: string;
}

/** A word as returned by the API. */
export type RemoteWordItem = {
    id: number;
    value: string;
    meaning: string;
    demoURL: string;
    cover: string;
    instruction: string;
    level: WordLevel;
    topic: Topic["name"];
    createdAt: string;
    updatedAt: string;
}

/** A card inside a deck, as returned by GET /api/decks/{id}/cards. */
export type RemoteWordCard = {
    id: string;
    wordId: number;
    title: string;
    value: string;
    meaning: string;
    level: WordLevel;
    topic: string;
    state: "New" | "Learning" | "Due";
    updatedAt: string;
}

/** Body for creating or editing a word (admin). */
export type WordUpsertPayload = {
    value: string;
    cover: string;
    meaning: string;
    level: WordLevel;
    demoURL: string;
    instruction: string;
    topic: number;
};

/** One page of words from GET /api/words. */
export type RemoteWordListResponse = {
    page: number;
    pageSize: number;
    totalPages: number;
    items: RemoteWordItem[];
}