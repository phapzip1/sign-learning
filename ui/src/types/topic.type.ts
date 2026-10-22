/** Dictionary topics. Ids match the API's Topic enum; 999 is the UI-only "All" filter. */

export const TOPICS = [
    { id: 999, name: "All", value: "All" },
    { id: 0, name: "FamilyAndPeople", value: "Family And People" },
    { id: 1, name: "PlacesAndTransportation", value: "Places And Transportation" },
    { id: 2, name: "AnimalsAndInsects", value: "Animals And Insects" },
    { id: 3, name: "FoodAndDrinks", value: "Food And Drinks" },
    { id: 4, name: "HomeAndFurniture", value: "Home And Furniture" },
    { id: 5, name: "FeelingsAndEmotions", value: "Feelings And Emotions" },
    { id: 6, name: "ActionsAndVerbs", value: "Actions And Verbs" },
    { id: 7, name: "Other", value: "Other" },
] as const;

/** Real topics only (without "All"), for forms and lookups. */
export const WORD_TOPICS = TOPICS.filter((topic): topic is Exclude<Topic, { id: 999 }> => topic.id !== 999);

export type Topic = (typeof TOPICS)[number];

/** Id of a real topic (excludes the "All" filter). */
export type TopicId = Exclude<Topic["id"], 999>;





















