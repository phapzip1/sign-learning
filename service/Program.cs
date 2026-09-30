using System.Text.Json.Serialization;
using Clerk.BackendAPI;
using dotenv.net;

DotEnv.Load();

var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins, policy =>
    {
        policy.WithOrigins("http://localhost:3000").AllowAnyHeader().AllowAnyMethod().AllowCredentials();
    });
});

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddClerkAuthentication(builder.Configuration);
builder.Services.AddAuthorization();

builder.Services.AddSingleton(sp =>
{
    var conf = sp.GetRequiredService<IConfiguration>();

    return new ClerkBackendApi(
        bearerAuth: conf["CLERK_API_KEY"]
    );
});



builder.Services.AddScoped<Service.Data.SignLearningContext>();
builder.Services.AddScoped<Service.Services.IUserService, Service.Services.UserService>();
builder.Services.AddScoped<Service.Services.IWordService, Service.Services.WordService>();
builder.Services.AddScoped<Service.Services.IDeckService, Service.Services.DeckService>();
builder.Services.AddScoped<Service.Services.IReviewService, Service.Services.ReviewService>();
builder.Services.AddScoped<Service.Utils.FsrsScheduler>();
builder.Services.AddControllers().AddJsonOptions(opts =>
{
    opts.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

var app = builder.Build();

app.UseCors(MyAllowSpecificOrigins);
app.UseAuthentication();
app.UseAuthorization();


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet("/health", () => "OK");
app.MapControllers();


app.Run();