import {
    Activity,
    ArrowDown01,
    Clock,
    ForkKnife,
    Palette,
    Plane,
    Smile,
    SportShoe,
} from "lucide-react";
import { StoredWordItem, WordItem } from "@/src/types/word.type";

const MOCKTOPICS = [
    {
        id: "food",
        icon: ForkKnife,
        title: "Food",
        description: "Mock description",
    },
    {
        id: "travelling",
        icon: Plane,
        title: "Travelling",
        description: "Mock description",
    },
    {
        id: "sports",
        icon: SportShoe,
        title: "Food",
        description: "Mock description",
    },
    {
        id: "colors",
        icon: Palette,
        title: "Colors",
        description: "Mock description",
    },
    {
        id: "emotions",
        icon: Smile,
        title: "Emotions",
        description: "Mock description",
    },
    {
        id: "numbers",
        icon: ArrowDown01,
        title: "Numbers",
        description: "Mock description",
    },
    {
        id: "activities",
        icon: Activity,
        title: "Activities",
        description: "Mock description",
    },
    {
        id: "time",
        icon: Clock,
        title: "Time",
        description: "Mock description",
    },
];

const MOCKCOLLECTIONS = [
    {
        id: 1,
        title: "Important",
        description: "Important words",
        stats: {
            new: 10,
            learn: 0,
            due: 10,
        }
    }
];

const MOCKWORDS: WordItem[] = [
    {
        id: 1,
        title: "Home",
        description: "the house, apartment, etc. where you live, especially with your family",
        demo: "https://assets.mixkit.co/videos/41576/41576-720.mp4",
        instruction: [
            "Use your dominant hand (the hand you write or eat with).",
            `Bring your fingertips and your thumb together so they touch, resembling a flattened "O" or a beak shape. Keep your hand relaxed.`,
            "Touch your fingertips lightly to your cheek near the corner of your mouth. (Memory tip: This represents where you eat).",
            "Lift your hand slightly and arc it a couple of inches back along your cheek toward your ear, tapping your cheek a second time. (Memory tip: This represents where you sleep)."
        ],
        level: "advance",
        createdAt: new Date(Date.parse("April 16, 2002")),
        updatedAt: new Date(Date.parse("April 16, 2002")),
    },
];

const MOCKSTOREDWORDS: StoredWordItem[] = [
    {
        id: 1,
        word: MOCKWORDS[0],
        collectionID: 1,
        createdAt: new Date(Date.parse("April 16, 2002")),
        state: "new",
    }
]

export {
    MOCKTOPICS,
    MOCKCOLLECTIONS,
    MOCKWORDS,
    MOCKSTOREDWORDS
}