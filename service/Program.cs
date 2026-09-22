using Clerk.BackendAPI;
using dotenv.net;

DotEnv.Load();

var builder = WebApplication.CreateBuilder(args);


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


builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddControllers();

var app = builder.Build();

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