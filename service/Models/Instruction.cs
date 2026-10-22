using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Service.Models
{
    /// <summary>One numbered step of a sign's instructions.</summary>
    /// <remarks>Not used yet: instructions are currently stored as text in <see cref="Word.Instruction"/>.</remarks>
    [PrimaryKey(nameof(WordId), nameof(Step))]
    public class Instruction
    {
        public uint WordId { get; set; }
        public uint Step { get; set; }
        public string Description { get; set; } = null!;
    }
}