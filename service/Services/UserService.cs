using Clerk.BackendAPI;
using Clerk.BackendAPI.Models.Components;
using Clerk.BackendAPI.Models.Operations;

namespace Service.Services
{
    /// <summary>Reads and moderates users through Clerk's backend API.</summary>
    public interface IUserService
    {
        /// <summary>Gets one user by Clerk id.</summary>
        Task<User?> GetUserAsync(string userID);

        /// <summary>Gets a list of users.</summary>
        Task<IReadOnlyList<User>> GetUsersAsync(int limit, int offset);

        /// <summary>Bans (<paramref name="banned"/> = true) or unbans a user.</summary>
        /// <returns>Whether the user is banned afterwards.</returns>
        Task<bool> BanUserAsync(string userID, bool banned);
    }

    /// <summary>Clerk-backed implementation of <see cref="IUserService"/>.</summary>
    public class UserService(ClerkBackendApi clerk) : IUserService
    {
        private readonly ClerkBackendApi mClerk = clerk;

        /// <inheritdoc/>
        /// <remarks>Known issue: the two branches are swapped, so <c>true</c> currently unbans and <c>false</c> bans.</remarks>
        public async Task<bool> BanUserAsync(string userID, bool banned)
        {
            var getUserResponse = await mClerk.Users.GetAsync(userID);

            if (!getUserResponse.HttpMeta.Response.IsSuccessStatusCode)
            {
                throw new Exception("there was a error when fetching users");
            }

            bool banStatus = false;
            if (getUserResponse.User == null)
            {
                throw new Exception("user was not found");
            }

            if (!banned)
            {
                var resp = await mClerk.Users.BanAsync(userID);
                banStatus = resp.User?.Banned ?? false;
            }
            else
            {
                var resp = await mClerk.Users.UnbanAsync(userID);
                banStatus = resp.User?.Banned ?? false;
            }

            return banStatus;
        }

        public async Task<User?> GetUserAsync(string userID)
        {
            var resp = await mClerk.Users.GetAsync(userID);

            if (!resp.HttpMeta.Response.IsSuccessStatusCode)
            {
                throw new Exception("there was a error when fetching users");
            }

            if (resp.User == null)
            {
                throw new Exception("user was not found");
            }

            return resp.User;

        }

        /// <inheritdoc/>
        /// <remarks>Known issue: <paramref name="limit"/> and <paramref name="offset"/> are not passed to Clerk yet.</remarks>
        public async Task<IReadOnlyList<User>> GetUsersAsync(int limit = 100, int offset = 0)
        {
            var request = new GetUserListRequest
            {
                Limit = limit,
                Offset = offset
            };
            var usersResp = await mClerk.Users.ListAsync();

            if (!usersResp.HttpMeta.Response.IsSuccessStatusCode)
            {
                throw new Exception("there was a error when fetching users");
            }

            return usersResp.UserList ?? [];
        }
    }
}