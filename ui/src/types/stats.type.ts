export type RemoteActivity = {
    date: string;
    count: number;
}

export type RemoteDailyActivity = {
    year: number;
    activities: {
        date: string;
        count: number;
        level: number;
    }[];
}

export type RemoteActivityPoint = {
    period: number;
    startDate: string;
    endDate: string,
    data: RemoteActivity[];
}

// export type RemoteStats = {
//     year: number;
//     currentStreak: number;
//     averageCardsPerDay: number;
//     totalReview: number;
//     activeDays: number;
//     heatmap: RemoteDailyActivity[];
//     activity: RemoteActivityPoint[];
// }