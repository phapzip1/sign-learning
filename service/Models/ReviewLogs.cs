namespace Service.Models
{

    /// <summary>How well the learner remembered a card (stored as an integer: Again = 0, Hard = 1, Good = 2, Easy = 3).</summary>
    public enum RecallRating
    {
        Again = 0,
        Hard,
        Good,
        Easy,

    }
    /// <summary>One rating of one card. The history behind the streak, study calendar and activity chart.</summary>
    public class ReviewLog
    {
        public string Id { get; set; } = null!;
        public string CardId { get; set; } = null!;
        public Card Card { get; set; } = null!;

        /// <summary>UTC time of the review. Statistics group reviews by this date.</summary>
        public DateTime ReviewDate { get; set; }
        public RecallRating Rating { get; set; }
        /// <summary>Optional time spent on the card, as sent by the client.</summary>
        public int? ReviewDuration { get; set; }

        /// <summary>Unique id the client sends with each rating, so a retried request is not counted twice.</summary>
        public string ClientEventId { get; set; } = null!;
    }
}