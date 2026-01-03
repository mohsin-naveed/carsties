using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CatalogService.Migrations
{
    public partial class VariantsUseDerivativeFk : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DerivativeId",
                table: "Variants",
                type: "integer",
                nullable: false,
                defaultValue: 0);
            migrationBuilder.Sql("UPDATE \"Variants\" v SET \"DerivativeId\" = (SELECT d.\"Id\" FROM \"Derivatives\" d WHERE d.\"GenerationId\" = v.\"GenerationId\" LIMIT 1) WHERE v.\"DerivativeId\" = 0;");
            migrationBuilder.DropColumn(
                name: "GenerationId",
                table: "Variants");
            migrationBuilder.AddForeignKey(
                name: "FK_Variants_Derivatives_DerivativeId",
                table: "Variants",
                column: "DerivativeId",
                principalTable: "Derivatives",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "GenerationId",
                table: "Variants",
                type: "integer",
                nullable: false,
                defaultValue: 0);
            migrationBuilder.DropForeignKey(
                name: "FK_Variants_Derivatives_DerivativeId",
                table: "Variants");
            migrationBuilder.DropColumn(
                name: "DerivativeId",
                table: "Variants");
        }
    }
}
