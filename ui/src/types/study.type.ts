export type RecallRating = "Again" | "Hard" | "Good" | "Easy";

export type RemoteStudyCard = {
    id: string;
    state: number;

    word: {
        id: number;
        value: string;
        meaning: string;
        demoURL: string;
        instruction: string;
    };
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