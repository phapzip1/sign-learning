namespace Service.Utils
{
    public sealed class FsrsScheduler
    {
        private static readonly float[] Parameters = [
            0.2172f,
            1.1771f,
            3.2602f,
            16.1507f,
            7.0114f,
            0.57f,
            2.0966f,
            0.0069f,
            1.5261f,
            0.112f,
            1.0178f,
            1.849f,
            0.1133f,
            0.3127f,
            2.2934f,
            0.2191f,
            3.0004f,
            0.7536f,
            0.3332f,
            0.1437f,
            0.2f,
        ];

        private const float DesiredRetention = 0.9f;
        private const float MinimumStability = 0.001f;

        private readonly float mDecay;
        private readonly float mFactor;

        public FsrsScheduler()
        {
            mDecay = Parameters[20];
            mFactor = MathF.Pow(0.9f, 1.0f / mDecay) - 1;
        }

        public void Review(Models.Card card, Models.RecallRating rating, DateTime reviewDate)
        {
            switch (card.State)
            {
                case Models.LearningState.Learning:
                    ReviewLearning(card, rating, reviewDate);
                    break;
                case Models.LearningState.Relearning:
                    ReviewRelearning(card, rating, reviewDate);
                    break;
                case Models.LearningState.Review:
                    ReviewReviewCard(card, rating, reviewDate);
                    break;
                default:
                    throw new ArgumentOutOfRangeException();
            }

            card.LastReviewAt = reviewDate;
            card.UpdatedAt = reviewDate;
        }

        private float InitialStability(Models.RecallRating rating)
        {
            var ratingVal = RatingValue(rating);

            return ClampStability(Parameters[ratingVal - 1]);
        }

        private float InitialDifficulty(Models.RecallRating rating)
        {
            var ratingVal = RatingValue(rating);

            float difficulty = Parameters[4] - MathF.Exp(Parameters[5] * (ratingVal - 1)) + 1;

            return ClampDifficulty(difficulty);
        }
        private float GetRetrievability(Models.Card card, DateTime reviewDate)
        {
            if (card.LastReviewAt == null)
            {
                return 0f;
            }

            float elapsedDays = MathF.Max(0, MathF.Floor((float)(reviewDate - card.LastReviewAt.Value).TotalDays));

            var stability = MathF.Max(card.Stability, MinimumStability);

            return MathF.Pow(1 + mFactor * elapsedDays / stability, mDecay);
        }

        private int NextInterval(float stability, uint maximumInterval)
        {
            var interval = stability / mFactor * (MathF.Pow(DesiredRetention, 1.0f / mDecay) - 1f);

            var days = (int)MathF.Round(interval);

            days = Math.Max(days, 1);

            var maxInterval = maximumInterval > int.MaxValue ? int.MaxValue : (int)maximumInterval;

            return Math.Min(days, maxInterval);
        }

        private float NextDifficulty(float difficulty, Models.RecallRating rating)
        {
            var ratingVal = RatingValue(rating);

            var initialEasyDifficulty = InitialDifficulty(Models.RecallRating.Easy);

            var deltaDifficulty = -Parameters[6] * (ratingVal - 3);

            var dampedDelta = (10.0f - difficulty) * deltaDifficulty / 9.0f;

            var adjustedDifficulty = difficulty + dampedDelta;

            var nextDifficulty = Parameters[7] * initialEasyDifficulty + (1 - Parameters[7]) * adjustedDifficulty;

            return ClampDifficulty(nextDifficulty);
        }

        private float NextRecallStability(
            float difficulty,
            float stability,
            float retrievability,
            Models.RecallRating rating
        )
        {
            float hardPenalty = rating == Models.RecallRating.Hard ? Parameters[15] : 1.0f;
            float easyBonus = rating == Models.RecallRating.Easy ? Parameters[16] : 1.0f;
            float nextStability = stability * (
                1.0f +
                MathF.Exp(Parameters[8]) *
                (11.0f - difficulty) *
                MathF.Pow(stability, -Parameters[9]) *
                (MathF.Exp((1 - retrievability) * Parameters[10]) - 1.0f) *
                hardPenalty *
                easyBonus
            );

            return ClampStability(nextStability);
        }

        private float NextForgetStability(
            float difficulty,
            float stability,
            float retrievability
        )
        {
            float longTerm = Parameters[11] *
                                MathF.Pow(difficulty, -Parameters[12]) *
                                (MathF.Pow(stability + 1.0f, Parameters[13]) - 1.0f) *
                                MathF.Exp((1.0f - retrievability) * Parameters[14]);
            float shortTerm = stability / MathF.Exp(Parameters[17] * Parameters[18]);

            return ClampStability(MathF.Min(longTerm, shortTerm));
        }

        private float NextStability(
            float difficulty,
            float stability,
            float retrievability,
            Models.RecallRating rating
        )
        {
            if (rating == Models.RecallRating.Again)
            {
                return NextForgetStability(difficulty, stability, retrievability);
            }

            return NextRecallStability(difficulty, stability, retrievability, rating);
        }

        private float ShortTermStability(float stability, Models.RecallRating rating)
        {
            var ratingVal = RatingValue(rating);

            var increase = MathF.Exp(Parameters[17] * (ratingVal - 3.0f + Parameters[18])) * MathF.Pow(stability, -Parameters[19]);

            if (rating is Models.RecallRating.Good or Models.RecallRating.Easy)
            {
                increase = MathF.Max(increase, 1.0f);
            }

            return ClampStability(stability * increase);
        }

        private void ReviewReviewCard(Models.Card card, Models.RecallRating rating, DateTime now)
        {
            var stability = MathF.Max(card.Stability, MinimumStability);
            var difficulty = Math.Clamp(card.Difficulty, 1.0f, 10.0f);
            var daysSinceLastReview = card.LastReviewAt.HasValue ? (float)(now - card.LastReviewAt.Value).TotalDays : (float?)null;

            if (daysSinceLastReview.HasValue && daysSinceLastReview.Value < 1.0f)
            {
                stability = ShortTermStability(stability, rating);
            }
            else
            {
                var retrievability = GetRetrievability(card, now);
                stability = NextStability(difficulty, stability, retrievability, rating);
            }

            difficulty = NextDifficulty(difficulty, rating);

            card.Stability = stability;
            card.Difficulty = difficulty;

            if (rating == Models.RecallRating.Again && card.Deck.RelearningSteps.Length > 0)
            {
                card.State = Models.LearningState.Learning;

                card.Step = 0;

                card.DueAt = now.AddSeconds(card.Deck.RelearningSteps[0]);

                return;
            }

            var nextInterval = NextInterval(stability, card.Deck.MaximumInterval);
            card.DueAt = now.AddDays(nextInterval);
        }

        private void GraduateToReview(Models.Card card, DateTime now)
        {
            card.State = Models.LearningState.Review;
            card.Step = null;

            var interval = NextInterval(card.Stability, card.Deck.MaximumInterval);

            card.DueAt = now.AddDays(interval);
        }

        private void ReviewRelearning(Models.Card card, Models.RecallRating rating, DateTime now)
        {
            float days = card.LastReviewAt.HasValue ? (float)(now - card.LastReviewAt.Value).TotalDays : 0.0f;

            if (days < 1)
            {
                card.Stability = ShortTermStability(card.Stability, rating);
            }
            else
            {
                var retrievability = GetRetrievability(card, now);
                card.Stability = NextStability(card.Difficulty, card.Stability, retrievability, rating);
            }

            card.Difficulty = NextDifficulty(card.Difficulty, rating);

            var steps = card.Deck.RelearningSteps;

            if (steps.Length == 0)
            {
                GraduateToReview(card, now);

                return;
            }

            var step = card.Step ?? 0;

            switch (rating)
            {
                case Models.RecallRating.Again:
                    card.Step = 0;
                    card.DueAt = now.AddSeconds(steps[0]);
                    break;
                case Models.RecallRating.Hard:
                    card.DueAt = now.AddSeconds(GetHardInterval(steps, step));
                    break;
                case Models.RecallRating.Good:
                    if (step + 1 >= steps.Length)
                    {
                        GraduateToReview(card, now);
                    }
                    else
                    {
                        card.Step = step + 1;
                        card.DueAt = now.AddSeconds(steps[step + 1]);
                    }
                    break;
                case Models.RecallRating.Easy:
                    GraduateToReview(card, now);
                    break;
                default:
                    throw new ArgumentOutOfRangeException();
            }
        }

        private void ReviewLearning(Models.Card card, Models.RecallRating rating, DateTime now)
        {
            if (card.Stability <= 0)
            {
                card.Stability = InitialStability(rating);
            }

            if (card.Difficulty <= 0)
            {
                card.Difficulty = InitialDifficulty(rating);
            }

            var steps = card.Deck.LearningSteps;

            if (steps.Length == 0)
            {
                GraduateToReview(card, now);

                return;
            }

            var step = card.Step ?? 0;

            switch (rating)
            {
                case Models.RecallRating.Again:
                    card.Step = 0;
                    card.DueAt = now.AddSeconds(steps[0]);
                    break;
                case Models.RecallRating.Hard:
                    card.DueAt = now.AddSeconds(GetHardInterval(steps, step));
                    break;
                case Models.RecallRating.Good:
                    if (step + 1 >= steps.Length)
                    {
                        GraduateToReview(card, now);
                    }
                    else
                    {
                        card.Step = step + 1;
                        card.DueAt = now.AddSeconds(steps[step + 1]);
                    }
                    break;
                case Models.RecallRating.Easy:
                    GraduateToReview(card, now);
                    break;
                default:
                    throw new ArgumentOutOfRangeException();
            }
        }

        private static int GetHardInterval(int[] steps, int step)
        {
            step = Math.Clamp(step, 0, steps.Length - 1);

            if (step == 0 && steps.Length == 1)
            {
                return (int)MathF.Round(steps[0] * 1.5f);
            }

            if (step == 0 && steps.Length >= 2)
            {
                return (steps[0] + steps[1]) / 2;
            }

            return steps[step];
        }

        private static int RatingValue(Models.RecallRating rating) => ((int)rating) + 1;

        private static float ClampDifficulty(float difficulty) => Math.Clamp(difficulty, 1.0f, 10.0f);

        private static float ClampStability(float stability) => Math.Max(stability, MinimumStability);
    }
}