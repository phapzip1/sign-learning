import axios from "axios";
import qs from "qs";
import { RemoteWordCard, RemoteWordItem, WordItem, WordLevel, WORDSORTs } from "@/src/types/word.type";
import { TOPICS } from "@/src/types/topic.type";
import { RemoteCollection, RemoteCollectionCard, RemoteCollectionUpsert } from "@/src/types/collection.type";

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
        topic: TOPICS.find((topic) => topic.id === data.topic) ?? TOPICS[TOPICS.length - 1],
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

    const { data, status, statusText } = await api.get<{ page: number; pageSize: number; totalPages: number; items: RemoteWordItem[] }>(`api/words`, {
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
            topic: TOPICS.find((topic) => topic.id === item.topic) ?? TOPICS[TOPICS.length - 1],
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

    if (status !== 200) {
        return null;
    }

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
}