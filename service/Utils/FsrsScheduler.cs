using Service.Models;

namespace Service.Utils
{

    public sealed class FsrsScheduler
    {
        /*
         * Parameters from the dart-fsrs implementation linked above.
         */
        private static readonly double[] DefaultParameters =
        [
            0.2172,
            1.1771,
            3.2602,
            16.1507,
            7.0114,
            0.57,
            2.0966,
            0.0069,
            1.5261,
            0.112,
            1.0178,
            1.849,
            0.1133,
            0.3127,
            2.2934,
            0.2191,
            3.0004,
            0.7536,
            0.3332,
            0.1437,
            0.2
        ];

        private const double StabilityMin = 0.001;
        private const double MinDifficulty = 1.0;
        private const double MaxDifficulty = 10.0;

        private readonly double[] mParameters;

        private readonly double mDesiredRetention;
        private readonly bool mEnableFuzzing;

        private readonly double mDecay;
        private readonly double mFactor;

        public FsrsScheduler(
            double desiredRetention = 0.9,
            bool enableFuzzing = true
        )
        {
            if (
                desiredRetention <= 0 ||
                desiredRetention >= 1
            )
            {
                throw new ArgumentOutOfRangeException(
                    nameof(desiredRetention)
                );
            }

            mParameters =
                (double[])DefaultParameters.Clone();

            mDesiredRetention =
                desiredRetention;

            mEnableFuzzing =
                enableFuzzing;

            /*
             * dart-fsrs:
             *
             * decay = -parameters[20]
             *
             * factor is calibrated so stability means
             * approximately 90% retention.
             */
            mDecay =
                -mParameters[20];

            mFactor =
                Math.Pow(
                    0.9,
                    1.0 / mDecay
                ) - 1.0;
        }

        /*
         * ----------------------------------------------------------------
         * Public API
         * ----------------------------------------------------------------
         */

        public void Review(
            Card card,
            RecallRating rating,
            DateTime now
        )
        {
            if (now.Kind != DateTimeKind.Utc)
            {
                throw new ArgumentException(
                    "Review time must be UTC.",
                    nameof(now)
                );
            }

            if (!Enum.IsDefined(
                typeof(RecallRating),
                rating
            ))
            {
                throw new ArgumentOutOfRangeException(
                    nameof(rating)
                );
            }

            if (card.Deck is null)
            {
                throw new InvalidOperationException(
                    "Card.Deck must be loaded before scheduling."
                );
            }

            /*
             * Your RecallRating is 0..3.
             *
             * FSRS uses 1..4.
             */
            var fsrsRating =
                ToFsrsRating(rating);

            var daysSinceLastReview =
                card.LastReviewAt.HasValue
                    ? Math.Max(
                        0,
                        (int)Math.Floor(
                            (
                                now -
                                card.LastReviewAt.Value
                            ).TotalDays
                        )
                    )
                    : (int?)null;

            TimeSpan nextInterval;

            switch (card.State)
            {
                /*
                 * dart-fsrs doesn't have a separate New state.
                 *
                 * A new card is effectively an uninitialized
                 * Learning card.
                 */
                case LearningState.New:
                    card.FirstReviewAt ??=
                        now;

                    card.State =
                        LearningState.Learning;

                    card.Step = 0;

                    card.Stability =
                        (float)InitialStability(
                            fsrsRating
                        );

                    card.Difficulty =
                        (float)InitialDifficulty(
                            fsrsRating
                        );

                    nextInterval =
                        ScheduleLearning(
                            card,
                            fsrsRating
                        );

                    break;

                case LearningState.Learning:
                    UpdateMemoryState(
                        card,
                        fsrsRating,
                        daysSinceLastReview,
                        now
                    );

                    nextInterval =
                        ScheduleLearning(
                            card,
                            fsrsRating
                        );

                    break;

                case LearningState.Review:
                    UpdateMemoryState(
                        card,
                        fsrsRating,
                        daysSinceLastReview,
                        now
                    );

                    nextInterval =
                        ScheduleReview(
                            card,
                            fsrsRating
                        );

                    break;

                case LearningState.Relearning:
                    UpdateMemoryState(
                        card,
                        fsrsRating,
                        daysSinceLastReview,
                        now
                    );

                    nextInterval =
                        ScheduleRelearning(
                            card,
                            fsrsRating
                        );

                    break;

                default:
                    throw new ArgumentOutOfRangeException(
                        nameof(card.State)
                    );
            }

            /*
             * dart-fsrs applies fuzz only to cards
             * ending in the Review state.
             */
            if (
                mEnableFuzzing &&
                card.State ==
                    LearningState.Review
            )
            {
                nextInterval =
                    GetFuzzedInterval(
                        nextInterval,
                        GetMaximumInterval(
                            card
                        )
                    );
            }

            card.DueAt =
                now.Add(
                    nextInterval
                );

            card.LastReviewAt =
                now;

            card.UpdatedAt =
                now;
        }

        public double GetRetrievability(
            Card card,
            DateTime now
        )
        {
            if (
                card.LastReviewAt is null ||
                card.Stability <= 0
            )
            {
                return 0;
            }

            var elapsedDays =
                Math.Max(
                    0,
                    (int)Math.Floor(
                        (
                            now -
                            card.LastReviewAt.Value
                        ).TotalDays
                    )
                );

            return Math.Pow(
                1.0 +
                mFactor *
                elapsedDays /
                card.Stability,

                mDecay
            );
        }

        /*
         * ----------------------------------------------------------------
         * Memory update
         * ----------------------------------------------------------------
         */

        private void UpdateMemoryState(
            Card card,
            FsrsRating rating,
            int? daysSinceLastReview,
            DateTime now
        )
        {
            /*
             * Safety for old/uninitialized cards.
             */
            if (
                card.Stability <= 0 ||
                card.Difficulty <= 0
            )
            {
                card.Stability =
                    (float)InitialStability(
                        rating
                    );

                card.Difficulty =
                    (float)InitialDifficulty(
                        rating
                    );

                return;
            }

            /*
             * Same-day review:
             * use FSRS short-term stability.
             */
            if (
                daysSinceLastReview.HasValue &&
                daysSinceLastReview.Value < 1
            )
            {
                card.Stability =
                    (float)ShortTermStability(
                        card.Stability,
                        rating
                    );

                card.Difficulty =
                    (float)NextDifficulty(
                        card.Difficulty,
                        rating
                    );

                return;
            }

            /*
             * Long-term review:
             * use retrievability.
             */
            var retrievability =
                GetRetrievability(
                    card,
                    now
                );

            card.Stability =
                (float)NextStability(
                    card.Difficulty,
                    card.Stability,
                    retrievability,
                    rating
                );

            card.Difficulty =
                (float)NextDifficulty(
                    card.Difficulty,
                    rating
                );
        }

        /*
         * ----------------------------------------------------------------
         * Learning
         * ----------------------------------------------------------------
         */

        private TimeSpan ScheduleLearning(
            Card card,
            FsrsRating rating
        )
        {
            var steps =
                card.Deck.LearningSteps
                ?? [];

            return ScheduleSteps(
                card,
                rating,
                steps,
                LearningState.Learning
            );
        }

        /*
         * ----------------------------------------------------------------
         * Relearning
         * ----------------------------------------------------------------
         */

        private TimeSpan ScheduleRelearning(
            Card card,
            FsrsRating rating
        )
        {
            var steps =
                card.Deck.RelearningSteps
                ?? [];

            return ScheduleSteps(
                card,
                rating,
                steps,
                LearningState.Relearning
            );
        }

        /*
         * Shared learning/relearning step logic.
         */
        private TimeSpan ScheduleSteps(
            Card card,
            FsrsRating rating,
            int[] steps,
            LearningState stepState
        )
        {
            var currentStep =
                Math.Max(
                    0,
                    card.Step ?? 0
                );

            /*
             * No learning steps configured:
             * go straight to Review.
             */
            if (steps.Length == 0)
            {
                return GraduateToReview(
                    card
                );
            }

            /*
             * Handles a deck whose step configuration
             * was shortened after this card was scheduled.
             *
             * Again is special because it can always
             * restart from step zero.
             */
            if (
                currentStep >= steps.Length &&
                rating != FsrsRating.Again
            )
            {
                return GraduateToReview(
                    card
                );
            }

            card.State =
                stepState;

            switch (rating)
            {
                case FsrsRating.Again:
                    {
                        card.Step = 0;

                        return StepInterval(
                            steps,
                            0
                        );
                    }

                case FsrsRating.Hard:
                    {
                        /*
                         * Hard doesn't advance the step.
                         */
                        if (currentStep >= steps.Length)
                        {
                            currentStep = 0;
                        }

                        card.Step =
                            currentStep;

                        /*
                         * dart-fsrs special handling
                         * for the first step.
                         */
                        if (
                            currentStep == 0 &&
                            steps.Length == 1
                        )
                        {
                            return TimeSpan.FromSeconds(
                                ValidStep(
                                    steps[0]
                                ) * 1.5
                            );
                        }

                        if (
                            currentStep == 0 &&
                            steps.Length >= 2
                        )
                        {
                            var first =
                                ValidStep(
                                    steps[0]
                                );

                            var second =
                                ValidStep(
                                    steps[1]
                                );

                            return TimeSpan.FromSeconds(
                                (first + second) / 2
                            );
                        }

                        return StepInterval(
                            steps,
                            currentStep
                        );
                    }

                case FsrsRating.Good:
                    {
                        var nextStep =
                            currentStep + 1;

                        /*
                         * Current step was the last step.
                         */
                        if (
                            nextStep >=
                            steps.Length
                        )
                        {
                            return GraduateToReview(
                                card
                            );
                        }

                        card.Step =
                            nextStep;

                        return StepInterval(
                            steps,
                            nextStep
                        );
                    }

                case FsrsRating.Easy:
                    return GraduateToReview(
                        card
                    );

                default:
                    throw new ArgumentOutOfRangeException(
                        nameof(rating)
                    );
            }
        }

        /*
         * ----------------------------------------------------------------
         * Review
         * ----------------------------------------------------------------
         */

        private TimeSpan ScheduleReview(
            Card card,
            FsrsRating rating
        )
        {
            if (rating == FsrsRating.Again)
            {
                var steps =
                    card.Deck.RelearningSteps
                    ?? [];

                if (steps.Length > 0)
                {
                    card.State =
                        LearningState.Relearning;

                    card.Step = 0;

                    return StepInterval(
                        steps,
                        0
                    );
                }
            }

            /*
             * Hard, Good, Easy — or Again with no
             * relearning steps — stay in Review.
             */
            card.State =
                LearningState.Review;

            card.Step =
                null;

            return ReviewInterval(
                card
            );
        }

        private TimeSpan GraduateToReview(
            Card card
        )
        {
            card.State =
                LearningState.Review;

            card.Step =
                null;

            return ReviewInterval(
                card
            );
        }

        private TimeSpan ReviewInterval(
            Card card
        )
        {
            var days =
                NextInterval(
                    card.Stability,
                    GetMaximumInterval(
                        card
                    )
                );

            return TimeSpan.FromDays(
                days
            );
        }

        /*
         * ----------------------------------------------------------------
         * FSRS equations
         * ----------------------------------------------------------------
         */

        private double InitialStability(
            FsrsRating rating
        )
        {
            var value =
                mParameters[
                    (int)rating - 1
                ];

            return ClampStability(
                value
            );
        }

        private double InitialDifficulty(
            FsrsRating rating
        )
        {
            var r =
                (int)rating;

            var difficulty =
                mParameters[4]
                -
                Math.Exp(
                    mParameters[5] *
                    (r - 1)
                )
                +
                1.0;

            return ClampDifficulty(
                difficulty
            );
        }

        private int NextInterval(
            double stability,
            int maximumInterval
        )
        {
            var next =
                (
                    stability /
                    mFactor
                )
                *
                (
                    Math.Pow(
                        mDesiredRetention,
                        1.0 / mDecay
                    )
                    -
                    1.0
                );

            var rounded =
                (int)Math.Round(
                    next,
                    MidpointRounding.AwayFromZero
                );

            rounded =
                Math.Max(
                    1,
                    rounded
                );

            rounded =
                Math.Min(
                    maximumInterval,
                    rounded
                );

            return rounded;
        }

        private double ShortTermStability(
            double stability,
            FsrsRating rating
        )
        {
            var r =
                (int)rating;

            var increase =
                Math.Exp(
                    mParameters[17] *
                    (
                        r -
                        3 +
                        mParameters[18]
                    )
                )
                *
                Math.Pow(
                    stability,
                    -mParameters[19]
                );

            if (
                rating == FsrsRating.Good ||
                rating == FsrsRating.Easy
            )
            {
                increase =
                    Math.Max(
                        increase,
                        1.0
                    );
            }

            return ClampStability(
                stability *
                increase
            );
        }

        private double NextDifficulty(
            double difficulty,
            FsrsRating rating
        )
        {
            var r =
                (int)rating;

            /*
             * Linear damping.
             */
            var deltaDifficulty =
                -(
                    mParameters[6] *
                    (r - 3)
                );

            var dampedDelta =
                (
                    10.0 -
                    difficulty
                )
                *
                deltaDifficulty
                /
                9.0;

            var candidate =
                difficulty +
                dampedDelta;

            /*
             * Mean reversion toward Easy's
             * initial difficulty.
             */
            var easyInitialDifficulty =
                InitialDifficulty(
                    FsrsRating.Easy
                );

            var next =
                mParameters[7] *
                easyInitialDifficulty
                +
                (
                    1.0 -
                    mParameters[7]
                )
                *
                candidate;

            return ClampDifficulty(
                next
            );
        }

        private double NextStability(
            double difficulty,
            double stability,
            double retrievability,
            FsrsRating rating
        )
        {
            double next;

            if (rating == FsrsRating.Again)
            {
                next =
                    NextForgetStability(
                        difficulty,
                        stability,
                        retrievability
                    );
            }
            else
            {
                next =
                    NextRecallStability(
                        difficulty,
                        stability,
                        retrievability,
                        rating
                    );
            }

            return ClampStability(
                next
            );
        }

        private double NextForgetStability(
            double difficulty,
            double stability,
            double retrievability
        )
        {
            var longTerm =
                mParameters[11]
                *
                Math.Pow(
                    difficulty,
                    -mParameters[12]
                )
                *
                (
                    Math.Pow(
                        stability + 1.0,
                        mParameters[13]
                    )
                    -
                    1.0
                )
                *
                Math.Exp(
                    (
                        1.0 -
                        retrievability
                    )
                    *
                    mParameters[14]
                );

            var shortTerm =
                stability
                /
                Math.Exp(
                    mParameters[17] *
                    mParameters[18]
                );

            return Math.Min(
                longTerm,
                shortTerm
            );
        }

        private double NextRecallStability(
            double difficulty,
            double stability,
            double retrievability,
            FsrsRating rating
        )
        {
            var hardPenalty =
                rating ==
                FsrsRating.Hard
                    ? mParameters[15]
                    : 1.0;

            var easyBonus =
                rating ==
                FsrsRating.Easy
                    ? mParameters[16]
                    : 1.0;

            return stability
                *
                (
                    1.0
                    +
                    Math.Exp(
                        mParameters[8]
                    )
                    *
                    (
                        11.0 -
                        difficulty
                    )
                    *
                    Math.Pow(
                        stability,
                        -mParameters[9]
                    )
                    *
                    (
                        Math.Exp(
                            (
                                1.0 -
                                retrievability
                            )
                            *
                            mParameters[10]
                        )
                        -
                        1.0
                    )
                    *
                    hardPenalty
                    *
                    easyBonus
                );
        }

        /*
         * ----------------------------------------------------------------
         * Fuzzing
         * ----------------------------------------------------------------
         */

        private static TimeSpan GetFuzzedInterval(
            TimeSpan interval,
            int maximumInterval
        )
        {
            var intervalDays =
                (int)Math.Round(
                    interval.TotalDays,
                    MidpointRounding.AwayFromZero
                );

            /*
             * dart-fsrs doesn't fuzz very short intervals.
             */
            if (intervalDays < 2.5)
            {
                return interval;
            }

            var delta = 1.0;

            delta +=
                0.15 *
                Math.Max(
                    Math.Min(
                        intervalDays,
                        7.0
                    ) -
                    2.5,
                    0
                );

            delta +=
                0.10 *
                Math.Max(
                    Math.Min(
                        intervalDays,
                        20.0
                    ) -
                    7.0,
                    0
                );

            delta +=
                0.05 *
                Math.Max(
                    intervalDays -
                    20.0,
                    0
                );

            var minDays =
                (int)Math.Round(
                    intervalDays -
                    delta,
                    MidpointRounding.AwayFromZero
                );

            var maxDays =
                (int)Math.Round(
                    intervalDays +
                    delta,
                    MidpointRounding.AwayFromZero
                );

            minDays =
                Math.Max(
                    2,
                    minDays
                );

            maxDays =
                Math.Min(
                    maximumInterval,
                    maxDays
                );

            minDays =
                Math.Min(
                    minDays,
                    maxDays
                );

            var range =
                maxDays -
                minDays +
                1;

            var fuzzed =
                minDays +
                (int)Math.Floor(
                    Random.Shared.NextDouble() *
                    range
                );

            fuzzed =
                Math.Min(
                    fuzzed,
                    maximumInterval
                );

            return TimeSpan.FromDays(
                fuzzed
            );
        }

        /*
         * ----------------------------------------------------------------
         * Helpers
         * ----------------------------------------------------------------
         */

        private static TimeSpan StepInterval(
            int[] steps,
            int index
        )
        {
            return TimeSpan.FromSeconds(
                ValidStep(
                    steps[index]
                )
            );
        }

        private static int ValidStep(
            int seconds
        )
        {
            if (seconds <= 0)
            {
                throw new InvalidOperationException(
                    "Learning steps must be greater than zero."
                );
            }

            return seconds;
        }

        private static int GetMaximumInterval(
            Card card
        )
        {
            if (card.Deck.MaximumInterval == 0)
            {
                return 1;
            }

            return card.Deck.MaximumInterval >
                   int.MaxValue
                ? int.MaxValue
                : (int)card.Deck.MaximumInterval;
        }

        private static double ClampDifficulty(
            double value
        )
        {
            return Math.Clamp(
                value,
                MinDifficulty,
                MaxDifficulty
            );
        }

        private static double ClampStability(
            double value
        )
        {
            return Math.Max(
                value,
                StabilityMin
            );
        }

        /*
         * Explicitly translate your 0..3 enum
         * to FSRS's 1..4 rating scale.
         */
        private static FsrsRating ToFsrsRating(
            RecallRating rating
        )
        {
            return rating switch
            {
                RecallRating.Again => FsrsRating.Again,

                RecallRating.Hard => FsrsRating.Hard,

                RecallRating.Good => FsrsRating.Good,

                RecallRating.Easy => FsrsRating.Easy,

                _ =>
                    throw new ArgumentOutOfRangeException(
                        nameof(rating)
                    )
            };
        }

        private enum FsrsRating
        {
            Again = 1,
            Hard = 2,
            Good = 3,
            Easy = 4
        }
    }
}