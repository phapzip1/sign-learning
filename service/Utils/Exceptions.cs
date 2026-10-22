namespace Service.Utils
{
    /// <summary>Thrown when a change conflicts with existing data; controllers turn it into HTTP 409.</summary>
    public class ConflictException(string? message) : Exception(message)
    {
    }
}