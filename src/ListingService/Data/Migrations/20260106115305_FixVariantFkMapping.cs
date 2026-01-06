using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ListingService.Data.Migrations
{
    /// <inheritdoc />
    public partial class FixVariantFkMapping : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Listings_Variants_VariantId1",
                table: "Listings");

            migrationBuilder.DropIndex(
                name: "IX_Listings_VariantId1",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "VariantId1",
                table: "Listings");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "VariantId1",
                table: "Listings",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Listings_VariantId1",
                table: "Listings",
                column: "VariantId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Listings_Variants_VariantId1",
                table: "Listings",
                column: "VariantId1",
                principalTable: "Variants",
                principalColumn: "Id");
        }
    }
}
