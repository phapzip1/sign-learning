using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Service.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/words")]
    public sealed class WordController(Services.IWordService service) : ControllerBase
    {
        private readonly Services.IWordService mService = service;

        [HttpGet]
        public async Task<ActionResult<DTOs.PageResultDTO<Models.Word>>> List(
            [FromQuery] string? search,
            [FromQuery] Models.Topic? topic,
            [FromQuery] Models.Level? level,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20
        ) => Ok(await mService.ListAsync(search, topic, level, page, pageSize));

        [HttpGet("{id}")]
        public async Task<ActionResult<Models.Word>> Get(uint id)
        {
            try { return Ok(await mService.GetAsync(id)); }
            catch (KeyNotFoundException) { return NotFound(); }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
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

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
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

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
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