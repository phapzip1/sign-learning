namespace Service.Models
{
    /// <summary>Moderation status of a suggestion (stored as an integer: Pending = 0, Approved = 1, Rejected = 2).</summary>
    public enum WordSuggestionStatus
    {
        Pending = 0,
        Approved,
        Rejected
    }

    /// <summary>A new word proposed by a learner, waiting for or after an admin's review.</summary>
    public class WordSuggestion
    {
        public string Id { get; set; } = null!;

        /// <summary>Clerk user id of the learner who suggested the word.</summary>
        public string UserId { get; set; } = null!;

        public string Value { get; set; } = null!;

        public string Meaning { get; set; } = null!;

        public Level Level { get; set; } = Level.Beginner;

        public Topic Topic { get; set; } = Topic.Other;

        public string? Cover { get; set; }

        public string? DemoURL { get; set; }

        public string? Instruction { get; set; }

        /// <summary>Optional note from the learner to the reviewer.</summary>
        public string? Note { get; set; }

        public WordSuggestionStatus Status { get; set; } = WordSuggestionStatus.Pending;

        /// <summary>Id of the dictionary word created when the suggestion was approved.</summary>
        public uint? ApprovedWordId { get; set; }

        /// <summary>Clerk user id of the admin who reviewed it.</summary>
        public string? ReviewedByUserId { get; set; }

        /// <summary>The admin's note, e.g. the reason for a rejection; shown to the learner.</summary>
        public string? ReviewNote { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public DateTime? ReviewedAt { get; set; }
    }
}