using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Service.Controllers
{
    /// <summary>Moderation endpoints for word suggestions (admins only).</summary>
    [ApiController]
    [Route("api/admin/word-suggestions")]
    [Authorize(Policy = "Admin")]
    public class AdminWordSuggestionController(Services.IWordSuggestionService service) : ControllerBase
    {
        private readonly Services.IWordSuggestionService mService = service;

        /// <summary>The caller's Clerk user id (the token's <c>sub</c> claim), or null when it is missing.</summary>
        private string? UserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

        /*
         * Examples:
         *
         * GET /api/admin/word-suggestions
         *
         * GET /api/admin/word-suggestions?status=Pending
         *
         * GET /api/admin/word-suggestions?status=Approved
         *
         * GET /api/admin/word-suggestions?status=Rejected
         */
        /// <summary>GET /api/admin/word-suggestions — all suggestions, optionally filtered by status.</summary>
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] Models.WordSuggestionStatus? status)
        {
            if (UserId is null)
                return Unauthorized();

            return Ok(await mService.GetForAdminAsync(status));
        }

        /*
         * Approving creates the real Word.
         */
        /// <summary>POST /api/admin/word-suggestions/{suggestionId}/approve — approves a suggestion and creates the word.</summary>
        /// <response code="409">The suggestion was already reviewed, or the word already exists.</response>
        [HttpPost("{suggestionId}/approve")]
        public async Task<IActionResult> Approve(string suggestionId, [FromBody] Services.IWordSuggestionService.ApproveParams request)
        {
            if (UserId is null)
                return Unauthorized();

            try
            {
                return Ok(
                    await mService.ApproveAsync(
                        UserId,
                        suggestionId,
                        request
                    )
                );
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (ArgumentException e)
            {
                return BadRequest(
                    e.Message
                );
            }
            catch (InvalidOperationException e)
            {
                return Conflict(
                    e.Message
                );
            }
        }

        /// <summary>POST /api/admin/word-suggestions/{suggestionId}/reject — rejects a suggestion with a reason for the learner.</summary>
        /// <response code="409">The suggestion was already reviewed.</response>
        [HttpPost("{suggestionId}/reject")]
        public async Task<IActionResult> Reject(string suggestionId, [FromBody] Services.IWordSuggestionService.RejectParams request)
        {
            if (UserId is null)
                return Unauthorized();

            try
            {
                return Ok(
                    await mService.RejectAsync(
                        UserId,
                        suggestionId,
                        request
                    )
                );
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (InvalidOperationException e)
            {
                return Conflict(
                    e.Message
                );
            }
        }
    }
}