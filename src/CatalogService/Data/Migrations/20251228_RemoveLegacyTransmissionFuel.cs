using CatalogService.Data;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace CatalogService.Data.Migrations
{
    [DbContext(typeof(CatalogDbContext))]
    [Migration("20251228_RemoveLegacyTransmissionFuel")]
    public partial class RemoveLegacyTransmissionFuel : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Transmission",
                table: "Variants");
            migrationBuilder.DropColumn(
                name: "FuelType",
                table: "Variants");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Transmission",
                table: "Variants",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);
            migrationBuilder.AddColumn<string>(
                name: "FuelType",
                table: "Variants",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);
        }
    }
}
