using Microsoft.EntityFrameworkCore;

namespace Service.Data
{
    public class SignLearningContext(IConfiguration configuration) : DbContext
    {
        private readonly IConfiguration mConfiguration = configuration;

        public DbSet<Models.Deck> Decks { get; set; } = null!;
        public DbSet<Models.Word> Words { get; set; } = null!;
        public DbSet<Models.Card> Cards { get; set; } = null!;
        public DbSet<Models.ReviewLog> ReviewLogs { get; set; } = null!;

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            string? conn = mConfiguration.GetConnectionString("DefaultConnection") ?? throw new Exception("Connection string was null");
            optionsBuilder.UseMySQL(conn);
        }
    }
}