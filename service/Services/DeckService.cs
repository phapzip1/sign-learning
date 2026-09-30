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
            public int Moved { get; set; }
            public int AlreadyInDeck { get; set; }
        }

        Task<IReadOnlyList<DTOs.DeckInfoDTO>> ListAsync(string userId);
        Task<DTOs.DeckConfigDTO> GetAsync(string uid, string deckId);
        Task<IReadOnlyList<DTOs.WordCardDTO>> ListCardsAsync(string uid, string deckId, int page, int pageSize);
        Task<AddWordToDeckResult> AddWordToDeck(string uid, string deckId, AddWordToDeckParams args);
        Task<DTOs.DeckConfigDTO> CreateAsync(string uid, DeckUpsertParams args);
        Task<DTOs.DeckConfigDTO> UpdateAsync(string uid, string deckId, DeckUpsertParams args);
        Task DeleteAsync(string uid, string deckId);
    }

    public class DeckService(Data.SignLearningContext dbContext) : IDeckService
    {
        private readonly Data.SignLearningContext mDbContext = dbContext;

        public async Task<DTOs.DeckConfigDTO> CreateAsync(string uid, IDeckService.DeckUpsertParams args)
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

            return new DTOs.DeckConfigDTO
            {
                Id = deck.Id,
                Name = deck.Name,
                Description = deck.Description,
                LearningSteps = deck.LearningSteps,
                RelearningSteps = deck.RelearningSteps,
                MaximumInterval = deck.MaximumInterval,
                MaximumReviewsPerDay = deck.MaximumReviewsPerDay,
                NewCardsPerDay = deck.NewCardsPerDay,
                CreatedAt = deck.CreatedAt,
                UpdatedAt = deck.UpdatedAt,
            };
        }

        public async Task DeleteAsync(string uid, string deckId)
        {
            var deck = await FindOwnedDeckAsync(uid, deckId);
            // // Avoid inadvertently cascading removal of Card and ReviewLog history.
            // if (await mDbContext.Cards.AnyAsync(c => c.DeckId == deckId))
            // {
            //     throw new Utils.ConflictException("Deck contains cards. Archive it or explicitly clear its cards first.");
            // }

            mDbContext.Decks.Remove(deck);
            await mDbContext.SaveChangesAsync();
        }

        public async Task<DTOs.DeckConfigDTO> GetAsync(string uid, string deckId)
        {
            var deck = await FindOwnedDeckAsync(uid, deckId);
            return new DTOs.DeckConfigDTO
            {
                Id = deck.Id,
                Name = deck.Name,
                Description = deck.Description,
                LearningSteps = deck.LearningSteps,
                RelearningSteps = deck.RelearningSteps,
                MaximumInterval = deck.MaximumInterval,
                MaximumReviewsPerDay = deck.MaximumReviewsPerDay,
                NewCardsPerDay = deck.NewCardsPerDay,
                CreatedAt = deck.CreatedAt,
                UpdatedAt = deck.UpdatedAt,
            };
        }

        public async Task<IReadOnlyList<DTOs.DeckInfoDTO>> ListAsync(string uid)
        {
            var now = DateTime.UtcNow;

            // For now, daily reset is midnight UTC.
            // Later you can replace this with the user's timezone.
            var startOfDay = now.Date;
            var endOfDay = startOfDay.AddDays(1);

            // 1. Get all decks belonging to the user.
            var decks = await mDbContext.Decks
                .AsNoTracking()
                .Where(d => d.UserId == uid)
                .OrderByDescending(d => d.UpdatedAt)
                .Select(d => new
                {
                    d.Id,
                    d.Name,
                    d.Description,
                    d.NewCardsPerDay
                })
                .ToListAsync();

            if (decks.Count == 0)
            {
                return [];
            }

            var deckIds = decks.Select(d => d.Id).ToArray();

            // 2. Get statistics for every deck in one query.
            var stats = await mDbContext.Cards
                .AsNoTracking()
                .Where(c => deckIds.Contains(c.DeckId))
                .GroupBy(c => c.DeckId)
                .Select(g => new
                {
                    DeckId = g.Key,

                    // Cards never introduced before.
                    AvailableNew = g.Count(c =>
                        c.State == Models.LearningState.New),

                    // New cards first introduced today.
                    IntroducedToday = g.Count(c =>
                        c.FirstReviewAt != null &&
                        c.FirstReviewAt >= startOfDay &&
                        c.FirstReviewAt < endOfDay),

                    // Learning/relearning cards that are due now.
                    Learning = g.Count(c =>
                        (
                            c.State == Models.LearningState.Learning ||
                            c.State == Models.LearningState.Relearning
                        ) &&
                        c.DueAt != null &&
                        c.DueAt <= now),

                    // Review cards that are due now.
                    Due = g.Count(c => c.State == Models.LearningState.Review && c.DueAt != null && c.DueAt <= now),

                    TotalCards = g.Count(),

                    // Earliest card scheduled for the future.
                    NextDueAt = g.Where(c => c.DueAt != null && c.DueAt > now).Min(c => c.DueAt)
                })
                .ToListAsync();

            var statsByDeck = stats.ToDictionary(x => x.DeckId);

            var result = new List<DTOs.DeckInfoDTO>();

            // 3. Calculate today's remaining new-card allowance.
            foreach (var deck in decks)
            {
                statsByDeck.TryGetValue(deck.Id, out var deckStats);

                var availableNew = deckStats?.AvailableNew ?? 0;

                var introducedToday = deckStats?.IntroducedToday ?? 0;

                var newCardsPerDay = deck.NewCardsPerDay > int.MaxValue ? int.MaxValue : (int)deck.NewCardsPerDay;

                // Example:
                // limit = 20
                // introduced today = 7
                // remaining limit = 13
                var remainingDailyNewLimit = Math.Max(0, newCardsPerDay - introducedToday);

                // If only 5 unseen cards remain,
                // show 5 rather than 13.
                var newCount = Math.Min(availableNew, remainingDailyNewLimit);

                var learningCount =
                    deckStats?.Learning ?? 0;

                var dueCount =
                    deckStats?.Due ?? 0;

                result.Add(new DTOs.DeckInfoDTO
                {
                    Id = deck.Id,

                    Name = deck.Name,

                    Description = deck.Description,

                    New = newCount,

                    Learning = learningCount,

                    Due = dueCount,

                    TotalCards = deckStats?.TotalCards ?? 0,

                    NextDueAt = deckStats?.NextDueAt
                });
            }

            return result;
        }

        public async Task<DTOs.DeckConfigDTO> UpdateAsync(string uid, string deckId, IDeckService.DeckUpsertParams args)
        {
            var deck = await FindOwnedDeckAsync(uid, deckId);

            Apply(deck, args);

            deck.UpdatedAt = DateTime.UtcNow;

            await mDbContext.SaveChangesAsync();

            return new DTOs.DeckConfigDTO
            {
                Id = deck.Id,
                Name = deck.Name,
                Description = deck.Description,
                LearningSteps = deck.LearningSteps,
                RelearningSteps = deck.RelearningSteps,
                MaximumInterval = deck.MaximumInterval,
                MaximumReviewsPerDay = deck.MaximumReviewsPerDay,
                NewCardsPerDay = deck.NewCardsPerDay,
                CreatedAt = deck.CreatedAt,
                UpdatedAt = deck.UpdatedAt,
            };
        }

        public async Task<IReadOnlyList<DTOs.WordCardDTO>> ListCardsAsync(string uid, string deckId, int page, int pageSize)
        {
            Models.Deck deck = await FindOwnedDeckAsync(uid, deckId) ?? throw new KeyNotFoundException("Deck not found.");

            var query = mDbContext.Cards
                                .AsNoTracking()
                                .Where(c => c.DeckId == deckId);
            var cards = await query
                                .OrderBy(c => c.CreatedAt)
                                .Select(c => new DTOs.WordCardDTO
                                {
                                    Id = c.Id,
                                    WordId = c.WordId,
                                    Title = c.Word.Value,
                                    Meaning = c.Word.Meaning,
                                    State = c.State,
                                    Level = c.Word.Level,
                                    CreatedAt = c.CreatedAt,
                                    UpdatedAt = c.UpdatedAt
                                })
                                .ToListAsync() ?? throw new Exception("Unhandled exception");

            return cards;
        }

        public async Task<IDeckService.AddWordToDeckResult> AddWordToDeck(string uid, string deckId, IDeckService.AddWordToDeckParams args)
        {
            if (args.WordIds == null || args.WordIds.Length == 0)
            {
                throw new ArgumentException(
                    "At least one WordId is required.");
            }

            // 1. Verify target deck belongs to user.
            var deck = await mDbContext.Decks
                .FirstOrDefaultAsync(d =>
                    d.Id == deckId &&
                    d.UserId == uid)
                ?? throw new KeyNotFoundException(
                    "Deck not found.");

            // 2. Remove duplicate word IDs from request.
            var requestedWordIds = args.WordIds
                .Distinct()
                .ToArray();

            // 3. Find which requested words actually exist.
            var validWordIds = await mDbContext.Words
                .Where(w =>
                    requestedWordIds.Contains(w.Id))
                .Select(w => w.Id)
                .ToListAsync();

            var validWordIdSet =
                validWordIds.ToHashSet();

            var notFoundCount =
                requestedWordIds.Count(id =>
                    !validWordIdSet.Contains(id));

            // 4. Find existing cards for this user
            // across ALL decks.
            //
            // Do NOT use AsNoTracking here because
            // some cards may need to be moved.
            var existingCards = await mDbContext.Cards
                .Where(c =>
                    c.Deck.UserId == uid &&
                    validWordIds.Contains(c.WordId))
                .ToListAsync();

            /*
             * Ideally the database guarantees one card
             * per User + Word.
             *
             * Grouping protects this method if old duplicate
             * data already exists.
             */
            var existingCardsByWordId =
                existingCards
                    .GroupBy(c => c.WordId)
                    .ToDictionary(
                        g => g.Key,
                        g => g.First());

            var now = DateTime.UtcNow;

            var added = 0;
            var moved = 0;
            var alreadyInDeck = 0;

            foreach (var wordId in validWordIds)
            {
                // User already owns this word.
                if (existingCardsByWordId.TryGetValue(
                    wordId,
                    out var existingCard))
                {
                    // Already in requested deck.
                    if (existingCard.DeckId == deckId)
                    {
                        alreadyInDeck++;
                        continue;
                    }

                    // Move the existing card to target deck.
                    existingCard.DeckId = deckId;
                    existingCard.UpdatedAt = now;

                    moved++;

                    continue;
                }

                // User does not own this word yet.
                // Create a brand-new card.
                var card = new Models.Card
                {
                    Id = Guid.NewGuid().ToString(),

                    DeckId = deckId,
                    WordId = wordId,

                    State = Models.LearningState.New,

                    Step = null,

                    Stability = 0,
                    Difficulty = 0,

                    FirstReviewAt = null,
                    LastReviewAt = null,
                    DueAt = null,

                    CreatedAt = now,
                    UpdatedAt = now
                };

                mDbContext.Cards.Add(card);

                added++;
            }

            await mDbContext.SaveChangesAsync();

            return new IDeckService.AddWordToDeckResult
            {
                Added = added,
                Moved = moved,
                AlreadyInDeck = alreadyInDeck,
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