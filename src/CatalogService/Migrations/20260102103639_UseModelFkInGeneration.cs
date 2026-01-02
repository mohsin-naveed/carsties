using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CatalogService.Migrations
{
    /// <inheritdoc />
    public partial class UseModelFkInGeneration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Generations_ModelBodies_ModelBodyId",
                table: "Generations");

            migrationBuilder.DropForeignKey(
                name: "FK_Generations_Models_ModelId",
                table: "Generations");

            migrationBuilder.DropIndex(
                name: "IX_Generations_ModelBodyId",
                table: "Generations");

            migrationBuilder.DropColumn(
                name: "ModelBodyId",
                table: "Generations");

            migrationBuilder.AlterColumn<int>(
                name: "ModelId",
                table: "Generations",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Generations_Models_ModelId",
                table: "Generations",
                column: "ModelId",
                principalTable: "Models",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Generations_Models_ModelId",
                table: "Generations");

            migrationBuilder.AlterColumn<int>(
                name: "ModelId",
                table: "Generations",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "ModelBodyId",
                table: "Generations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Generations_ModelBodyId",
                table: "Generations",
                column: "ModelBodyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Generations_ModelBodies_ModelBodyId",
                table: "Generations",
                column: "ModelBodyId",
                principalTable: "ModelBodies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Generations_Models_ModelId",
                table: "Generations",
                column: "ModelId",
                principalTable: "Models",
                principalColumn: "Id");
        }
    }
}
