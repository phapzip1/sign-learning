import { Topic } from "@/src/types/topic.type";

export const WORDSORTs = [
    { value: 0, label: "A - Z" },
    { value: 1, label: "Z - A" },
    { value: 2, label: "Begginer - Advance" },
    { value: 3, label: "Advance - Begginer" },
    { value: 4, label: "Newest" },
    { value: 5, label: "Oldest" },
] as const;

export type WordLevel = "Beginner" | "Intermediate" | "Advance";

export type WordItem = {
    id: number;
    title: string;
    description: string;
    demo: string;
    instruction: string;
    level: WordLevel;
    topic: Topic;
    cover: string;
    createdAt: Date;
    updatedAt: Date;
}

export type RemoteWordItem = {
    id: number;
    value: string;
    meaning: string;
    demoURL: string;
    cover: string;
    instruction: string;
    level: WordLevel;
    topic: number;
    createdAt: Date;
    updatedAt: Date;
}

export type RemoteWordCard = {
    id: string;
    wordId: number;
    title: string;
    value: string;
    meaning: string;
    level: WordLevel;
    topic: string;
    state: "New" | "Learning" | "Due";
    updatedAt: Date;
}