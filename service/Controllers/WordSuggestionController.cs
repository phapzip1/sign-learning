using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Service.Controllers
{
    /// <summary>Endpoints for learners to suggest new dictionary words and follow their status.</summary>
    [ApiController]
    [Route("api/word-suggestions")]
    [Authorize]
    public sealed class WordSuggestionController(Services.IWordSuggestionService service) : ControllerBase
    {
        private readonly Services.IWordSuggestionService mService = service;

        /// <summary>The caller's Clerk user id (the token's <c>sub</c> claim), or null when it is missing.</summary>
        private string? UserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

        /// <summary>POST /api/word-suggestions — submits a new word suggestion, which starts as Pending.</summary>
        /// <response code="409">The word is already in the dictionary, or the caller already has a pending suggestion for it.</response>
        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody]
            Services.IWordSuggestionService.CreateParams request
        )
        {
            if (UserId is null)
                return Unauthorized();

            try
            {
                var result = await mService.CreateAsync(UserId, request);

                return Ok(result);
            }
            catch (ArgumentException e)
            {
                return BadRequest(e.Message);
            }
            catch (InvalidOperationException e)
            {
                return Conflict(e.Message);
            }
        }

        /// <summary>GET /api/word-suggestions/mine — the caller's own suggestions with their status and reviewer notes.</summary>
        [HttpGet("mine")]
        public async Task<IActionResult> GetMine()
        {
            if (UserId is null)
                return Unauthorized();

            return Ok(
                await mService.GetMineAsync(
                    UserId
                )
            );
        }
    }
}