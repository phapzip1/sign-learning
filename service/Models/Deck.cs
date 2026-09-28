using System.ComponentModel.DataAnnotations;

namespace Service.Models
{
    public class Deck
    {
        public Deck()
        {
            Cards = [];
        }

        public string Id { get; set; } = null!;

        public string Name { get; set; } = null!;
        public string UserId { get; set; } = null!;
        public string Description { get; set; } = null!;

        public int[] LearningSteps { get; set; } = [60, 600];
        public int[] RelearningSteps { get; set; } = [600];
        public uint MaximumInterval { get; set; } = 36500;

        public uint NewCardsPerDay { get; set; } = 20;
        public uint MaximumReviewsPerDay { get; set; } = 200;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime UpdatedAt { get; set; }

        public ICollection<Card> Cards;
    }
}