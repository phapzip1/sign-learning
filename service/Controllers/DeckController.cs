using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Service.Controllers
{
    /// <summary>
    /// Endpoints for the signed-in user's decks (shown as "collections" in the UI).
    /// Every action only sees decks owned by the caller.
    /// </summary>
    [ApiController]
    [Authorize]
    [Route("api/decks")]
    public sealed class DeckController(Services.IDeckService service) : ControllerBase
    {
        private readonly Services.IDeckService mService = service;

        /// <summary>The caller's Clerk user id (the token's <c>sub</c> claim), or null when it is missing.</summary>
        private string? UserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

        /// <summary>GET /api/decks — lists the caller's decks with today's new, learning and due counts.</summary>
        [HttpGet]
        public async Task<IActionResult> List()
        {
            if (UserId is null) return Unauthorized();
            return Ok(await mService.ListAsync(UserId));
        }

        /// <summary>GET /api/decks/{deckId} — returns one deck with its study settings.</summary>
        /// <response code="404">The deck does not exist or belongs to someone else.</response>
        [HttpGet("{deckId}")]
        public async Task<IActionResult> Get(string deckId)
        {
            if (UserId is null) return Unauthorized();
            try { return Ok(await mService.GetAsync(UserId, deckId)); }
            catch (KeyNotFoundException) { return NotFound(); }
        }

        /// <summary>POST /api/decks — creates a deck. Settings left out of the body use the defaults.</summary>
        /// <response code="201">The created deck.</response>
        /// <response code="400">The name is missing or a setting is invalid.</response>
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

        /// <summary>
        /// PUT /api/decks/{deckId} — updates a deck. Only the fields present in the body change,
        /// so renaming a deck keeps its study settings.
        /// </summary>
        /// <response code="400">A setting is invalid.</response>
        /// <response code="404">The deck does not exist or belongs to someone else.</response>
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

        /// <summary>DELETE /api/decks/{deckId} — deletes a deck together with its cards and their review history.</summary>
        [HttpDelete("{deckId}")]
        public async Task<IActionResult> Delete(string deckId)
        {
            if (UserId is null) return Unauthorized();
            try
            {
                await mService.DeleteAsync(UserId, deckId);
                return Ok();
            }
            catch (KeyNotFoundException) { return NotFound(); }
            catch (Utils.ConflictException e) { return Conflict(e.Message); }
        }

        /// <summary>GET /api/decks/{deckId}/cards — lists the cards (words) in a deck.</summary>
        [HttpGet("{deckId}/cards")]
        public async Task<IActionResult> ListCards(
            string deckId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            if (UserId is null) return Unauthorized();
            try { return Ok(await mService.ListCardsAsync(UserId, deckId, page, pageSize)); }
            catch (KeyNotFoundException) { return NotFound(); }
        }

        /// <summary>
        /// POST /api/decks/{deckId}/words — adds words to a deck. A user has at most one card per word,
        /// so a word already in another of their decks is moved here with its study progress.
        /// </summary>
        /// <returns>How many words were added, moved, or were already in the deck.</returns>
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