import { WordItem } from "@/src/types/word.type";

export type Collection = {
    id: number;
    title: string;
    description: string;
    stats?: {
        new: number;
        learn: number;
        due: number;
    }
}