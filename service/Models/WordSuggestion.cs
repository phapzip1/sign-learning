namespace Service.Models
{
    public enum WordSuggestionStatus
    {
        Pending = 0,
        Approved,
        Rejected
    }

    public class WordSuggestion
    {
        public string Id { get; set; } = null!;

        public string UserId { get; set; } = null!;

        public string Value { get; set; } = null!;

        public string Meaning { get; set; } = null!;

        public Level Level { get; set; } = Level.Beginner;

        public Topic Topic { get; set; } = Topic.Other;

        public string? Cover { get; set; }

        public string? DemoURL { get; set; }

        public string? Instruction { get; set; }

        public string? Note { get; set; }

        public WordSuggestionStatus Status { get; set; } = WordSuggestionStatus.Pending;

        public uint? ApprovedWordId { get; set; }

        public string? ReviewedByUserId { get; set; }

        public string? ReviewNote { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public DateTime? ReviewedAt { get; set; }
    }
}