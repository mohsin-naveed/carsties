using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CatalogService.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceModelBodiesWithDerivatives : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ModelBodies");

            migrationBuilder.CreateTable(
                name: "Derivatives",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ModelId = table.Column<int>(type: "integer", nullable: false),
                    GenerationId = table.Column<int>(type: "integer", nullable: true),
                    BodyTypeId = table.Column<int>(type: "integer", nullable: false),
                    Seats = table.Column<short>(type: "smallint", nullable: false),
                    Doors = table.Column<short>(type: "smallint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Derivatives", x => x.Id);
                    table.CheckConstraint("CK_Derivatives_Doors", "\"Doors\" BETWEEN 2 AND 5");
                    table.CheckConstraint("CK_Derivatives_Seats", "\"Seats\" BETWEEN 2 AND 9");
                    table.ForeignKey(
                        name: "FK_Derivatives_BodyTypes_BodyTypeId",
                        column: x => x.BodyTypeId,
                        principalTable: "BodyTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Derivatives_Generations_GenerationId",
                        column: x => x.GenerationId,
                        principalTable: "Generations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Derivatives_Models_ModelId",
                        column: x => x.ModelId,
                        principalTable: "Models",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Derivatives_BodyTypeId",
                table: "Derivatives",
                column: "BodyTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Derivatives_GenerationId",
                table: "Derivatives",
                column: "GenerationId");

            migrationBuilder.CreateIndex(
                name: "IX_Derivatives_ModelId",
                table: "Derivatives",
                column: "ModelId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Derivatives");

            migrationBuilder.CreateTable(
                name: "ModelBodies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BodyTypeId = table.Column<int>(type: "integer", nullable: false),
                    ModelId = table.Column<int>(type: "integer", nullable: false),
                    Doors = table.Column<short>(type: "smallint", nullable: false),
                    Seats = table.Column<short>(type: "smallint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModelBodies", x => x.Id);
                    table.CheckConstraint("CK_ModelBodies_Doors", "\"Doors\" BETWEEN 2 AND 5");
                    table.CheckConstraint("CK_ModelBodies_Seats", "\"Seats\" BETWEEN 2 AND 9");
                    table.ForeignKey(
                        name: "FK_ModelBodies_BodyTypes_BodyTypeId",
                        column: x => x.BodyTypeId,
                        principalTable: "BodyTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ModelBodies_Models_ModelId",
                        column: x => x.ModelId,
                        principalTable: "Models",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ModelBodies_BodyTypeId",
                table: "ModelBodies",
                column: "BodyTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_ModelBodies_ModelId",
                table: "ModelBodies",
                column: "ModelId");
        }
    }
}
