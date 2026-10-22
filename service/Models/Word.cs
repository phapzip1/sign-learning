namespace Service.Models
{
    /// <summary>Dictionary topic of a word. Stored as an integer (FamilyAndPeople = 0 … Other = 7).</summary>
    public enum Topic
    {
        FamilyAndPeople = 0,
        PlacesAndTransportation,
        AnimalsAndInsects,
        FoodAndDrinks,
        HomeAndFurniture,
        FeelingsAndEmotions,
        ActionsAndVerbs,
        Other,
    }

    /// <summary>Difficulty level of a word. Stored as an integer (Beginner = 1, Intermediate = 2, Advance = 3).</summary>
    public enum Level
    {
        Beginner = 1,
        Intermediate,
        Advance
    }

    /// <summary>A dictionary entry: one sign with its meaning, media and signing instructions.</summary>
    public class Word
    {
        public uint Id { get; set; }
        /// <summary>The word itself. For signs the model can recognise, this matches the model's label exactly, so a sign search finds the entry.</summary>
        public string Value { get; set; } = null!;
        /// <summary>URL of an illustrative image; empty when none has been added.</summary>
        public string Cover {get; set;} = null!;

        /// <summary>Short definition shown on the word page and on flashcards.</summary>
        public string Meaning { get; set; } = null!;
        public Level Level { get; set; } = Level.Beginner;
        /// <summary>URL of the demonstration video (for example a YouTube link); empty when none has been added.</summary>
        public string DemoURL { get; set; } = null!;

        /// <summary>Written, step-by-step instructions for making the sign.</summary>
        public string Instruction { get; set; } = null!;
        public Topic Topic { get; set; } = Topic.Other;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}