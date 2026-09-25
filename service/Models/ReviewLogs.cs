namespace Service.Models
{

    public enum RecallRating
    {
        Again = 0,
        Hard,
        Good,
        Easy,

    }
    public class ReviewLog
    {
        public string Id { get; set; } = null!;
        public string CardId { get; set; } = null!;
        public Card Card { get; set; } = null!;

        public DateTime ReviewDate { get; set; }
        public RecallRating Rating { get; set; }
        public int? ReviewDuration { get; set; }

        public string ClientEventId { get; set; } = null!;
    }
}