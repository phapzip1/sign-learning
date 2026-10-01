import axios from "axios";
import qs from "qs";
import { createServerFn } from "@tanstack/react-start";
import { clerkClient } from "@clerk/tanstack-react-start/server";
import { RemoteWordCard, RemoteWordItem, RemoteWordListResponse, WordItem, WordLevel, WORDSORTs, WordUpsertPayload } from "@/src/types/word.type";
import { TOPICS, WORD_TOPICS } from "@/src/types/topic.type";
import { RemoteCollection, RemoteCollectionCard, RemoteCollectionUpsert } from "@/src/types/collection.type";
import { RemoteActivityPoint, RemoteDailyActivity } from "@/src/types/stats.type";
import { RemoteStudy, ReviewPayload } from "@/src/types/study.type";
import { ApproveSuggestionPayload, CreateSuggestionPayload, RemoteRejectSuggestion, RemoteSuggestionApproval, SuggestionStatus, WordSuggestion } from "@/src/types/suggestion.type";

const api = axios.create({
    baseURL: "http://localhost:5026",
    headers: {
        "Content-Type": "application/json"
    }
});

const ai = axios.create({
    baseURL: "http://localhost:8080"
});

const searchBySign = async (video: Blob[]) => {
    const file = new File(video, "temp");

    const body = new FormData();
    body.append("video", file);

    const { data, status, statusText } = await ai.post<Record<string, number>>("/predict", body, {
        headers: {
            "Content-Type": "multipart/form-data",
        }
    });

    if (status !== 200) {
        throw new Error(statusText);
    }

    return data;
}

const getWord = async (id: string) => {
    const { data, status, statusText } = await api.get<RemoteWordItem>(`api/words/${id}`);

    if (status !== 200) {
        throw new Error(statusText);
    }

    return {
        id: data.id,
        title: data.value,
        demo: data.demoURL,
        cover: data.cover,
        instruction: data.instruction,
        description: data.meaning,
        level: data.level,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        topic: TOPICS.find((topic) => topic.name === data.topic) ?? TOPICS[TOPICS.length - 1],
    } satisfies WordItem;
}

const getWordList = async (params: {
    search?: string;
    topic?: number;
    levels?: WordLevel[],
    page?: number;
    pageSize?: number;
    sortId?: number,
}) => {

    params.pageSize ??= 8;
    params.sortId ??= WORDSORTs[0].value;
    params.page ??= 0;
    params.levels ??= ["Beginner", "Intermediate", "Advance"];

    const { data, status, statusText } = await api.get<RemoteWordListResponse>(`api/words`, {
        params: {
            ...params,
            sort: params.sortId
        },
        paramsSerializer: params => {
            return qs.stringify(params);
        }
    });

    if (status !== 200) {
        throw new Error(statusText);
    }


    return {
        ...data,
        items: data.items.map(item => ({
            id: item.id,
            title: item.value,
            demo: item.demoURL,
            instruction: item.instruction,
            description: item.meaning,
            level: item.level,
            cover: item.cover,
            topic: WORD_TOPICS.find(topic => item.topic === topic.name) || WORD_TOPICS[WORD_TOPICS.length - 1],
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        } satisfies WordItem))
    };
}

const getCollections = async (auth: string) => {
    const { data, status, statusText } = await api.get<RemoteCollectionCard[]>("api/decks", {
        headers: {
            "Authorization": auth
        }
    });

    if (status !== 200) {
        throw new Error(statusText);
    }

    return data;
}

const getCards = async (deckId: string, auth: string) => {
    const { data, status, statusText } = await api.get<RemoteWordCard[]>(`api/decks/${deckId}/cards`, {
        headers: {
            "Authorization": auth
        }
    });

    if (status !== 200) {
        throw new Error(statusText);
    }

    return data;
}

const createCollection = async (params: RemoteCollectionUpsert, auth: string) => {
    const { data } = await api.post<RemoteCollection>("api/decks", params, {
        headers: {
            "Authorization": auth
        }
    });

    return data;
}

const updateCollection = async (collection: string, payload: RemoteCollectionUpsert, auth: string) => {

    const { data } = await api.put<RemoteCollection>(`api/decks/${collection}`, payload, {
        headers: {
            "Authorization": auth
        }
    });

    return data;
}

const deleteCollection = async (collection: string, auth: string) => {
    const { data } = await api.delete<RemoteCollection>(`api/decks/${collection}`, {
        headers: {
            "Authorization": auth
        }
    });

    return data;
}


const belongCollection = async (wordId: number, auth: string) => {
    const { data, status } = await api.get<RemoteCollection>(`api/words/${wordId}/deck`, {
        headers: {
            "Authorization": auth
        }
    });

    return data.id;
}

const addNewCards = async (deckId: string, wordIds: number[], auth: string) => {
    const { data } = await api.post<{ added: number; alreadyFound: number; notFound: number }>(
        `api/decks/${deckId}/words`,
        {
            wordIds: wordIds
        },
        {
            headers: {
                "Content-Type": "application/json",
                "Authorization": auth,
            },
        }
    );

    return data;
}

const getStreakStats = async (auth: string) => {
    const { data } = await api.get<{ currentStreak: number; }>("/api/stats/streak", {
        headers: {
            "Authorization": auth,
        }
    });

    return data.currentStreak;
}

const getHeatmapStats = async (year: number, auth: string) => {
    const { data } = await api.get<RemoteDailyActivity>(`/api/stats/activity/${year}`, {
        headers: {
            "Authorization": auth,
        }
    });

    return data;
}

const getChartStats = async (period: number, auth: string) => {
    const { data } = await api.get<RemoteActivityPoint>(`/api/stats/line-chart/${period}`, {
        headers: {
            "Authorization": auth,
        }
    });

    return data;
}

const getYearsStats = async (auth: string) => {
    const { data } = await api.get<number[]>("/api/stats/years", {
        headers: {
            "Authorization": auth,
        }
    });

    return data;
}

const getStudy = async (deckId: string, token: string) => {
    const { data } = await api.get<RemoteStudy>(`/api/decks/${deckId}/study`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return data;
};

const reviewCard = async (cardId: string, deckId: string, reviewData: ReviewPayload, token: string) => {
    const { data } = await api.post<RemoteStudy>(`/api/decks/${deckId}/cards/${cardId}/review`,
        reviewData,
        {
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        }
    );

    return data;
}

const getAdminUsers = createServerFn({ method: "GET" })
    .validator((data: {
        page: number;
        pageSize: number;
        search?: string;
    }) => data)
    .handler(async ({ data }) => {
        const page = Math.max(1, data.page);
        const pageSize = Math.min(
            Math.max(1, data.pageSize),
            100
        );

        const offset = (page - 1) * pageSize;

        const client = clerkClient({
            secretKey: process.env.CLERK_SECRET_KEY,
        });

        const result = await client.users.getUserList({
            limit: pageSize,
            offset,
            orderBy: "-created_at",
            ...(data.search?.trim()
                ? {
                    query:
                        data.search.trim(),
                }
                : {}),
        });

        return {
            page,
            pageSize,

            total: result.totalCount,

            totalPages: Math.ceil(
                result.totalCount / pageSize
            ),

            items: result.data.map(
                user => ({
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.primaryEmailAddress?.emailAddress ?? "",
                    imageUrl: user.imageUrl,
                    createdAt: user.createdAt,
                    lastSignInAt: user.lastSignInAt,
                })
            ),
        };
    });

const getAdminSuggestions = async (status: SuggestionStatus | undefined, token: string) => {
    const { data } = await api.get<WordSuggestion[]>("/api/admin/word-suggestions",
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },

            params: status
                ? {
                    status,
                }
                : undefined,
        }
    );

    return data;
};

const getSuggestions = async (token: string): Promise<WordSuggestion[]> => {
    const { data } = await api.get<WordSuggestion[]>("/api/word-suggestions/mine",
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return data;
};

const approveSuggestion = async (suggestionId: string, payload: ApproveSuggestionPayload, token: string) => {
    const { data } = await api.post<RemoteSuggestionApproval>(`/api/admin/word-suggestions/${suggestionId}/approve`,
        payload,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return data;
};

const rejectSuggestion = async (suggestionId: string, payload: RemoteRejectSuggestion, token: string) => {
    const { data } = await api.post<WordSuggestion>(`/api/admin/word-suggestions/${suggestionId}/reject`,
        payload,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return data;
};

const createWord = async (payload: WordUpsertPayload, token: string) => {
    const { data } = await api.post<RemoteWordItem>("/api/words",
        payload,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return data;
};

const updateWord = async (wordId: number, payload: WordUpsertPayload, token: string) => {
    const { data } = await api.put<RemoteWordItem>(`/api/words/${wordId}`,
        payload,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return data;
};

const createSuggestion = async (payload: CreateSuggestionPayload, token: string) => {
    const { data } = await api.post<WordSuggestion>("/api/word-suggestions",
        payload,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return data;
}

const getClaims = async (token: string) => {
    const { data } = await api.get<{ type: string; value: string; }>("/api/users/claims",
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return data;
}

export {
    getWord,
    getWordList,
    getCollections,
    getCards,
    belongCollection,
    createCollection,
    updateCollection,
    deleteCollection,
    addNewCards,
    searchBySign,
    getStreakStats,
    getHeatmapStats,
    getChartStats,
    getYearsStats,
    getStudy,
    reviewCard,
    getAdminUsers,
    getAdminSuggestions,
    getSuggestions,
    createSuggestion,
    approveSuggestion,
    rejectSuggestion,
    createWord,
    updateWord,
    getClaims,
}