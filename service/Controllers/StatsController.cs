using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Service.Controllers
{
    /// <summary>
    /// Learning statistics for the signed-in user, computed from their review history.
    /// Days are counted in UTC.
    /// </summary>
    [ApiController]
    [Route("api/stats")]
    [Authorize]
    public class StatsController(Services.IStatsService service) : ControllerBase
    {
        private readonly Services.IStatsService mService = service;

        /// <summary>The caller's Clerk user id (the token's <c>sub</c> claim), or null when it is missing.</summary>
        private string? UserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

        /// <summary>GET /api/stats/streak — the number of consecutive days with at least one review, ending today or yesterday.</summary>
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

        /// <summary>GET /api/stats/activity/{year} — review counts for every day of a year, for the study calendar.</summary>
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

        /// <summary>GET /api/stats/line-chart/{period} — daily review counts for the last week (0), month (1) or quarter (2).</summary>
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

        /// <summary>GET /api/stats/years — the years in which the user has any reviews, newest first.</summary>
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