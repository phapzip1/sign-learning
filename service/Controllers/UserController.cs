using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Service.Controllers
{
    [ApiController]
    [Route("api/users")]
    public class UserController(Services.IUserService user, ILogger<UserController> logger) : ControllerBase
    {
        private readonly Services.IUserService mUser = user;
        private readonly ILogger<UserController> mLogger = logger;

        [HttpPut("{userID}/ban")]
        [HttpPatch("{userID}/ban")]
        [Authorize]
        public async Task<IActionResult> BanUser(string userID)
        {
            try
            {
                var banned = await mUser.BanUserAsync(userID, true);

                return Ok(banned);
            }
            catch (Exception e)
            {
                mLogger.LogError(e.Message);
                return StatusCode(500);
            }
        }

        [HttpPut("{userID}/unban")]
        [HttpPatch("{userID}/unban")]
        [Authorize]
        public async Task<IActionResult> UnbanUser(string userID)
        {
            try
            {
                var banned = await mUser.BanUserAsync(userID, false);

                return Ok(banned);
            }
            catch (Exception e)
            {
                mLogger.LogError(e.Message);
                return StatusCode(500);
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers([FromQuery] int limit = 100, [FromQuery] int offset = 0)
        {
            try
            {
                var users = await mUser.GetUsersAsync(limit, offset);

                var result = users.Select(user => new DTOs.RestrictedUserDTO
                {
                    ID = user.Id,
                    Username = user.Username
                }).ToList();

                return Ok(result);
            }
            catch (Exception e)
            {
                mLogger.LogError(e.Message);
                return StatusCode(500);
            }

        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMe()
        {
            try
            {
                var userID = User.FindFirst("sub")?.Value;

                if (string.IsNullOrEmpty(userID))
                {
                    return Unauthorized();
                }

                var user = await mUser.GetUserAsync(userID);

                if (user == null)
                {
                    return NotFound("user was not found");
                }

                var result = new DTOs.UserDTO
                {
                    ID = user.Id,
                    Username = user.Username,
                    FirtsName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.EmailAddresses?.FirstOrDefault(e => e.Id == user.PrimaryEmailAddressId)?.EmailAddressValue,
                };

                return Ok(result);
            }
            catch (Exception e)
            {
                mLogger.LogError(e.Message);
                return StatusCode(500);
            }
        }

    }
}