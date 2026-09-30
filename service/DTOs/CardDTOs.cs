namespace Service.DTOs
{
    public class WordCardDTO
    {
        public string Id { get; set; } = null!;
        public string Title { get; set; } = null!;
        public uint WordId {get;set;}
        public string Meaning { get; set; } = null!;
        public Models.Level Level { get; set; }
        public Models.LearningState State { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

    }
}