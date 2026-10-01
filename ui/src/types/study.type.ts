export enum RecallRating {
    again = 0,
    hard,
    good,
    easy,
}

export type RemoteStudyCard = {
    id: string;
    wordId: number;

    value: string;
    meaning: string;
    demoURL: string;
    instruction?: string;

    state: number;
};

export type ReviewPayload = {
    rating: RecallRating;
    reviewDuration?: number;
    clientEventId: string;
}

export type RemoteStudy = {
    new: number;
    learning: number;
    due: number;

    canStudy: boolean;

    currentCard: RemoteStudyCard | null;

    nextDueAt: string | null;
};