using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CatalogService.Migrations
{
    /// <inheritdoc />
    public partial class DerivativeUniqueNamePerGeneration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Derivatives_GenerationId",
                table: "Derivatives");

            migrationBuilder.CreateIndex(
                name: "IX_Derivatives_GenerationId_Name",
                table: "Derivatives",
                columns: new[] { "GenerationId", "Name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Derivatives_GenerationId_Name",
                table: "Derivatives");

            migrationBuilder.CreateIndex(
                name: "IX_Derivatives_GenerationId",
                table: "Derivatives",
                column: "GenerationId");
        }
    }
}
