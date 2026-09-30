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



export {
    MOCKTOPICS,
    MOCKCOLLECTIONS,
}