namespace Service.Models
{
    public enum LearningState
    {
        New = 0,
        Learning,
        Review,
        Relearning
    }

    public class Card
    {
        public string Id { get; set; } = null!;

        public uint WordId { get; set; }
        public Word Word { get; set; } = null!;

        public string DeckId { get; set; } = null!;
        public Deck Deck { get; set; } = null!;

        public LearningState State { get; set; }
        public int? Step { get; set; }
        public float Stability { get; set; }
        public float Difficulty { get; set; }

        public DateTime? FirstReviewAt { get; set; }
        public DateTime? LastReviewAt { get; set; }
        public DateTime? DueAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime UpdatedAt { get; set; }

        public ICollection<ReviewLog> ReviewLogs = [];
    }
}