namespace Service.Models
{
    public class Word
    {
        public uint Id { get; set; }
        public string Value { get; set; } = null!;

        public string Meaning { get; set; } = null!;
        public string Level { get; set; } = null!;
        public string DemoURL { get; set; } = null!;

        public ICollection<Instruction> Instructions { get; set; } = [];

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}