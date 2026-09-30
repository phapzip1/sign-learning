const TOPICS = [
    { id: 999, value: "All"},
    { id: 0, value: "Family And People" },
    { id: 1, value: "Places And Transportation" },
    { id: 2, value: "Animals And Insects" },
    { id: 3, value: "Food And Drinks" },
    { id: 4, value: "Home And Furniture" },
    { id: 5, value: "Feelings And Emotions" },
    { id: 6, value: "Actions And Verbs" },
    { id: 7, value: "Other" },
] as const;

type Topic = typeof TOPICS[number]

export {
    TOPICS,
    type Topic
}