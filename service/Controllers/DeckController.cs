using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Service.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/decks")]
    public sealed class DeckController(Services.IDeckService service) : ControllerBase
    {
        private readonly Services.IDeckService mService = service;

        private string? UserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

        [HttpGet]
        public async Task<IActionResult> List()
        {
            if (UserId is null) return Unauthorized();
            return Ok(await mService.ListAsync(UserId));
        }

        [HttpGet("{deckId}")]
        public async Task<IActionResult> Get(string deckId)
        {
            if (UserId is null) return Unauthorized();
            try { return Ok(await mService.GetAsync(UserId, deckId)); }
            catch (KeyNotFoundException) { return NotFound(); }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Services.IDeckService.DeckUpsertParams request)
        {
            if (UserId is null) return Unauthorized();
            try
            {
                var deck = await mService.CreateAsync(UserId, request);
                return CreatedAtAction(nameof(Get), new { deckId = deck.Id }, deck);
            }
            catch (ArgumentException e) { return BadRequest(e.Message); }
        }

        [HttpPut("{deckId}")]
        public async Task<IActionResult> Update(
            string deckId,
            [FromBody] Services.IDeckService.DeckUpsertParams request
        )
        {
            if (UserId is null) return Unauthorized();
            try { return Ok(await mService.UpdateAsync(UserId, deckId, request)); }
            catch (KeyNotFoundException) { return NotFound(); }
            catch (ArgumentException e) { return BadRequest(e.Message); }
        }

        [HttpDelete("{deckId}")]
        public async Task<IActionResult> Delete(string deckId)
        {
            if (UserId is null) return Unauthorized();
            try
            {
                await mService.DeleteAsync(UserId, deckId);
                return NoContent();
            }
            catch (KeyNotFoundException) { return NotFound(); }
            catch (Utils.ConflictException e) { return Conflict(e.Message); }
        }

        [HttpGet("{deckId}/cards")]
        public async Task<IActionResult> ListCards(
            string deckId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            if (UserId is null) return Unauthorized();
            try { return Ok(await mService.ListCardsAsync(UserId, deckId, page, pageSize)); }
            catch (KeyNotFoundException) { return NotFound(); }
        }

        [HttpPost("{deckId}/words")]
        public async Task<IActionResult> AddWords(
            string deckId,
            [FromBody] Services.IDeckService.AddWordToDeckParams request
        )
        {
            if (UserId is null) return Unauthorized();
            try { return Ok(await mService.AddWordToDeck(UserId, deckId, request)); }
            catch (KeyNotFoundException e) { return NotFound(e.Message); }
            catch (ArgumentException e) { return BadRequest(e.Message); }
        }

    }
}