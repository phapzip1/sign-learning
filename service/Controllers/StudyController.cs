using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Service.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/decks/{deckId}")]
    public class StudyController(Services.IReviewService mReviewService) : ControllerBase
    {
        private readonly Services.IReviewService mReviewService = mReviewService;

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