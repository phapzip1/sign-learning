using Microsoft.EntityFrameworkCore;

namespace Service.Services
{
    /// <summary>Dictionary operations: search, read, create, update and delete words.</summary>
    public interface IWordService
    {
        /// <summary>Fields for creating or updating a word. Value, meaning, cover, video URL and instruction are required.</summary>
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

        /// <summary>
        /// Searches words whose value contains <paramref name="search"/>, optionally filtered by topic and levels,
        /// sorted and paged. <paramref name="page"/> starts at 1; <paramref name="pageSize"/> is clamped to 1–100.
        /// </summary>
        Task<DTOs.PageResultDTO<Models.Word>> ListAsync(string? search, Models.Topic? topic, Models.Level[]? levels, DTOs.SortDTO sort, int page, int pageSize);
        /// <summary>Gets a word by id. Throws <see cref="KeyNotFoundException"/> when it does not exist.</summary>
        Task<Models.Word> GetAsync(uint id);
        /// <summary>Gets the user's deck that contains the word, or null when it is in none of their decks.</summary>
        Task<Models.Deck?> GetDeckAsync(uint id, string uid);
        /// <summary>Validates and creates a word. Throws <see cref="InvalidOperationException"/> when the value already exists.</summary>
        Task<Models.Word> CreateAsync(WordUpsertParams args);
        /// <summary>Validates and updates a word.</summary>
        Task<Models.Word> UpdateAsync(uint id, WordUpsertParams args);
        /// <summary>Deletes a word. Throws <see cref="Utils.ConflictException"/> while it is still in a deck.</summary>
        Task DeleteAsync(uint id);
    }

    /// <summary>EF Core implementation of <see cref="IWordService"/>.</summary>
    public class WordService(Data.SignLearningContext dbContext) : IWordService
    {
        private readonly Data.SignLearningContext mDbContext = dbContext;

        /// <inheritdoc/>
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

        /// <inheritdoc/>
        public async Task<Models.Deck?> GetDeckAsync(uint wordId, string uid)
        {
            var deck = await mDbContext.Cards
                                        .AsNoTracking()
                                        .Where(x => x.WordId == wordId && x.Deck.UserId == uid)
                                        .Select(x => x.Deck)
                                        .FirstOrDefaultAsync();

            return deck;
        }

        /// <inheritdoc/>
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

        /// <inheritdoc/>
        public async Task<Models.Word> GetAsync(uint id)
        {
            var word = await mDbContext.Words
                                    .AsNoTracking()
                                    .FirstOrDefaultAsync(w => w.Id == id)
                                    ?? throw new KeyNotFoundException("Word not found.");
            return word;
        }

        /// <inheritdoc/>
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

        /// <inheritdoc/>
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

        /// <summary>Copies the validated request fields onto the word entity.</summary>
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