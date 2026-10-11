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

export type RemoteCollectionUpsert = {
    name?: string;
    description?: string;
    learningSteps?: number[];
    relearningSteps?: number[];
    maximumInterval?: number;
    newCardsPerDay?: number;
    maximumReviewsPerDay?: number;

}