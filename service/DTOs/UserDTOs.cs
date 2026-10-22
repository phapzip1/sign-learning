namespace Service.DTOs
{
    /// <summary>The signed-in user's own profile.</summary>
    public record UserDTO
    {
        public required string ID { get; init; }
        public string? Username { get; init; }
        public string? FirtsName { get; init; }
        public string? LastName { get; init; }
        public string? ImageURL { get; init; }
        public string? Email { get; init; }
    }

    /// <summary>A user as shown to others: id and username only.</summary>
    public record RestrictedUserDTO
    {
        public required string ID { get; init; }
        public string? Username { get; init; }
    }
}