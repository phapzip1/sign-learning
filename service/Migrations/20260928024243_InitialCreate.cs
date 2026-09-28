using System;
using Microsoft.EntityFrameworkCore.Migrations;
using MySql.EntityFrameworkCore.Metadata;

#nullable disable

namespace service.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Decks",
                columns: table => new
                {
                    Id = table.Column<string>(type: "varchar(255)", nullable: false),
                    Name = table.Column<string>(type: "longtext", nullable: false),
                    UserId = table.Column<string>(type: "longtext", nullable: false),
                    Description = table.Column<string>(type: "longtext", nullable: false),
                    LearningSteps = table.Column<int[]>(type: "longtext", nullable: false),
                    RelearningSteps = table.Column<int[]>(type: "longtext", nullable: false),
                    MaximumInterval = table.Column<uint>(type: "int unsigned", nullable: false),
                    NewCardsPerDay = table.Column<uint>(type: "int unsigned", nullable: false),
                    MaximumReviewsPerDay = table.Column<uint>(type: "int unsigned", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Decks", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Words",
                columns: table => new
                {
                    Id = table.Column<uint>(type: "int unsigned", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    Value = table.Column<string>(type: "longtext", nullable: false),
                    Cover = table.Column<string>(type: "longtext", nullable: false),
                    Meaning = table.Column<string>(type: "longtext", nullable: false),
                    Level = table.Column<int>(type: "int", nullable: false),
                    DemoURL = table.Column<string>(type: "longtext", nullable: false),
                    Instruction = table.Column<string>(type: "longtext", nullable: false),
                    Topic = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Words", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Cards",
                columns: table => new
                {
                    Id = table.Column<string>(type: "varchar(255)", nullable: false),
                    WordId = table.Column<uint>(type: "int unsigned", nullable: false),
                    DeckId = table.Column<string>(type: "varchar(255)", nullable: false),
                    State = table.Column<int>(type: "int", nullable: false),
                    Step = table.Column<int>(type: "int", nullable: true),
                    Stability = table.Column<float>(type: "float", nullable: false),
                    Difficulty = table.Column<float>(type: "float", nullable: false),
                    FirstReviewAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    LastReviewAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    DueAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cards", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Cards_Decks_DeckId",
                        column: x => x.DeckId,
                        principalTable: "Decks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Cards_Words_WordId",
                        column: x => x.WordId,
                        principalTable: "Words",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ReviewLogs",
                columns: table => new
                {
                    Id = table.Column<string>(type: "varchar(255)", nullable: false),
                    CardId = table.Column<string>(type: "varchar(255)", nullable: false),
                    ReviewDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    ReviewDuration = table.Column<int>(type: "int", nullable: true),
                    ClientEventId = table.Column<string>(type: "longtext", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReviewLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReviewLogs_Cards_CardId",
                        column: x => x.CardId,
                        principalTable: "Cards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Cards_DeckId",
                table: "Cards",
                column: "DeckId");

            migrationBuilder.CreateIndex(
                name: "IX_Cards_WordId",
                table: "Cards",
                column: "WordId");

            migrationBuilder.CreateIndex(
                name: "IX_ReviewLogs_CardId",
                table: "ReviewLogs",
                column: "CardId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReviewLogs");

            migrationBuilder.DropTable(
                name: "Cards");

            migrationBuilder.DropTable(
                name: "Decks");

            migrationBuilder.DropTable(
                name: "Words");
        }
    }
}
