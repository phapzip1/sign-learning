namespace Service.DTOs
{
    /// <summary>A deck as shown in deck lists: name plus today's study counts.</summary>
    public class DeckInfoDTO
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;

        /// <summary>New cards that can still be introduced today (limited by the deck's new-cards-per-day setting).</summary>
        public int New { get; set; }

        /// <summary>Learning or relearning cards that are due now.</summary>
        public int Learning { get; set; }

        /// <summary>Learned (review) cards that are due now.</summary>
        public int Due { get; set; }

        public int TotalCards { get; set; }

        /// <summary>When the next card becomes due, if none are due now.</summary>
        public DateTime? NextDueAt { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    /// <summary>A deck with all of its study settings, returned when a deck is read, created or updated. Step values are in seconds.</summary>
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