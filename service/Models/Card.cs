namespace Service.Models
{
    /// <summary>Where a card is in the learning process (stored as an integer: New = 0, Learning = 1, Review = 2, Relearning = 3).</summary>
    public enum LearningState
    {
        New = 0,
        Learning,
        Review,
        Relearning
    }

    /// <summary>One word in one deck, with its spaced-repetition (FSRS) state. A user has at most one card per word.</summary>
    public class Card
    {
        public string Id { get; set; } = null!;

        public uint WordId { get; set; }
        public Word Word { get; set; } = null!;

        public string DeckId { get; set; } = null!;
        public Deck Deck { get; set; } = null!;

        public LearningState State { get; set; }
        /// <summary>Index into the deck's learning or relearning steps; null once the card is in Review.</summary>
        public int? Step { get; set; }
        /// <summary>FSRS stability: roughly how many days the memory is expected to last.</summary>
        public float Stability { get; set; }
        /// <summary>FSRS difficulty of the card for this learner.</summary>
        public float Difficulty { get; set; }

        /// <summary>UTC time of the first review; used to count new cards introduced today.</summary>
        public DateTime? FirstReviewAt { get; set; }
        public DateTime? LastReviewAt { get; set; }
        /// <summary>UTC time when the card should be studied next; null for new cards.</summary>
        public DateTime? DueAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime UpdatedAt { get; set; }

        public ICollection<ReviewLog> ReviewLogs = [];
    }
}