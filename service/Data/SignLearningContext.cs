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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Models.Deck>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity
                    .Property(e => e.LearningSteps)
                    .HasColumnType("json")
                    .HasConversion(
                        v => System.Text.Json.JsonSerializer.Serialize(v, options: null),
                        v => System.Text.Json.JsonSerializer.Deserialize<int[]>(v, options: null)
                );

                entity
                    .Property(e => e.RelearningSteps)
                    .HasColumnType("json")
                    .HasConversion(
                        v => System.Text.Json.JsonSerializer.Serialize(v, options: null),
                        v => System.Text.Json.JsonSerializer.Deserialize<int[]>(v, options: null)
                );
            });
        }
    }
}