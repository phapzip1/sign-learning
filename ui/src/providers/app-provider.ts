import { create } from "zustand";

type Role = "learner" | "admin";

type User = {
    uid: string;
    username: string;
    avatar: string;
    role: Role;
    favorites: number[];
    wordsLearned: number[];
}


type AppContextValue = {
    user?: User
    setUser: (user: User) => void;
    clearUser: () => void;
    toggleFavorite: (wordId: number) => void
    incrementFlashProgress: (wordId: number) => void
}

const useApp = create<AppContextValue>((set) => ({
    favorites: [],
    setUser: (User: User) => { },
    clearUser: () => {},
    toggleFavorite: (wordId: number) => { },
    incrementFlashProgress: (wordId: number) => { },
}));

export { useApp };