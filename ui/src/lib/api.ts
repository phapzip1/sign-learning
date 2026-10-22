/**
 * HTTP client for the ASP.NET Core API and the sign recognition service.
 *
 * Every function returns the parsed response data and throws an AxiosError when the
 * request fails; turn that into a user-facing message with toApiError (lib/errors.ts).
 * Base URLs come from VITE_API_URL and VITE_INFERENCE_URL (see ui/README.md).
 */

/// <reference types="vite/client" />
import axios from "axios";
import qs from "qs";
import { createServerFn } from "@tanstack/react-start";
import { auth, clerkClient } from "@clerk/tanstack-react-start/server";
import { RemoteWordCard, RemoteWordItem, RemoteWordListResponse, WordItem, WordLevel, WORDSORTs, WordUpsertPayload } from "@/src/types/word.type";
import { TOPICS, WORD_TOPICS } from "@/src/types/topic.type";
import { RemoteCollection, RemoteCollectionCard, RemoteCollectionUpsert } from "@/src/types/collection.type";
import { RemoteActivityPoint, RemoteDailyActivity } from "@/src/types/stats.type";
import { RemoteStudy, ReviewPayload } from "@/src/types/study.type";
import { isNotFound } from "@/src/lib/errors";
import { ApproveSuggestionPayload, CreateSuggestionPayload, RemoteRejectSuggestion, RemoteSuggestionApproval, SuggestionStatus, WordSuggestion } from "@/src/types/suggestion.type";

// Override per environment with VITE_API_URL / VITE_INFERENCE_URL (e.g. in .env.local).
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5026",
    timeout: 15_000,
    headers: {
        "Content-Type": "application/json"
    }
});

// Inference decodes and runs the model over the whole clip, so allow it longer.
const ai = axios.create({
    baseURL: import.meta.env.VITE_INFERENCE_URL ?? "http://localhost:8080",
    timeout: 60_000,
});

/**
 * Sends a recorded clip to the recognition service (POST /predict).
 * @param video Recorded chunks, combined into one uploaded file.
 * @returns The top 5 sign labels mapped to raw model scores (not probabilities).
 */
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

/** Fetches one dictionary word (GET /api/words/{id}) and maps it to a WordItem. */
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

/**
 * Searches the dictionary (GET /api/words). Defaults: first page, 8 per page,
 * the first sort order and all levels. Topic ids map to TOPICS in types/topic.type.ts.
 */
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

/**
 * Lists the user's decks with today's study counts (GET /api/decks).
 * @param auth Full Authorization header value: "Bearer <Clerk session token>".
 */
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

// Full deck configuration, including its study settings (DeckConfigDTO).
const getCollection = async (deckId: string, auth: string) => {
    const { data } = await api.get<RemoteCollection>(`api/decks/${deckId}`, {
        headers: {
            "Authorization": auth
        }
    });

    return data;
}

/**
 * Lists the cards in a deck (GET /api/decks/{deckId}/cards).
 * @param auth Full Authorization header value: "Bearer <Clerk session token>".
 */
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

/**
 * Creates a deck (POST /api/decks). Omitted settings use the server defaults.
 * @param auth Full Authorization header value: "Bearer <Clerk session token>".
 */
const createCollection = async (params: RemoteCollectionUpsert, auth: string) => {
    const { data } = await api.post<RemoteCollection>("api/decks", params, {
        headers: {
            "Authorization": auth
        }
    });

    return data;
}

/**
 * Updates a deck (PUT /api/decks/{id}). Only the fields present are changed.
 * @param auth Full Authorization header value: "Bearer <Clerk session token>".
 */
const updateCollection = async (collection: string, payload: RemoteCollectionUpsert, auth: string) => {

    const { data } = await api.put<RemoteCollection>(`api/decks/${collection}`, payload, {
        headers: {
            "Authorization": auth
        }
    });

    return data;
}

/**
 * Deletes a deck with its cards and review history (DELETE /api/decks/{id}).
 * @param auth Full Authorization header value: "Bearer <Clerk session token>".
 */
const deleteCollection = async (collection: string, auth: string) => {
    const { data } = await api.delete<RemoteCollection>(`api/decks/${collection}`, {
        headers: {
            "Authorization": auth
        }
    });

    return data;
}


// Returns the id of the user's deck that holds this word, or null when the
// word isn't in any deck (the API answers 404 in that case).
const belongCollection = async (wordId: number, auth: string): Promise<string | null> => {
    try {
        const { data } = await api.get<RemoteCollection>(`api/words/${wordId}/deck`, {
            headers: {
                "Authorization": auth
            }
        });

        return data.id;
    } catch (error) {
        if (isNotFound(error)) {
            return null;
        }

        throw error;
    }
}

const addNewCards = async (deckId: string, wordIds: number[], auth: string) => {
    // Mirrors IDeckService.AddWordToDeckResult. A user holds at most one card per
    // word, so adding a word that lives in another deck moves that card here.
    const { data } = await api.post<{ added: number; moved: number; alreadyInDeck: number }>(
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

/**
 * Current study streak in days (GET /api/stats/streak).
 * @param auth Full Authorization header value: "Bearer <Clerk session token>".
 */
const getStreakStats = async (auth: string) => {
    const { data } = await api.get<{ currentStreak: number; }>("/api/stats/streak", {
        headers: {
            "Authorization": auth,
        }
    });

    return data.currentStreak;
}

/**
 * Review counts for every day of a year, for the study calendar (GET /api/stats/activity/{year}).
 * @param auth Full Authorization header value: "Bearer <Clerk session token>".
 */
const getHeatmapStats = async (year: number, auth: string) => {
    const { data } = await api.get<RemoteDailyActivity>(`/api/stats/activity/${year}`, {
        headers: {
            "Authorization": auth,
        }
    });

    return data;
}

/**
 * Daily review counts for the activity chart (GET /api/stats/line-chart/{period}).
 * @param period 0 = last week, 1 = last month, 2 = last quarter.
 * @param auth Full Authorization header value: "Bearer <Clerk session token>".
 */
const getChartStats = async (period: number, auth: string) => {
    const { data } = await api.get<RemoteActivityPoint>(`/api/stats/line-chart/${period}`, {
        headers: {
            "Authorization": auth,
        }
    });

    return data;
}

/**
 * Years that contain reviews, newest first (GET /api/stats/years).
 * @param auth Full Authorization header value: "Bearer <Clerk session token>".
 */
const getYearsStats = async (auth: string) => {
    const { data } = await api.get<number[]>("/api/stats/years", {
        headers: {
            "Authorization": auth,
        }
    });

    return data;
}

/**
 * Gets a deck's study state and next card (GET /api/decks/{deckId}/study).
 * @param token Clerk session token (without "Bearer").
 */
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

/**
 * Submits a rating for a card (POST /api/decks/{deckId}/cards/{cardId}/review).
 * `reviewData.clientEventId` must be unique per rating so retries are not counted twice.
 * @param token Clerk session token (without "Bearer").
 */
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

/**
 * Server function (runs on the TanStack Start server, never in the browser) that pages
 * through Clerk users for the admin Users tab. Uses CLERK_SECRET_KEY and refuses callers
 * whose session token lacks role "admin".
 */
const getAdminUsers = createServerFn({ method: "GET" })
    .validator((data: {
        page: number;
        pageSize: number;
        search?: string;
    }) => data)
    .handler(async ({ data }) => {
        // This handler reads Clerk directly with the secret key, so it must enforce
        // the same rule as the API's "Admin" policy: a signed-in user whose session
        // token carries role "admin".
        const { userId, sessionClaims } = await auth();

        if (!userId) {
            throw new Error("Unauthorized");
        }

        if ((sessionClaims as { role?: unknown } | null)?.role !== "admin") {
            throw new Error("Forbidden");
        }

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

/**
 * Lists word suggestions for moderation (GET /api/admin/word-suggestions), optionally by status.
 * @param token Clerk session token (without "Bearer").
 */
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

/**
 * Lists the user's own suggestions (GET /api/word-suggestions/mine).
 * @param token Clerk session token (without "Bearer").
 */
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

/**
 * Approves a suggestion and creates the word (POST /api/admin/word-suggestions/{id}/approve).
 * @param token Clerk session token (without "Bearer").
 */
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

/**
 * Rejects a suggestion with a reason (POST /api/admin/word-suggestions/{id}/reject).
 * @param token Clerk session token (without "Bearer").
 */
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

/**
 * Adds a dictionary word (POST /api/words, admins only).
 * @param token Clerk session token (without "Bearer").
 */
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

/**
 * Edits a dictionary word (PUT /api/words/{id}, admins only).
 * @param token Clerk session token (without "Bearer").
 */
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

/**
 * Deletes a dictionary word (DELETE /api/words/{id}, admins only).
 * @param token Clerk session token (without "Bearer").
 */
const deleteWord = async (wordId: number, token: string) => {
    await api.delete(`/api/words/${wordId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
};

/**
 * Submits a new word suggestion (POST /api/word-suggestions).
 * @param token Clerk session token (without "Bearer").
 */
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

/**
 * Development helper: the claims in the caller's token (GET /api/users/claims).
 * @param token Clerk session token (without "Bearer").
 */
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
    getCollection,
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
    deleteWord,
    getClaims,
}