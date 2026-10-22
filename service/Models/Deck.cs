using System.ComponentModel.DataAnnotations;

namespace Service.Models
{
    /// <summary>A user's deck of flashcards (shown as a "collection" in the UI), with its own study settings.</summary>
    public class Deck
    {
        public Deck()
        {
            Cards = [];
        }

        public string Id { get; set; } = null!;

        public string Name { get; set; } = null!;
        /// <summary>Clerk user id of the owner.</summary>
        public string UserId { get; set; } = null!;
        public string Description { get; set; } = null!;

        /// <summary>Waits, in seconds, between the steps of learning a new card (default 1 min, then 10 min). Stored as JSON.</summary>
        public int[] LearningSteps { get; set; } = [60, 600];
        /// <summary>Waits, in seconds, for a learned card that was forgotten (rated Again). Stored as JSON.</summary>
        public int[] RelearningSteps { get; set; } = [600];
        /// <summary>Longest gap, in days, between reviews of a learned card.</summary>
        public uint MaximumInterval { get; set; } = 36500;

        /// <summary>How many never-studied cards may be introduced per UTC day.</summary>
        public uint NewCardsPerDay { get; set; } = 20;
        /// <summary>Intended daily cap on reviews of learned cards.</summary>
        /// <remarks>Saved and editable, but not enforced by the study session yet.</remarks>
        public uint MaximumReviewsPerDay { get; set; } = 200;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime UpdatedAt { get; set; }

        public ICollection<Card> Cards;
    }
}