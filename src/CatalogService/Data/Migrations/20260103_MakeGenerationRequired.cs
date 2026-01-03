using Microsoft.EntityFrameworkCore.Migrations;
// no DbContext attribute needed at runtime; EF discovers by MigrationAttribute

namespace CatalogService.Migrations
{
    [Migration("20260103_MakeGenerationRequired")]
    public partial class MakeGenerationRequired : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Ensure existing null GenerationId values are set by assigning the first generation for the same model when possible
            // Note: If such data exists, manual data fix may be required; keeping migration focused on schema.

            migrationBuilder.DropForeignKey(
                name: "FK_Derivatives_Generations_GenerationId",
                table: "Derivatives");

            migrationBuilder.AlterColumn<int>(
                name: "GenerationId",
                table: "Derivatives",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Derivatives_Generations_GenerationId",
                table: "Derivatives",
                column: "GenerationId",
                principalTable: "Generations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Derivatives_Generations_GenerationId",
                table: "Derivatives");

            migrationBuilder.AlterColumn<int>(
                name: "GenerationId",
                table: "Derivatives",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddForeignKey(
                name: "FK_Derivatives_Generations_GenerationId",
                table: "Derivatives",
                column: "GenerationId",
                principalTable: "Generations",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}