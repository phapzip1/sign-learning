using System.Text.Json.Serialization;
using Clerk.BackendAPI;
using dotenv.net;

DotEnv.Load();

var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

var builder = WebApplication.CreateBuilder(args);

// Container platforms (Dockerfile.vercel) set PORT; locally launchSettings.json applies.
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

// Comma-separated list of frontend origins, e.g. set the env var
// Cors__AllowedOrigins="http://localhost:3000,https://my-ui.onrender.com".
var allowedOrigins = (builder.Configuration["Cors:AllowedOrigins"] ?? "http://localhost:3000")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    // Browsers send the Origin header without a trailing slash.
    .Select(origin => origin.TrimEnd('/'))
    .ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        name: MyAllowSpecificOrigins,
        policy =>
        {
            policy
                .WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    );
});

builder.Services.AddOpenApi();

//
// Authentication
//
builder.Services.AddClerkAuthentication(builder.Configuration);

//
// Authorization
//
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Admin", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireRole("admin");
    });
});

//
// Clerk backend
//
builder.Services.AddSingleton(sp =>
{
    var conf =
        sp.GetRequiredService<IConfiguration>();

    return new ClerkBackendApi(
        bearerAuth: conf["CLERK_API_KEY"]
    );
});

//
// App services
//
builder.Services.AddScoped<
    Service.Data.SignLearningContext
>();

builder.Services.AddScoped<
    Service.Utils.FsrsScheduler
>();

builder.Services.AddScoped<
    Service.Services.IUserService,
    Service.Services.UserService
>();

builder.Services.AddScoped<
    Service.Services.IWordService,
    Service.Services.WordService
>();

builder.Services.AddScoped<
    Service.Services.IDeckService,
    Service.Services.DeckService
>();

builder.Services.AddScoped<
    Service.Services.IReviewService,
    Service.Services.ReviewService
>();

builder.Services.AddScoped<
    Service.Services.IStatsService,
    Service.Services.StatsService
>();

builder.Services.AddScoped<
    Service.Services.IWordSuggestionService,
    Service.Services.WordSuggestionService
>();

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions
            .Converters
            .Add(
                new JsonStringEnumConverter()
            );
    });

var app = builder.Build();

app.UseCors(
    MyAllowSpecificOrigins
);

app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet(
    "/health",
    () => "OK"
);

app.MapControllers();

app.Run();