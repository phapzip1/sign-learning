using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

/// <summary>Sets up JWT bearer authentication for Clerk session tokens.</summary>
public static class ClerkAuthenticationExtensions
{
    /// <summary>
    /// Validates incoming Clerk session tokens (RS256) against the issuer in <c>Clerk:Issuer</c>.
    /// The token's claims, including <c>role</c>, become the request's user.
    /// </summary>
    public static IServiceCollection AddClerkAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.Authority =
                    configuration["Clerk:Issuer"];

                options.TokenValidationParameters =
                    new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidateAudience = false,
                        ValidAlgorithms = ["RS256"],
                        ClockSkew = TimeSpan.FromSeconds(5)
                    };
            });

        services.AddAuthorization();

        return services;
    }
}