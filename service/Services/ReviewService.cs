using System.Data;
using Microsoft.EntityFrameworkCore;
using Service.Data;
using Service.DTOs;
using Service.Models;

namespace Service.Services
{

    public interface IReviewService
    {
        public class ReviewCardParams
        {
            public string UID { get; set; } = null!;
            public string CardID { get; set; } = null!;
            public string DeckID { get; set; } = null!;
            public RecallRating Rating { get; set; }
            public int? ReviewDuration;
            public string ClientEventId { get; set; } = null!;

        }

        public class ReviewCardResponse
        {
            public long NewCardCount { get; set; }
            public long ReviewCardCount { get; set; }
            public long LearningCardCount { get; set; }
            public bool IsComplete { get; set; }
            public Card? CurrentCard { get; set; }
            public DateTime? NextLearningDueAt { get; set; }
        }

        Task<ReviewCardResponse> ReviewCardAsync(ReviewCardParams args);
        Task<ReviewCardResponse> GetStudyAsync(string uid, string deckId, int limit = 20);
    }

    public class ReviewService(SignLearningContext dbContext) : IReviewService
    {
        private readonly SignLearningContext mDbContext = dbContext;
        private readonly Utils.FsrsScheduler mScheduler = new();

        public async Task<IReviewService.ReviewCardResponse> GetStudyAsync(string uid, string deckId, int limit = 20)
        {
            var now = DateTime.UtcNow;

            var deck = await mDbContext.Decks
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.Id == deckId &&
                    x.UserId == uid
                )
                ?? throw new KeyNotFoundException(
                    "Deck was not found."
                );

            return await BuildStudyResponseAsync(
                deck,
                now
            );
        }

        private async Task<IReviewService.ReviewCardResponse> BuildStudyResponseAsync(Deck deck, DateTime now)
        {
            var startOfDay = now.Date;
            var endOfDay = startOfDay.AddDays(1);

            // Count new cards introduced today.
            var introducedToday = await mDbContext.Cards
                .CountAsync(x =>
                    x.DeckId == deck.Id &&
                    x.FirstReviewAt >= startOfDay &&
                    x.FirstReviewAt < endOfDay);

            var remainingNewLimit = Math.Max(
                0,
                deck.NewCardsPerDay - introducedToday);

            // Count cards that have never been reviewed.
            var availableNew = await mDbContext.Cards
                .CountAsync(x =>
                    x.DeckId == deck.Id &&
                    x.State == LearningState.New);

            var newCount = Math.Min(
                availableNew,
                remainingNewLimit);

            // Learning and relearning cards due now.
            var learningCount = await mDbContext.Cards
                .CountAsync(x =>
                    x.DeckId == deck.Id &&
                    (
                        x.State == LearningState.Learning ||
                        x.State == LearningState.Relearning
                    ) &&
                    x.DueAt <= now);

            // Graduated review cards due now.
            var reviewCount = await mDbContext.Cards
                .CountAsync(x =>
                    x.DeckId == deck.Id &&
                    x.State == LearningState.Review &&
                    x.DueAt <= now);

            var nextCard = await GetNextCardAsync(
                deck.Id,
                newCount > 0,
                now);

            var nextLearningDueAt = await mDbContext.Cards
                .Where(x =>
                    x.DeckId == deck.Id &&
                    (
                        x.State == LearningState.Learning ||
                        x.State == LearningState.Relearning
                    ) &&
                    x.DueAt > now)
                .MinAsync(x => x.DueAt);


            return new IReviewService.ReviewCardResponse
            {
                NewCardCount = newCount,
                LearningCardCount = learningCount,
                ReviewCardCount = reviewCount,

                CurrentCard = nextCard,

                NextLearningDueAt = nextLearningDueAt,

                IsComplete = nextCard == null
            };
        }

        public async Task<IReviewService.ReviewCardResponse> ReviewCardAsync(IReviewService.ReviewCardParams args)
        {

            if (!Enum.IsDefined(typeof(RecallRating), args.Rating))
            {
                throw new ArgumentException("Invalid rating.");
            }

            await using var transaction = await mDbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable);

            var card = await mDbContext.Cards
                                    .Include(x => x.Deck)
                                    .FirstOrDefaultAsync(x =>
                                    x.Id == args.CardID &&
                                    x.DeckId == args.DeckID &&
                                    x.Deck.UserId == args.UID) ?? throw new KeyNotFoundException("Card was not found.");

            var alreadyProcessed = await mDbContext.ReviewLogs
                                                .AnyAsync(x =>
                                                x.ClientEventId == args.ClientEventId &&
                                                x.CardId == args.CardID);

            if (!alreadyProcessed)
            {
                var now = DateTime.UtcNow;

                // Validate that this card is eligible.
                if (card.State == LearningState.New)
                {
                    var introducedToday = await mDbContext.Cards
                                                        .CountAsync(x =>
                                                        x.DeckId == args.DeckID &&
                                                        x.FirstReviewAt >= now.Date &&
                                                        x.FirstReviewAt < now.Date.AddDays(1));

                    if (introducedToday >= card.Deck.NewCardsPerDay)
                    {
                        throw new InvalidOperationException("Daily new-card limit reached.");
                    }

                    card.FirstReviewAt = now;
                }
                else if (card.DueAt == null || card.DueAt > now)
                {
                    throw new InvalidOperationException("Card is not due yet.");
                }

                // FSRS calculates the next scheduling state.
                mScheduler.Review(card, args.Rating, now);

                // Record the review.
                mDbContext.ReviewLogs.Add(new ReviewLog
                {
                    Id = Guid.NewGuid().ToString(),

                    CardId = card.Id,

                    Rating = args.Rating,

                    ReviewDate = now,

                    ReviewDuration = args.ReviewDuration,

                    ClientEventId = args.ClientEventId
                });

                await mDbContext.SaveChangesAsync();
            }

            await transaction.CommitAsync();

            // Return the updated queue state.
            return await GetStudyAsync(args.UID, args.DeckID);
        }

        private async Task<Card?> GetNextCardAsync(string deckId, bool allowNew, DateTime now)
        {
            // Learning / Relearning
            var card = await mDbContext.Cards
                .AsNoTracking()
                .Include(x => x.Word)
                .Where(x =>
                    x.DeckId == deckId &&
                    (
                        x.State == LearningState.Learning ||
                        x.State == LearningState.Relearning
                    ) &&
                    x.DueAt <= now
                )
                .OrderBy(x => x.DueAt)
                .FirstOrDefaultAsync();

            // Review
            card ??= await mDbContext.Cards
                .AsNoTracking()
                .Include(x => x.Word)
                .Where(x =>
                    x.DeckId == deckId &&
                    x.State == LearningState.Review &&
                    x.DueAt <= now
                )
                .OrderBy(x => x.DueAt)
                .FirstOrDefaultAsync();

            // New
            if (card is null && allowNew)
            {
                card = await mDbContext.Cards
                    .AsNoTracking()
                    .Include(x => x.Word)
                    .Where(x =>
                        x.DeckId == deckId &&
                        x.State == LearningState.New
                    )
                    .OrderBy(x => x.CreatedAt)
                    .FirstOrDefaultAsync();
            }

            return card;
        }
    }
}
