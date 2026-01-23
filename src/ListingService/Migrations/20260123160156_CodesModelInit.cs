using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ListingService.Migrations
{
    /// <inheritdoc />
    public partial class CodesModelInit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Listings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    Mileage = table.Column<int>(type: "integer", nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Color = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    MakeCode = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    ModelCode = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    GenerationCode = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    DerivativeCode = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    VariantCode = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    TransmissionTypeCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    FuelTypeCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    BodyTypeCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MakeName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ModelName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    GenerationName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DerivativeName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    VariantName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    BodyTypeName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    TransmissionTypeName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    FuelTypeName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Seats = table.Column<short>(type: "smallint", nullable: true),
                    Doors = table.Column<short>(type: "smallint", nullable: true),
                    EngineSizeCC = table.Column<int>(type: "integer", nullable: true),
                    EngineL = table.Column<decimal>(type: "numeric", nullable: true),
                    BatteryKWh = table.Column<decimal>(type: "numeric", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Listings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ListingFeatures",
                columns: table => new
                {
                    ListingId = table.Column<int>(type: "integer", nullable: false),
                    FeatureId = table.Column<int>(type: "integer", nullable: false),
                    FeatureName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FeatureDescription = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ListingFeatures", x => new { x.ListingId, x.FeatureId });
                    table.ForeignKey(
                        name: "FK_ListingFeatures_Listings_ListingId",
                        column: x => x.ListingId,
                        principalTable: "Listings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ListingImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ListingId = table.Column<int>(type: "integer", nullable: false),
                    FileName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ThumbUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ListingImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ListingImages_Listings_ListingId",
                        column: x => x.ListingId,
                        principalTable: "Listings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ListingImages_ListingId",
                table: "ListingImages",
                column: "ListingId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ListingFeatures");

            migrationBuilder.DropTable(
                name: "ListingImages");

            migrationBuilder.DropTable(
                name: "Listings");
        }
    }
}
