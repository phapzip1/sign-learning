using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Service.Controllers
{
    [ApiController]
    [Route("api/stats")]
    [Authorize]
    public class StatsController(Services.IStatsService service) : ControllerBase
    {
        private readonly Services.IStatsService mService = service;

        private string? UserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

        [HttpGet("streak")]
        public async Task<IActionResult> GetStreak()
        {
            if (UserId is null)
            {
                return Unauthorized();
            }

            return Ok(
                await mService.GetCurrentStreakAsync(UserId)
            );
        }

        [HttpGet("activity/{year:int}")]
        public async Task<IActionResult> GetActivity([FromRoute] int year)
        {
            if (UserId is null)
                return Unauthorized();

            try
            {
                return Ok(
                    await mService.GetYearActivityAsync(
                        UserId,
                        year
                    )
                );
            }
            catch (ArgumentException e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("line-chart/{period:int}")]
        public async Task<IActionResult> GetLineChart(
            [FromRoute] int period
        )
        {
            if (UserId is null)
                return Unauthorized();

            if (!Enum.IsDefined(typeof(Services.IStatsService.ActivityPeriod), period))
                return BadRequest("Invalid activity period.");

            return Ok(await mService.GetCurrentYearLineChartAsync(UserId, (Services.IStatsService.ActivityPeriod)period));
        }

        [HttpGet("years")]
        public async Task<IActionResult> GetActivityYears()
        {
            if (UserId is null)
                return Unauthorized();

            return Ok(
                await mService.GetAvailableYearsAsync(UserId)
            );
        }
    }
}