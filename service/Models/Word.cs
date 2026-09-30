namespace Service.Models
{
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

    public enum Level
    {
        Beginner = 1,
        Intermediate,
        Advance
    }

    public class Word
    {
        public uint Id { get; set; }
        public string Value { get; set; } = null!;
        public string Cover {get; set;} = null!;

        public string Meaning { get; set; } = null!;
        public Level Level { get; set; } = Level.Beginner;
        public string DemoURL { get; set; } = null!;

        public string Instruction { get; set; } = null!;
        public Topic Topic { get; set; } = Topic.Other;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}