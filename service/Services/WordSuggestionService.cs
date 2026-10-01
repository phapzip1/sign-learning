using Microsoft.EntityFrameworkCore;

namespace Service.Services
{
    public interface IWordSuggestionService
    {
        public sealed class CreateParams
        {
            public string Value { get; set; } = null!;

            public string Meaning { get; set; } = null!;

            public Models.Level Level { get; set; } = Models.Level.Beginner;

            public Models.Topic Topic { get; set; } = Models.Topic.Other;

            public string? Cover { get; set; }

            public string? DemoURL { get; set; }

            public string? Instruction { get; set; }

            public string? Note { get; set; }
        }

        public sealed class ApproveParams
        {
            /*
             * Admin can fix/complete the suggestion
             * before it becomes a real Word.
             */
            public string? Value { get; set; }

            public string? Meaning { get; set; }

            public Models.Level? Level { get; set; }

            public Models.Topic? Topic { get; set; }

            public string? Cover { get; set; }

            public string? DemoURL { get; set; }

            public string? Instruction { get; set; }

            public string? ReviewNote { get; set; }
        }

        public sealed class RejectParams
        {
            public string? ReviewNote { get; set; }
        }

        public sealed class SuggestionResponse
        {
            public string Id { get; set; } = null!;

            public string UserId { get; set; } = null!;

            public string Value { get; set; } = null!;

            public string Meaning { get; set; } = null!;

            public Models.Level Level { get; set; }

            public Models.Topic Topic { get; set; }

            public string? Cover { get; set; }

            public string? DemoURL { get; set; }

            public string? Instruction { get; set; }

            public string? Note { get; set; }

            public Models.WordSuggestionStatus Status { get; set; }

            public uint? ApprovedWordId { get; set; }

            public string? ReviewedByUserId { get; set; }

            public string? ReviewNote { get; set; }

            public DateTime CreatedAt { get; set; }

            public DateTime UpdatedAt { get; set; }

            public DateTime? ReviewedAt { get; set; }
        }

        public sealed class ApprovalResponse
        {
            public string SuggestionId { get; set; } = null!;

            public uint WordId { get; set; }

            public Models.WordSuggestionStatus Status { get; set; }
        }

        Task<SuggestionResponse> CreateAsync(string uid, CreateParams args);

        Task<IReadOnlyList<SuggestionResponse>> GetMineAsync(string uid);

        Task<IReadOnlyList<SuggestionResponse>> GetForAdminAsync(Models.WordSuggestionStatus? status);

        Task<ApprovalResponse> ApproveAsync(string adminUid, string suggestionId, ApproveParams args);

        Task<SuggestionResponse> RejectAsync(string adminUid, string suggestionId, RejectParams args);
    }

    public sealed class WordSuggestionService(Data.SignLearningContext dbContext, IWordService wordService) : IWordSuggestionService
    {
        private readonly Data.SignLearningContext mDbContext = dbContext;
        private readonly IWordService mWordService = wordService;

        public async Task<IWordSuggestionService.SuggestionResponse> CreateAsync(string uid, IWordSuggestionService.CreateParams args)
        {
            var value = args.Value?.Trim();
            var meaning = args.Meaning?.Trim();

            if (string.IsNullOrWhiteSpace(value))
            {
                throw new ArgumentException(
                    "Word is required."
                );
            }

            if (string.IsNullOrWhiteSpace(meaning))
            {
                throw new ArgumentException(
                    "Meaning is required."
                );
            }

            var normalizedValue =
                value.ToLower();

            /*
             * Don't allow suggesting something that
             * already exists in the dictionary.
             */
            var wordExists =
                await mDbContext.Words
                    .AsNoTracking()
                    .AnyAsync(x =>
                        x.Value.ToLower()
                        == normalizedValue
                    );

            if (wordExists)
            {
                throw new InvalidOperationException(
                    "This word already exists."
                );
            }

            /*
             * Same user cannot repeatedly submit
             * the same pending suggestion.
             */
            var pendingExists =
                await mDbContext.WordSuggestions
                    .AsNoTracking()
                    .AnyAsync(x =>
                        x.UserId == uid &&
                        x.Status == Models.WordSuggestionStatus.Pending &&
                        x.Value.ToLower() == normalizedValue
                    );

            if (pendingExists)
            {
                throw new InvalidOperationException(
                    "You already have a pending suggestion for this word."
                );
            }

            var now = DateTime.UtcNow;

            var suggestion = new Models.WordSuggestion
            {
                Id = Guid.NewGuid().ToString(),

                UserId = uid,

                Value = value,
                Meaning = meaning,

                Level = args.Level,
                Topic = args.Topic,

                Cover = Clean(args.Cover),

                DemoURL = Clean(args.DemoURL),

                Instruction =
                    Clean(args.Instruction),

                Note = Clean(args.Note),

                Status = Models.WordSuggestionStatus.Pending,

                CreatedAt = now,
                UpdatedAt = now
            };

            mDbContext.WordSuggestions.Add(
                suggestion
            );

            await mDbContext.SaveChangesAsync();

            return Map(suggestion);
        }

        public async Task<IReadOnlyList<IWordSuggestionService.SuggestionResponse>> GetMineAsync(string uid)
        {
            return await mDbContext
                .WordSuggestions
                .AsNoTracking()
                .Where(x =>
                    x.UserId == uid
                )
                .OrderByDescending(x =>
                    x.CreatedAt
                )
                .Select(x =>
                    new IWordSuggestionService
                        .SuggestionResponse
                    {
                        Id = x.Id,

                        UserId = x.UserId,

                        Value = x.Value,
                        Meaning = x.Meaning,

                        Level = x.Level,
                        Topic = x.Topic,

                        Cover = x.Cover,
                        DemoURL = x.DemoURL,
                        Instruction = x.Instruction,

                        Note = x.Note,

                        Status = x.Status,

                        ApprovedWordId =
                            x.ApprovedWordId,

                        ReviewedByUserId =
                            x.ReviewedByUserId,

                        ReviewNote =
                            x.ReviewNote,

                        CreatedAt =
                            x.CreatedAt,

                        UpdatedAt =
                            x.UpdatedAt,

                        ReviewedAt =
                            x.ReviewedAt
                    }
                )
                .ToListAsync();
        }

        public async Task<IReadOnlyList<IWordSuggestionService.SuggestionResponse>> GetForAdminAsync(Models.WordSuggestionStatus? status)
        {
            var query = mDbContext.WordSuggestions
                                .AsNoTracking()
                                .AsQueryable();

            if (status.HasValue)
            {
                query = query.Where(x => x.Status == status.Value);
            }

            return await query
                .OrderByDescending(x =>
                    x.CreatedAt
                )
                .Select(x =>
                    new IWordSuggestionService
                        .SuggestionResponse
                    {
                        Id = x.Id,

                        UserId = x.UserId,

                        Value = x.Value,
                        Meaning = x.Meaning,

                        Level = x.Level,
                        Topic = x.Topic,

                        Cover = x.Cover,
                        DemoURL = x.DemoURL,
                        Instruction = x.Instruction,

                        Note = x.Note,

                        Status = x.Status,

                        ApprovedWordId = x.ApprovedWordId,

                        ReviewedByUserId = x.ReviewedByUserId,

                        ReviewNote = x.ReviewNote,

                        CreatedAt = x.CreatedAt,

                        UpdatedAt = x.UpdatedAt,

                        ReviewedAt = x.ReviewedAt
                    }
                )
                .ToListAsync();
        }

        public async Task<IWordSuggestionService.ApprovalResponse> ApproveAsync(string adminUid, string suggestionId, IWordSuggestionService.ApproveParams args)
        {
            await using var transaction = await mDbContext.Database.BeginTransactionAsync();

            var suggestion = await mDbContext
                    .WordSuggestions
                    .FirstOrDefaultAsync(x =>
                        x.Id == suggestionId
                    ) ?? throw new KeyNotFoundException("Suggestion not found.");
            if (suggestion.Status != Models.WordSuggestionStatus.Pending)
            {
                throw new InvalidOperationException("Suggestion has already been reviewed.");
            }

            /*
             * Admin values override submitted values.
             *
             * If null, use the original suggestion.
             */
            var value = Clean(args.Value) ?? suggestion.Value;

            var meaning = Clean(args.Meaning) ?? suggestion.Meaning;

            var cover = Clean(args.Cover) ?? suggestion.Cover;

            var demoURL = Clean(args.DemoURL) ?? suggestion.DemoURL;

            var instruction = Clean(args.Instruction) ?? suggestion.Instruction;

            var level = args.Level ?? suggestion.Level;

            var topic = args.Topic ?? suggestion.Topic;

            /*
             * Real Word requires complete content.
             */
            if (string.IsNullOrWhiteSpace(value))
            {
                throw new ArgumentException("Word is required.");
            }

            if (string.IsNullOrWhiteSpace(meaning))
            {
                throw new ArgumentException("Meaning is required.");
            }

            if (string.IsNullOrWhiteSpace(cover))
            {
                throw new ArgumentException("Cover is required.");
            }

            if (string.IsNullOrWhiteSpace(demoURL))
            {
                throw new ArgumentException("Demo URL is required.");
            }

            if (string.IsNullOrWhiteSpace(instruction))
            {
                throw new ArgumentException("Instruction is required.");
            }

            var normalizedValue = value.ToLower();

            var wordExists = await mDbContext.Words
                    .AnyAsync(x =>
                        x.Value.ToLower()
                        == normalizedValue
                    );

            if (wordExists)
            {
                throw new InvalidOperationException("A word with this value already exists.");
            }

            var now = DateTime.UtcNow;

            /*
             * Create actual dictionary Word.
             */
            var word = new Models.Word
            {
                Value = value,

                Meaning = meaning,

                Cover = cover,

                DemoURL = demoURL,

                Instruction = instruction,

                Level = level,

                Topic = topic,

                CreatedAt = now,

                UpdatedAt = now
            };

            mDbContext.Words.Add(word);

            /*
             * Need SaveChanges so generated Word.Id
             * becomes available.
             */
            await mDbContext.SaveChangesAsync();

            /*
             * Mark the suggestion as approved.
             */
            suggestion.Status = Models.WordSuggestionStatus.Approved;

            suggestion.ApprovedWordId = word.Id;

            suggestion.ReviewedByUserId = adminUid;

            suggestion.ReviewNote = Clean(args.ReviewNote);

            suggestion.ReviewedAt = now;

            suggestion.UpdatedAt = now;

            await mDbContext.SaveChangesAsync();

            await transaction.CommitAsync();

            return new IWordSuggestionService.ApprovalResponse
            {
                SuggestionId = suggestion.Id,
                WordId = word.Id,
                Status = suggestion.Status
            };
        }

        public async Task<IWordSuggestionService.SuggestionResponse> RejectAsync(string adminUid, string suggestionId, IWordSuggestionService.RejectParams args)
        {
            var suggestion = await mDbContext
                                        .WordSuggestions
                                        .FirstOrDefaultAsync(x =>
                                            x.Id == suggestionId
                                        ) ?? throw new KeyNotFoundException("Suggestion not found.");

            if (suggestion.Status != Models.WordSuggestionStatus.Pending)
            {
                throw new InvalidOperationException("Suggestion has already been reviewed.");
            }

            var now = DateTime.UtcNow;

            suggestion.Status = Models.WordSuggestionStatus.Rejected;

            suggestion.ReviewedByUserId = adminUid;

            suggestion.ReviewNote = Clean(args.ReviewNote);

            suggestion.ReviewedAt = now;

            suggestion.UpdatedAt = now;

            await mDbContext.SaveChangesAsync();

            return Map(suggestion);
        }

        private static string? Clean(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;

            return value.Trim();
        }

        private static IWordSuggestionService.SuggestionResponse Map(Models.WordSuggestion suggestion)
        {
            return new IWordSuggestionService.SuggestionResponse
            {
                Id = suggestion.Id,

                UserId = suggestion.UserId,

                Value = suggestion.Value,

                Meaning = suggestion.Meaning,

                Level = suggestion.Level,

                Topic = suggestion.Topic,

                Cover = suggestion.Cover,

                DemoURL = suggestion.DemoURL,

                Instruction = suggestion.Instruction,

                Note = suggestion.Note,

                Status = suggestion.Status,

                ApprovedWordId = suggestion.ApprovedWordId,

                ReviewedByUserId = suggestion.ReviewedByUserId,

                ReviewNote = suggestion.ReviewNote,

                CreatedAt = suggestion.CreatedAt,

                UpdatedAt = suggestion.UpdatedAt,

                ReviewedAt = suggestion.ReviewedAt
            };
        }
    }
}