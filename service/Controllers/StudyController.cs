using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Service.Controllers
{
    /// <summary>
    /// Endpoints for a flashcard study session in one deck: get the next card and submit a rating.
    /// The server decides which card comes next and when each card is due again.
    /// </summary>
    [ApiController]
    [Authorize]
    [Route("api/decks/{deckId}")]
    public class StudyController(Services.IReviewService mReviewService) : ControllerBase
    {
        private readonly Services.IReviewService mReviewService = mReviewService;

        /// <summary>The caller's Clerk user id (the token's <c>sub</c> claim), or null when it is missing.</summary>
        private string? UserId => User.FindFirstValue(ClaimTypes.NameIdentifier);


        /// <summary>GET /api/decks/{deckId}/study — returns the deck's new/learning/due counts and the next card to study, if any.</summary>
        [HttpGet("study")]
        public async Task<IActionResult> GetStudy(string deckId)
        {
            var uid = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(uid))
            {
                return Unauthorized();
            }

            try
            {
                var result = await mReviewService.GetStudyAsync(uid, deckId);

                return Ok(result);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        /// <summary>POST /api/decks/{deckId}/cards/{cardId}/review — records a rating and reschedules the card with FSRS.</summary>
        /// <response code="400">The rating is not valid.</response>
        /// <response code="409">The card cannot be studied now, e.g. the daily new-card limit is reached.</response>
        [HttpPost("cards/{cardId}/review")]
        public async Task<IActionResult> Review(string deckId, string cardId, [FromBody] ReviewBody body)
        {
            var uid = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(uid))
            {
                return Unauthorized();
            }


            try
            {
                var args = ReviewBody.ToService(uid, deckId, cardId, body);

                var result = await mReviewService.ReviewCardAsync(args);

                return Ok(result);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
        }

        /// <summary>
        /// Request body for a review. <see cref="ClientEventId"/> is a unique id per rating, so a retried
        /// request is recorded only once.
        /// </summary>
        public class ReviewBody
        {
            public Models.RecallRating Rating { get; set; }
            public int? ReviewDuration { get; set; }
            public string ClientEventId { get; set; } = null!;

            public static Services.IReviewService.ReviewCardParams ToService(string uid, string deckId, string cardId, ReviewBody body)
                => new()
                {
                    UID = uid,
                    DeckID = deckId,
                    CardID = cardId,
                    ClientEventId = body.ClientEventId,
                    Rating = body.Rating,
                    ReviewDuration = body.ReviewDuration
                };
        }
    }
}