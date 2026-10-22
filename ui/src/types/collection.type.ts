/** Deck ("collection") types. Field names match the API's JSON. */

/** Early prototype shape. Not used. */
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
/** A deck with its study settings (step values in seconds), as returned by GET /api/decks/{id}. */
export type RemoteCollection = {
    id: string;
    name: string;
    description: string;
    learningSteps: number[];
    relearningSteps: number[];
    maximumInterval: number;
    newCardsPerDay: number;
    maximumReviewsPerDay: number;
    updatedAt: Date;
    createdAt: Date;
}

/** A deck in a list, with today's new/learning/due counts (GET /api/decks). */
export type RemoteCollectionCard = {
    id: string;
    name: string;
    description: string;
    updatedAt: Date;
    createdAt: Date;
    new: number;
    learning: number;
    due: number;
}

/** Body for creating or updating a deck. Omitted fields keep their current (or default) value. */
export type RemoteCollectionUpsert = {
    name?: string;
    description?: string;
    learningSteps?: number[];
    relearningSteps?: number[];
    maximumInterval?: number;
    newCardsPerDay?: number;
    maximumReviewsPerDay?: number;

}