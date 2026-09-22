export const WordKinds = ["noun", "verb", "adjective", "adverb", "other"] as const;

export type WordItem = {
    id: number;
    title: string;
    description: string;
    demo: string;
    instruction: string[];
    kind: typeof WordKinds[number];
    level: "beginner" | "intermediate" | "advance";
    createdAt: Date;
    updatedAt: Date;
}

export type StoredWordItem = {
    id: number;
    word: WordItem;
    state: "new" | "learn" | "due";
    collectionID: number;
    createdAt: Date;
}