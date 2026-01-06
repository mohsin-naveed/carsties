using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ListingService.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddVariantFeaturesSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "VariantFeaturesJson",
                table: "Listings",
                type: "jsonb",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "VariantFeaturesJson",
                table: "Listings");
        }
    }
}
