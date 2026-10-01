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

        Task<DTOs.PageResultDTO<Models.Word>> ListAsync(string? search, Models.Topic? topic, Models.Level[]? levels, DTOs.SortDTO sort, int page, int pageSize);
        Task<Models.Word> GetAsync(uint id);
        Task<Models.Deck?> GetDeckAsync(uint id, string uid);
        Task<Models.Word> CreateAsync(WordUpsertParams args);
        Task<Models.Word> UpdateAsync(uint id, WordUpsertParams args);
        Task DeleteAsync(uint id);
    }

    public class WordService(Data.SignLearningContext dbContext) : IWordService
    {
        private readonly Data.SignLearningContext mDbContext = dbContext;

        public async Task<Models.Word> CreateAsync(IWordService.WordUpsertParams args)
        {
            var value = args.Value?.Trim();
            var meaning = args.Meaning?.Trim();
            var cover = args.Cover?.Trim();
            var demoURL = args.DemoURL?.Trim();
            var instruction = args.Instruction?.Trim();

            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException(
                    "Word is required."
                );

            if (string.IsNullOrWhiteSpace(meaning))
                throw new ArgumentException(
                    "Meaning is required."
                );

            if (string.IsNullOrWhiteSpace(cover))
                throw new ArgumentException(
                    "Cover is required."
                );

            if (string.IsNullOrWhiteSpace(demoURL))
                throw new ArgumentException(
                    "Demo URL is required."
                );

            if (string.IsNullOrWhiteSpace(instruction))
                throw new ArgumentException(
                    "Instruction is required."
                );

            var normalizedValue =
                value.ToLower();

            var exists = await mDbContext.Words
                .AsNoTracking()
                .AnyAsync(x =>
                    x.Value.ToLower() ==
                    normalizedValue
                );

            if (exists)
            {
                throw new InvalidOperationException(
                    "A word with this value already exists."
                );
            }

            var now = DateTime.UtcNow;

            var word = new Models.Word
            {
                Value = value,
                Meaning = meaning,
                Cover = cover,
                DemoURL = demoURL,
                Instruction = instruction,

                Level = args.Level,
                Topic = args.Topic,

                CreatedAt = now,
                UpdatedAt = now
            };

            mDbContext.Words.Add(word);

            await mDbContext.SaveChangesAsync();

            return word;
        }

        public async Task<Models.Deck?> GetDeckAsync(uint wordId, string uid)
        {
            var deck = await mDbContext.Cards
                                        .AsNoTracking()
                                        .Where(x => x.WordId == wordId && x.Deck.UserId == uid)
                                        .Select(x => x.Deck)
                                        .FirstOrDefaultAsync();

            return deck;
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

        public async Task<DTOs.PageResultDTO<Models.Word>> ListAsync(string? search, Models.Topic? topic, Models.Level[]? levels, DTOs.SortDTO sort, int page, int pageSize)
        {
            page = Math.Max(page, 1);

            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = mDbContext.Words
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim();

                query = query.Where(w => w.Value.Contains(search));
            }

            if (levels is { Length: > 0 })
            {
                query = query.Where(w => levels.Contains(w.Level));
            }

            if (topic.HasValue)
            {
                query = query.Where(w => w.Topic == topic.Value);
            }

            query = sort switch
            {
                DTOs.SortDTO.AlphabetAscending => query.OrderBy(w => w.Value),
                DTOs.SortDTO.AlphabetDescending => query.OrderByDescending(w => w.Value),
                DTOs.SortDTO.DifficultyIncrease => query.OrderBy(w => w.Level).ThenBy(w => w.Value),
                DTOs.SortDTO.DifficultyDescrease => query.OrderByDescending(w => w.Level).ThenBy(w => w.Value),
                DTOs.SortDTO.Newest => query.OrderByDescending(w => w.CreatedAt).ThenBy(w => w.Value),
                DTOs.SortDTO.Oldest => query.OrderBy(w => w.CreatedAt).ThenBy(w => w.Value),
                _ => throw new NotImplementedException(),
            };

            var total = await query.CountAsync();

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync() ?? throw new Exception("Unhandled exception");

            return new DTOs.PageResultDTO<Models.Word>
            {
                Page = page,
                PageSize = pageSize,
                Total = total,
                TotalPages = total == 0
                    ? 0
                    : (int)Math.Ceiling(
                        total / (double)pageSize),

                Items = items
            };

        }

        public async Task<Models.Word> UpdateAsync(uint id, IWordService.WordUpsertParams args)
        {
            var word = await mDbContext.Words
                .FirstOrDefaultAsync(x =>
                    x.Id == id
                );

            if (word is null)
            {
                throw new KeyNotFoundException(
                    "Word not found."
                );
            }

            var value = args.Value?.Trim();
            var meaning = args.Meaning?.Trim();
            var cover = args.Cover?.Trim();
            var demoURL = args.DemoURL?.Trim();
            var instruction = args.Instruction?.Trim();

            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException(
                    "Word is required."
                );

            if (string.IsNullOrWhiteSpace(meaning))
                throw new ArgumentException(
                    "Meaning is required."
                );

            if (string.IsNullOrWhiteSpace(cover))
                throw new ArgumentException(
                    "Cover is required."
                );

            if (string.IsNullOrWhiteSpace(demoURL))
                throw new ArgumentException(
                    "Demo URL is required."
                );

            if (string.IsNullOrWhiteSpace(instruction))
                throw new ArgumentException(
                    "Instruction is required."
                );

            /*
             * Prevent renaming this word to another
             * existing word.
             */
            var normalizedValue = value.ToLower();

            var duplicate = await mDbContext.Words
                .AsNoTracking()
                .AnyAsync(x =>
                    x.Id != id && x.Value.ToLower() == normalizedValue
                );

            if (duplicate)
            {
                throw new InvalidOperationException(
                    "A word with this value already exists."
                );
            }

            word.Value = value;
            word.Meaning = meaning;
            word.Cover = cover;
            word.DemoURL = demoURL;
            word.Instruction = instruction;

            word.Level = args.Level;
            word.Topic = args.Topic;

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