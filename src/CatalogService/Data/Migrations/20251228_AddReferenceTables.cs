using CatalogService.Data;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CatalogService.Data.Migrations
{
    [DbContext(typeof(CatalogDbContext))]
    [Migration("20251228_AddReferenceTables")]
    public partial class AddReferenceTables : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Transmissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Transmissions", x => x.Id);
                });
            migrationBuilder.CreateIndex(
                name: "IX_Transmissions_Name",
                table: "Transmissions",
                column: "Name",
                unique: true);

            migrationBuilder.CreateTable(
                name: "FuelTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FuelTypes", x => x.Id);
                });
            migrationBuilder.CreateIndex(
                name: "IX_FuelTypes_Name",
                table: "FuelTypes",
                column: "Name",
                unique: true);

            migrationBuilder.AddColumn<int>(
                name: "TransmissionId",
                table: "Variants",
                type: "integer",
                nullable: true);
            migrationBuilder.AddColumn<int>(
                name: "FuelTypeId",
                table: "Variants",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Variants_TransmissionId",
                table: "Variants",
                column: "TransmissionId");
            migrationBuilder.CreateIndex(
                name: "IX_Variants_FuelTypeId",
                table: "Variants",
                column: "FuelTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Variants_Transmissions_TransmissionId",
                table: "Variants",
                column: "TransmissionId",
                principalTable: "Transmissions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
            migrationBuilder.AddForeignKey(
                name: "FK_Variants_FuelTypes_FuelTypeId",
                table: "Variants",
                column: "FuelTypeId",
                principalTable: "FuelTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Variants_Transmissions_TransmissionId",
                table: "Variants");
            migrationBuilder.DropForeignKey(
                name: "FK_Variants_FuelTypes_FuelTypeId",
                table: "Variants");
            migrationBuilder.DropIndex(
                name: "IX_Variants_TransmissionId",
                table: "Variants");
            migrationBuilder.DropIndex(
                name: "IX_Variants_FuelTypeId",
                table: "Variants");
            migrationBuilder.DropColumn(
                name: "TransmissionId",
                table: "Variants");
            migrationBuilder.DropColumn(
                name: "FuelTypeId",
                table: "Variants");
            migrationBuilder.DropTable(
                name: "Transmissions");
            migrationBuilder.DropTable(
                name: "FuelTypes");
        }
    }
}
