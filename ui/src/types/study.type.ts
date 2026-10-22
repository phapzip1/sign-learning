/** Flashcard study types, matching the study endpoints of the API. */

/** How well the learner remembered a card. */
export type RecallRating = "Again" | "Hard" | "Good" | "Easy";

/** The card to show next, with the word it teaches. */
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

/** Body for submitting a rating; clientEventId must be unique per rating. */
export type ReviewPayload = {
    rating: RecallRating;
    reviewDuration?: number;
    clientEventId: string;
}

/** A deck's study state: today's counts, the next card (null when done) and when the next card is due. */
export type RemoteStudy = {
    new: number;
    learning: number;
    due: number;

    canStudy: boolean;

    currentCard: RemoteStudyCard | null;

    nextDueAt: string | null;
};