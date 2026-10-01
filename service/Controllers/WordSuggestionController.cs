using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Service.Controllers
{
    [ApiController]
    [Route("api/word-suggestions")]
    [Authorize]
    public sealed class WordSuggestionController(Services.IWordSuggestionService service) : ControllerBase
    {
        private readonly Services.IWordSuggestionService mService = service;

        private string? UserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

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