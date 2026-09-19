import { create } from "zustand";
import { api } from "@/src/lib/api";

type WordItem = {
    id: number;
    word: string;
}

type WordStore = {
    words: WordItem[];
    isLoading: boolean;
    error: string | null;
    hasFetched: boolean;

    fetchWords: () => Promise<void>;
    setWords: (words: WordItem[]) => void;
    clearWords: () => void;
}

const useWordStore = create<WordStore>()((set, get) => ({
    words: [],
    isLoading: false,
    error: null,
    hasFetched: false,

    fetchWords: async () => {
        const curr = get();
        if (curr.isLoading || curr.hasFetched) {
            return;
        }

        set({
            isLoading: true,
            error: null,
        });

        try {
            const resp = await api.get<WordItem[]>("/words");

            set({
                words: resp.data,
                isLoading: false,
                hasFetched: true,
            });

            console.log("Data");
        } catch (e) {
            set({
                error: e instanceof Error ? e.message : "something went wrong",
                isLoading: false,
                hasFetched: false
            });

        }
    },
    setWords: (words) => set({ words }),
    clearWords: () => {
        set({
            words: [],
            hasFetched: false,
            error: null,
        });
    }
}));

export {
    type WordItem,
    useWordStore,
}