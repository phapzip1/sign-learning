namespace Service.DTOs
{
    public class DeckInfoDTO
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;

        public int New { get; set; }

        public int Learning { get; set; }

        public int Due { get; set; }

        public int TotalCards { get; set; }

        public DateTime? NextDueAt { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class DeckConfigDTO
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;

        public int[] LearningSteps { get; set; } = [60, 600];
        public int[] RelearningSteps { get; set; } = [600];
        public uint MaximumInterval { get; set; } = 36500;

        public uint NewCardsPerDay { get; set; } = 20;
        public uint MaximumReviewsPerDay { get; set; } = 200;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}