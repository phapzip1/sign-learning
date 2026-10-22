using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Service.Controllers
{
    /// <summary>
    /// Dictionary endpoints. Reading words is public; creating, editing and deleting words
    /// requires the "Admin" policy.
    /// </summary>
    [ApiController]
    [Route("api/words")]
    public sealed class WordController(Services.IWordService service) : ControllerBase
    {
        private readonly Services.IWordService mService = service;

        /// <summary>GET /api/words — searches the dictionary with optional topic and level filters, a sort order and paging.</summary>
        [HttpGet]
        public async Task<ActionResult<DTOs.PageResultDTO<Models.Word>>> List(
            [FromQuery] string? search,
            [FromQuery] Models.Topic? topic,
            [FromQuery] Models.Level[]? levels,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] DTOs.SortDTO sort = DTOs.SortDTO.AlphabetAscending
        ) => Ok(await mService.ListAsync(search, topic, levels, sort, page, pageSize));

        /// <summary>GET /api/words/{id} — returns one word.</summary>
        /// <response code="404">No word has this id.</response>
        [HttpGet("{id}")]
        public async Task<ActionResult<Models.Word>> Get(uint id)
        {
            try { return Ok(await mService.GetAsync(id)); }
            catch (KeyNotFoundException) { return NotFound(); }
        }

        /// <summary>GET /api/words/{id}/deck — returns the caller's deck that contains this word.</summary>
        /// <response code="404">The word is not in any of the caller's decks.</response>
        [HttpGet("{id}/deck")]
        [Authorize]
        public async Task<ActionResult<Models.Deck>> GetWordDeck(uint id)
        {
            var UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (UserId is null) return Unauthorized();
            try { return Ok(await mService.GetDeckAsync(id, UserId)); }
            catch (KeyNotFoundException) { return NotFound(); }
        }

        /// <summary>POST /api/words — adds a word to the dictionary (admins only).</summary>
        /// <response code="400">A required field is missing or invalid.</response>
        [HttpPost]
        [Authorize(Policy = "Admin")]
        public async Task<ActionResult<Models.Word>> Create(
            [FromBody] Services.IWordService.WordUpsertParams request
        )
        {
            try
            {
                var word = await mService.CreateAsync(request);
                return CreatedAtAction(nameof(Get), new { id = word.Id }, word);
            }
            catch (ArgumentException e) { return BadRequest(e.Message); }
            catch (Utils.ConflictException e) { return Conflict(e.Message); }
        }

        /// <summary>PUT /api/words/{id} — edits a word (admins only).</summary>
        [HttpPut("{id}")]
        [Authorize(Policy = "Admin")]
        public async Task<ActionResult<Models.Word>> Update(
            uint id, [FromBody]
            Services.IWordService.WordUpsertParams request
        )
        {
            try { return Ok(await mService.UpdateAsync(id, request)); }
            catch (KeyNotFoundException) { return NotFound(); }
            catch (ArgumentException e) { return BadRequest(e.Message); }
            catch (Utils.ConflictException e) { return Conflict(e.Message); }
        }

        /// <summary>DELETE /api/words/{id} — deletes a word (admins only).</summary>
        /// <response code="409">The word is still in a learner's deck.</response>
        [HttpDelete("{id}")]
        [Authorize(Policy = "Admin")]
        public async Task<IActionResult> Delete(uint id)
        {
            try
            {
                await mService.DeleteAsync(id);
                return NoContent();
            }
            catch (KeyNotFoundException) { return NotFound(); }
            catch (Utils.ConflictException e) { return Conflict(e.Message); }
        }

    }
}