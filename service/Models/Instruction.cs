using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Service.Models
{
    [PrimaryKey(nameof(WordId), nameof(Step))]
    public class Instruction
    {
        public uint WordId { get; set; }
        public uint Step { get; set; }
        public string Description { get; set; } = null!;
    }
}