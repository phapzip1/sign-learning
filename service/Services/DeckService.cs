using Microsoft.EntityFrameworkCore;

namespace Service.Services
{
    public interface IDeckService
    {
        public class DeckUpsertParams
        {
            public string Name { get; set; } = string.Empty;
            public string? Description { get; set; }
            public int[] LearningSteps { get; set; } = [60, 600];
            public int[] RelearningSteps { get; set; } = [600];
            public uint MaximumInterval { get; set; } = 365000;
            public uint NewCardsPerDay { get; set; } = 20;
            public uint MaximumReviewsPerDay { get; set; } = 200;
        }

        public class AddWordToDeckParams
        {
            public uint[] WordIds { get; set; } = [];
        }

        public class AddWordToDeckResult
        {
            public int Added { get; set; }

            public int AlreadyOwned { get; set; }

            public int NotFound { get; set; }
        }

        Task<IReadOnlyList<Models.Deck>> ListAsync(string userId);
        Task<Models.Deck> GetAsync(string uid, string deckId);
        Task<DTOs.PageResultDTO<Models.Card>> ListCardsAsync(string uid, string deckId, int page, int pageSize);
        Task<AddWordToDeckResult> AddWordToDeck(string uid, string deckId, AddWordToDeckParams args);
        Task<Models.Deck> CreateAsync(string uid, DeckUpsertParams args);
        Task<Models.Deck> UpdateAsync(string uid, string deckId, DeckUpsertParams args);
        Task DeleteAsync(string uid, string deckId);
    }

    public class DeckService(Data.SignLearningContext dbContext) : IDeckService
    {
        private readonly Data.SignLearningContext mDbContext = dbContext;

        public async Task<Models.Deck> CreateAsync(string uid, IDeckService.DeckUpsertParams args)
        {
            var now = DateTime.UtcNow;
            var deck = new Models.Deck
            {
                Id = Guid.NewGuid().ToString("N"),
                UserId = uid,
                CreatedAt = now,
                UpdatedAt = now
            };
            Apply(deck, args);
            mDbContext.Decks.Add(deck);
            await mDbContext.SaveChangesAsync();

            return deck;
        }

        public async Task DeleteAsync(string uid, string deckId)
        {
            var deck = await FindOwnedDeckAsync(uid, deckId);
            // Avoid inadvertently cascading removal of Card and ReviewLog history.
            if (await mDbContext.Cards.AnyAsync(c => c.DeckId == deckId))
            {
                throw new Utils.ConflictException("Deck contains cards. Archive it or explicitly clear its cards first.");
            }

            mDbContext.Decks.Remove(deck);
            await mDbContext.SaveChangesAsync();
        }

        public async Task<Models.Deck> GetAsync(string uid, string deckId)
        {
            var deck = await FindOwnedDeckAsync(uid, deckId);
            return deck;
        }

        public async Task<IReadOnlyList<Models.Deck>> ListAsync(string userId)
        {
            return await mDbContext.Decks
                                .AsNoTracking()
                                .Where(d => d.UserId == userId)
                                .OrderBy(d => d.CreatedAt)
                                .ToListAsync();
        }

        public async Task<Models.Deck> UpdateAsync(string uid, string deckId, IDeckService.DeckUpsertParams args)
        {
            var deck = await FindOwnedDeckAsync(uid, deckId);
            Apply(deck, args);
            deck.UpdatedAt = DateTime.UtcNow;
            await mDbContext.SaveChangesAsync();
            return deck;
        }

        public async Task<DTOs.PageResultDTO<Models.Card>> ListCardsAsync(string uid, string deckId, int page, int pageSize)
        {
            await FindOwnedDeckAsync(uid, deckId);
            page = Math.Clamp(page, 1, 100000);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = mDbContext.Cards
                                .AsNoTracking()
                                .Where(c => c.DeckId == deckId);
            var total = await query.CountAsync();
            var cards = await query
                            .OrderBy(c => c.CreatedAt)
                            .ThenBy(c => c.Id)
                            .Skip((page - 1) * pageSize)
                            .Take(pageSize)
                            .ToListAsync();

            return new DTOs.PageResultDTO<Models.Card>
            {
                Page = page,
                PageSize = pageSize,
                Total = total,
                Items = cards
            };
        }

        public async Task<IDeckService.AddWordToDeckResult> AddWordToDeck(string uid, string deckId, IDeckService.AddWordToDeckParams args)
        {
            var deck = await mDbContext.Decks
                                    .FirstOrDefaultAsync(d =>
                                    d.Id == deckId &&
                                    d.UserId == uid)
                                    ?? throw new KeyNotFoundException("Deck not found.");

            // 2. Remove duplicate IDs in the request
            var wordIds = args.WordIds
                            .Distinct()
                            .ToArray();

            // 3. Check words already owned by the user
            // across ALL their decks.
            var existingWordIds = await mDbContext.Cards
                .Where(c =>
                    c.Deck.UserId == uid &&
                    wordIds.Contains(c.WordId))
                .Select(c => c.WordId)
                .ToListAsync();

            var existingSet = existingWordIds.ToHashSet();

            // 4. Only add words the user does not own
            var newWordIds = wordIds
                .Where(id => !existingSet.Contains(id))
                .ToArray();

            // 5. Verify that the remaining words exist
            var validWordIds = await mDbContext.Words
                .Where(w => newWordIds.Contains(w.Id))
                .Select(w => w.Id)
                .ToListAsync();

            var now = DateTime.UtcNow;

            // 6. Create new cards
            var cards = validWordIds.Select(wordId => new Models.Card
            {
                Id = Guid.NewGuid().ToString(),

                DeckId = deckId,
                WordId = wordId,

                State = Models.LearningState.New,
                Step = null,

                Stability = 0,
                Difficulty = 0,

                DueAt = null,
                FirstReviewAt = null,

                CreatedAt = now,
                UpdatedAt = now
            }).ToList();

            // 7. Save
            mDbContext.Cards.AddRange(cards);

            await mDbContext.SaveChangesAsync();

            return new IDeckService.AddWordToDeckResult
            {
                Added = cards.Count,
                AlreadyOwned = existingWordIds.Count,
                NotFound = newWordIds.Length - validWordIds.Count
            };
        }

        private async Task<Models.Deck> FindOwnedDeckAsync(string userId, string deckId)
        {
            var deck = await mDbContext.Decks
                                    .FirstOrDefaultAsync(d => d.Id == deckId && d.UserId == userId)
                                    ?? throw new KeyNotFoundException("Deck not found.");
            return deck;
        }

        private static void Apply(Models.Deck deck, IDeckService.DeckUpsertParams request)
        {
            deck.Name = request.Name.Trim();
            deck.Description = request.Description ?? string.Empty;
            // Clone incoming arrays: avoid mutable shared references.
            deck.LearningSteps = (int[])request.LearningSteps.Clone();
            deck.RelearningSteps = (int[])request.RelearningSteps.Clone();
            deck.MaximumInterval = request.MaximumInterval;
            deck.NewCardsPerDay = request.NewCardsPerDay;
            deck.MaximumReviewsPerDay = request.MaximumReviewsPerDay;
        }
    }
}