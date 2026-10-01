using Microsoft.EntityFrameworkCore;
using Service.Data;

namespace Service.Services
{
    public interface IStatsService
    {
        public enum ActivityPeriod
        {
            Week = 0,
            Month = 1,
            Quarter = 2
        }

        public sealed class StreakResponse
        {
            public int CurrentStreak { get; set; }
        }

        public sealed class ActivityResponse
        {
            public DateOnly Date { get; set; }

            public int Count { get; set; }

            public int Level { get; set; }
        }

        public sealed class YearActivityResponse
        {
            public int Year { get; set; }

            public IReadOnlyList<ActivityResponse> Activities { get; set; } = [];
        }


        public sealed class LineChartPointResponse
        {
            public DateOnly Date { get; set; }
            public int Count { get; set; }
        }

        public sealed class LineChartResponse
        {
            public ActivityPeriod Period { get; set; }

            public DateOnly StartDate { get; set; }

            public DateOnly EndDate { get; set; }

            public IReadOnlyList<LineChartPointResponse> Data { get; set; } = [];
        }

        Task<StreakResponse> GetCurrentStreakAsync(string uid);
        Task<IReadOnlyList<int>> GetAvailableYearsAsync(string uid);
        Task<YearActivityResponse> GetYearActivityAsync(string uid, int year);
        Task<LineChartResponse> GetCurrentYearLineChartAsync(string uid, ActivityPeriod period);
    }

    public sealed class StatsService(SignLearningContext dbContext) : IStatsService
    {
        private readonly SignLearningContext mDbContext = dbContext;

        public async Task<IStatsService.StreakResponse> GetCurrentStreakAsync(string uid)
        {
            var today = DateTime.UtcNow.Date;

            var dates = await mDbContext.ReviewLogs
                .AsNoTracking()
                .Where(x =>
                    x.Card.Deck.UserId == uid &&
                    x.ReviewDate < today.AddDays(1)
                )
                .Select(x => x.ReviewDate.Date)
                .Distinct()
                .ToListAsync();

            if (dates.Count == 0)
            {
                return new IStatsService.StreakResponse
                {
                    CurrentStreak = 0
                };
            }

            var activeDates = dates.ToHashSet();

            /*
             * If the user hasn't studied today yet,
             * yesterday can still be the end of the current streak.
             */
            var cursor = activeDates.Contains(today)
                ? today
                : today.AddDays(-1);

            var streak = 0;

            while (activeDates.Contains(cursor))
            {
                streak++;
                cursor = cursor.AddDays(-1);
            }

            return new IStatsService.StreakResponse
            {
                CurrentStreak = streak
            };
        }

        public async Task<IStatsService.YearActivityResponse> GetYearActivityAsync(string uid, int year)
        {
            if (year < 2000 || year > DateTime.UtcNow.Year)
                throw new ArgumentException("Invalid year.");

            var start = new DateTime(year, 1, 1, 0, 0, 0, DateTimeKind.Utc);

            var end = start.AddYears(1);

            var raw = await mDbContext.ReviewLogs
                .AsNoTracking()
                .Where(x =>
                    x.Card.Deck.UserId == uid &&
                    x.ReviewDate >= start &&
                    x.ReviewDate < end
                )
                .GroupBy(x => x.ReviewDate.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    Count = g.Count()
                })
                .OrderBy(x => x.Date)
                .ToListAsync();

            var counts = raw.ToDictionary(
                x => x.Date,
                x => x.Count
            );

            var activities =
                new List<IStatsService.ActivityResponse>();

            /*
             * Return every day, including days with zero reviews.
             */
            for (
                var date = start;
                date < end;
                date = date.AddDays(1)
            )
            {
                var count = counts.GetValueOrDefault(date.Date);

                activities.Add(
                    new IStatsService.ActivityResponse
                    {
                        Date = DateOnly.FromDateTime(date),
                        Count = count,
                        Level = GetActivityLevel(count)
                    }
                );
            }

            return new IStatsService.YearActivityResponse
            {
                Year = year,
                Activities = activities
            };
        }

        public async Task<IStatsService.LineChartResponse> GetCurrentYearLineChartAsync(string uid, IStatsService.ActivityPeriod period)
        {
            var today = DateTime.UtcNow.Date;

            var start = period switch
            {
                IStatsService.ActivityPeriod.Week => today.AddDays(-6),

                IStatsService.ActivityPeriod.Month => today.AddMonths(-1),

                IStatsService.ActivityPeriod.Quarter => today.AddMonths(-3),

                _ => throw new ArgumentOutOfRangeException(
                    nameof(period),
                    "Invalid activity period."
                )
            };

            // End is exclusive, so this includes all of today.
            var end = today.AddDays(1);

            var raw = await mDbContext.ReviewLogs
                .AsNoTracking()
                .Where(x =>
                    x.Card.Deck.UserId == uid &&
                    x.ReviewDate >= start &&
                    x.ReviewDate < end
                )
                .GroupBy(x => x.ReviewDate.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            var counts = raw.ToDictionary(
                x => x.Date,
                x => x.Count
            );

            var data = new List<IStatsService.LineChartPointResponse>();

            for (
                var date = start;
                date < end;
                date = date.AddDays(1)
            )
            {
                data.Add(new IStatsService.LineChartPointResponse
                {
                    Date = DateOnly.FromDateTime(date),
                    Count = counts.GetValueOrDefault(date.Date)
                });
            }

            return new IStatsService.LineChartResponse
            {
                Period = period,
                StartDate = DateOnly.FromDateTime(start),
                EndDate = DateOnly.FromDateTime(today),
                Data = data
            };
        }

        public async Task<IReadOnlyList<int>> GetAvailableYearsAsync(string uid)
        {
            return await mDbContext.ReviewLogs
                                .AsNoTracking()
                                .Where(x =>
                                    x.Card.Deck.UserId == uid
                                )
                                .Select(x => x.ReviewDate.Year)
                                .Distinct()
                                .OrderByDescending(year => year)
                                .ToListAsync();
        }

        private static int GetActivityLevel(int count)
        {
            return count switch
            {
                <= 0 => 0,
                <= 10 => 1,
                <= 25 => 2,
                <= 50 => 3,
                _ => 4
            };
        }

        public Task<IStatsService.YearActivityResponse> GetYearActivityAsync(string uid, IStatsService.ActivityPeriod year)
        {
            throw new NotImplementedException();
        }
    }
}