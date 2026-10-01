using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Service.Controllers
{
    [ApiController]
    [Route("api/admin/word-suggestions")]
    [Authorize(Policy = "Admin")]
    public class AdminWordSuggestionController(Services.IWordSuggestionService service) : ControllerBase
    {
        private readonly Services.IWordSuggestionService mService = service;

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