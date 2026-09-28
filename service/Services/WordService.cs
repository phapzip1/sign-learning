using Microsoft.EntityFrameworkCore;

namespace Service.Services
{
    public interface IWordService
    {
        public class WordUpsertParams
        {
            public string Value { get; set; } = string.Empty;
            public string? Meaning { get; set; }
            public string? Cover { get; set; }
            public Models.Level Level { get; set; } = Models.Level.Beginner;
            public string? DemoURL { get; set; }
            public string? Instruction { get; set; }
            public Models.Topic Topic { get; set; } = Models.Topic.Other;
        }

        Task<DTOs.PageResultDTO<Models.Word>> ListAsync(string? search, Models.Topic? topic, Models.Level? level, int page, int pageSize);
        Task<Models.Word> GetAsync(uint id);
        Task<Models.Word> CreateAsync(WordUpsertParams args);
        Task<Models.Word> UpdateAsync(uint id, WordUpsertParams args);
        Task DeleteAsync(uint id);
    }

    public class WordService(Data.SignLearningContext dbContext) : IWordService
    {
        private readonly Data.SignLearningContext mDbContext = dbContext;

        public async Task<Models.Word> CreateAsync(IWordService.WordUpsertParams args)
        {
            var value = args.Value.Trim();
            if (await mDbContext.Words.AnyAsync(w => w.Value == value))
            {
                throw new Utils.ConflictException("A word with this value already exists.");
            }

            var now = DateTime.UtcNow;
            var word = new Models.Word { CreatedAt = now, UpdatedAt = now };
            Apply(word, args);
            mDbContext.Words.Add(word); // EF / MySQL generates the uint auto-increment ID.
            await mDbContext.SaveChangesAsync();

            return word;
        }

        public async Task DeleteAsync(uint id)
        {
            var word = await mDbContext.Words
                                    .FirstOrDefaultAsync(w => w.Id == id)
                                    ?? throw new KeyNotFoundException("Word not found.");

            // Do not accidentally delete students' card progress by cascading.
            if (await mDbContext.Cards.AnyAsync(c => c.WordId == id))
            {
                throw new Utils.ConflictException("Word belongs to a deck; remove or archive it first.");
            }

            mDbContext.Words.Remove(word);
            await mDbContext.SaveChangesAsync();
        }

        public async Task<Models.Word> GetAsync(uint id)
        {
            var word = await mDbContext.Words
                                    .AsNoTracking()
                                    .FirstOrDefaultAsync(w => w.Id == id)
                                    ?? throw new KeyNotFoundException("Word not found.");
            return word;
        }

        public async Task<DTOs.PageResultDTO<Models.Word>> ListAsync(string? search, Models.Topic? topic, Models.Level? level, int page, int pageSize)
        {
            page = Math.Clamp(page, 1, 10000);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = mDbContext.Words
                                .AsNoTracking()
                                .AsQueryable();
            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(w => w.Value.Contains(term) || w.Meaning.Contains(term));
            }

            if (topic.HasValue) query = query.Where(w => w.Topic == topic.Value);
            if (level.HasValue) query = query.Where(w => w.Level == level.Value);

            var total = await query.CountAsync();
            List<Models.Word> items = await query.OrderBy(w => w.Id)
                                .Skip((page - 1) * pageSize)
                                .Take(pageSize)
                                .ToListAsync() ?? throw new Exception("Unhandled exception");

            return new DTOs.PageResultDTO<Models.Word>
            {
                Page = page,
                PageSize = pageSize,
                Total = total,
                Items = items
            };

        }

        public async Task<Models.Word> UpdateAsync(uint id, IWordService.WordUpsertParams args)
        {
            var word = await mDbContext.Words
                                    .FirstOrDefaultAsync(w => w.Id == id)
                                    ?? throw new KeyNotFoundException("Word not found.");

            var value = args.Value.Trim();
            if (await mDbContext.Words.AnyAsync(w => w.Id != id && w.Value == value))
            {
                throw new Utils.ConflictException("A word with this value already exists.");
            }

            Apply(word, args);
            word.UpdatedAt = DateTime.UtcNow;
            await mDbContext.SaveChangesAsync();

            return word;
        }

        private static void Apply(Models.Word word, IWordService.WordUpsertParams request)
        {
            word.Value = request.Value.Trim();
            word.Cover = request.Cover ?? string.Empty;
            word.Meaning = request.Meaning ?? string.Empty;
            word.Level = request.Level;
            word.DemoURL = request.DemoURL ?? string.Empty;
            word.Instruction = request.Instruction ?? string.Empty;
            word.Topic = request.Topic;
        }
    }
}